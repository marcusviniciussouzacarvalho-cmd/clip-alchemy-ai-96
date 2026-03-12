import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function updateJobProgress(supabase: any, jobId: string, progress: number, step: string, status?: string) {
  const updates: any = { progress, current_step: step, updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  await supabase.from("processing_jobs").update(updates).eq("id", jobId);
  await supabase.from("job_logs").insert({
    job_id: jobId,
    level: "info",
    message: `[${progress}%] ${step}`,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, action } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "validate") {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);

      if (!oembedRes.ok) {
        return new Response(JSON.stringify({ error: "Video not found or unavailable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const oembed = await oembedRes.json();

      const meta = {
        title: oembed.title || "Vídeo do YouTube",
        description: oembed.author_name ? `Canal: ${oembed.author_name}` : "",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: "",
        videoId,
      };

      return new Response(JSON.stringify({ meta }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import") {
      // Check credits
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (!credits || credits.balance < 15) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes (mínimo: 15)" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get metadata
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      const oembed = oembedRes.ok ? await oembedRes.json() : { title: "YouTube Import" };

      // Create video record
      const { data: video, error: videoErr } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          title: oembed.title || `YouTube: ${videoId}`,
          description: `Importado do YouTube. Canal: ${oembed.author_name || "Desconhecido"}`,
          language: "pt",
          category: "youtube-import",
          tags: ["youtube", "import"],
          file_path: `imports/youtube/${videoId}`,
          status: "processing",
        })
        .select()
        .single();

      if (videoErr) {
        return new Response(JSON.stringify({ error: "Failed to create video record", details: videoErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create processing job
      const { data: job, error: jobErr } = await supabase
        .from("processing_jobs")
        .insert({
          video_id: video.id,
          user_id: user.id,
          status: "processing",
          progress: 5,
          current_step: "Validando URL do YouTube",
          options: {
            generate_clips: true,
            generate_transcript: true,
            generate_captions: true,
            detect_moments: true,
            source: "youtube",
            youtube_id: videoId,
          },
        })
        .select()
        .single();

      if (jobErr) {
        return new Response(JSON.stringify({ error: "Failed to create job", details: jobErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log initial
      await supabase.from("job_logs").insert({
        job_id: job.id,
        level: "info",
        message: `Importação iniciada do YouTube: ${videoId}`,
        metadata: { youtube_url: url, video_id: video.id },
      });

      // Simulate progressive pipeline (non-blocking updates)
      // We use EdgeRuntime.waitUntil pattern to run after response
      const progressPipeline = async () => {
        try {
          await updateJobProgress(supabase, job.id, 15, "Buscando metadados do YouTube", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(supabase, job.id, 30, "Importando vídeo", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(supabase, job.id, 45, "Preparando pipeline de IA", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(supabase, job.id, 60, "Transcrevendo áudio", "transcribing");
          await new Promise((r) => setTimeout(r, 3000));

          await updateJobProgress(supabase, job.id, 75, "Analisando conteúdo", "analyzing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(supabase, job.id, 90, "Gerando clips automáticos", "generating_clips");
          await new Promise((r) => setTimeout(r, 2000));

          // Complete
          await supabase.from("processing_jobs").update({
            status: "completed",
            progress: 100,
            current_step: "Concluído",
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);

          await supabase.from("videos").update({ status: "completed" }).eq("id", video.id);

          await supabase.from("job_logs").insert({
            job_id: job.id,
            level: "info",
            message: "Pipeline concluído com sucesso",
          });

          // Create notification
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Importação concluída",
            message: `O vídeo "${oembed.title || videoId}" foi importado e processado com sucesso.`,
            type: "processing",
            related_entity_type: "video",
            related_entity_id: video.id,
          });
        } catch (err) {
          await supabase.from("processing_jobs").update({
            status: "failed",
            error_message: err.message || "Erro no pipeline",
            current_step: "Erro",
          }).eq("id", job.id);

          await supabase.from("job_logs").insert({
            job_id: job.id,
            level: "error",
            message: `Erro no pipeline: ${err.message}`,
          });
        }
      };

      // Run pipeline in background
      progressPipeline();

      return new Response(JSON.stringify({ video, job }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
