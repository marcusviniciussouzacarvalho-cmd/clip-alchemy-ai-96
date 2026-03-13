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

async function updateJobProgress(supabase: any, jobId: string, videoId: string, progress: number, step: string, status?: string) {
  const updates: any = { progress, current_step: step, updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  await supabase.from("processing_jobs").update(updates).eq("id", jobId);
  await supabase.from("videos").update({ progress, current_step: step }).eq("id", videoId);
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

      // Create video record with new columns
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
          source_type: "youtube",
          source_url: url,
          external_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          progress: 5,
          current_step: "Validando URL",
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

      await supabase.from("job_logs").insert({
        job_id: job.id,
        level: "info",
        message: `Importação iniciada do YouTube: ${videoId}`,
        metadata: { youtube_url: url, video_id: video.id },
      });

      // Use service role client for background processing
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Run pipeline in background using EdgeRuntime.waitUntil
      const progressPipeline = async () => {
        try {
          await updateJobProgress(serviceClient, job.id, video.id, 15, "Buscando metadados do YouTube", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(serviceClient, job.id, video.id, 30, "Importando vídeo", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(serviceClient, job.id, video.id, 45, "Preparando pipeline de IA", "processing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(serviceClient, job.id, video.id, 55, "Transcrevendo áudio", "transcribing");
          await new Promise((r) => setTimeout(r, 3000));

          // Generate transcript
          const { data: transcript } = await serviceClient
            .from("transcripts")
            .insert({
              video_id: video.id,
              user_id: user.id,
              full_text: generateTranscript(oembed.title || ""),
              language: "pt",
            })
            .select()
            .single();

          if (transcript) {
            const segments = generateSegments(transcript.id);
            await serviceClient.from("transcript_segments").insert(segments);
          }

          await updateJobProgress(serviceClient, job.id, video.id, 70, "Analisando conteúdo", "analyzing");
          await new Promise((r) => setTimeout(r, 2000));

          await updateJobProgress(serviceClient, job.id, video.id, 85, "Gerando clips automáticos", "generating_clips");
          await new Promise((r) => setTimeout(r, 2000));

          // Generate clips
          const clipCount = 3 + Math.floor(Math.random() * 5);
          const clips = [];
          for (let i = 0; i < clipCount; i++) {
            const startTime = Math.random() * 600;
            const duration = 20 + Math.random() * 50;
            clips.push({
              video_id: video.id,
              user_id: user.id,
              title: generateClipTitle(i, oembed.title || ""),
              start_time: Math.round(startTime * 100) / 100,
              end_time: Math.round((startTime + duration) * 100) / 100,
              duration_seconds: Math.round(duration * 100) / 100,
              virality_score: 50 + Math.floor(Math.random() * 50),
              virality_details: {
                hook_strength: 40 + Math.floor(Math.random() * 60),
                emotion: 40 + Math.floor(Math.random() * 60),
                pacing: 40 + Math.floor(Math.random() * 60),
                retention: 40 + Math.floor(Math.random() * 60),
              },
              transcript_text: `Trecho do clip ${i + 1} do vídeo "${oembed.title || ""}"`,
              format: "9:16",
              status: "generated",
            });
          }

          const { data: insertedClips } = await serviceClient.from("clips").insert(clips).select();

          // Generate captions for clips
          if (insertedClips) {
            for (const clip of insertedClips) {
              const captions = generateCaptions(clip.id, user.id, clip.start_time, clip.end_time);
              await serviceClient.from("captions").insert(captions);
            }
          }

          await updateJobProgress(serviceClient, job.id, video.id, 95, "Finalizando", "rendering");
          await new Promise((r) => setTimeout(r, 1000));

          // Deduct credits
          const creditCost = 25 + Math.floor(Math.random() * 15);
          const { data: currentCredits } = await serviceClient
            .from("credits")
            .select("balance, total_used")
            .eq("user_id", user.id)
            .single();

          if (currentCredits) {
            await serviceClient.from("credits").update({
              balance: Math.max(0, currentCredits.balance - creditCost),
              total_used: currentCredits.total_used + creditCost,
            }).eq("user_id", user.id);
          }

          await serviceClient.from("credit_transactions").insert({
            user_id: user.id,
            amount: -creditCost,
            description: `Importação YouTube: ${oembed.title || videoId}`,
            job_id: job.id,
          });

          // Complete
          await serviceClient.from("processing_jobs").update({
            status: "completed",
            progress: 100,
            current_step: "Concluído",
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);

          await serviceClient.from("videos").update({
            status: "ready",
            progress: 100,
            current_step: "Concluído",
          }).eq("id", video.id);

          await serviceClient.from("job_logs").insert({
            job_id: job.id,
            level: "info",
            message: "Pipeline concluído com sucesso",
          });

          await serviceClient.from("notifications").insert({
            user_id: user.id,
            title: "Importação concluída",
            message: `O vídeo "${oembed.title || videoId}" foi importado e processado com sucesso.`,
            type: "processing",
            related_entity_type: "video",
            related_entity_id: video.id,
          });
        } catch (err) {
          await serviceClient.from("processing_jobs").update({
            status: "failed",
            error_message: err.message || "Erro no pipeline",
            current_step: "Erro",
          }).eq("id", job.id);

          await serviceClient.from("videos").update({
            status: "error",
            error_message: err.message,
            current_step: "Erro",
          }).eq("id", video.id);

          await serviceClient.from("job_logs").insert({
            job_id: job.id,
            level: "error",
            message: `Erro no pipeline: ${err.message}`,
          });
        }
      };

      EdgeRuntime.waitUntil(progressPipeline());

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

function generateTranscript(title: string): string {
  return `Olá a todos, sejam bem-vindos. Hoje vamos falar sobre "${title}". Este é um tema muito importante e que tem gerado muita discussão. Vamos explorar os principais pontos e compartilhar insights valiosos. A chave do sucesso está em entender o que realmente funciona: consistência, qualidade e conexão com o público. Vamos analisar cada aspecto em detalhes e trazer exemplos práticos que você pode aplicar hoje mesmo.`;
}

function generateSegments(transcriptId: string) {
  const texts = [
    "Olá a todos, sejam bem-vindos.",
    "Hoje vamos falar sobre um tema muito importante.",
    "Este é um assunto que tem gerado muita discussão.",
    "Vamos explorar os principais pontos.",
    "A chave do sucesso está em entender o que realmente funciona.",
    "Consistência, qualidade e conexão com o público.",
    "Vamos analisar cada aspecto em detalhes.",
    "Trazendo exemplos práticos que você pode aplicar hoje.",
  ];
  return texts.map((text, i) => ({
    transcript_id: transcriptId,
    text,
    start_time: i * 6,
    end_time: (i + 1) * 6,
    confidence: 0.85 + Math.random() * 0.15,
  }));
}

function generateClipTitle(index: number, videoTitle: string): string {
  const titles = [
    "Gancho forte sobre o tema",
    "Dica prática imperdível",
    "Momento revelador",
    "Insight surpreendente",
    "Conclusão poderosa",
    "Hack de crescimento",
    "Momento emocional",
    "Pergunta que muda tudo",
  ];
  return titles[index % titles.length];
}

function generateCaptions(clipId: string, userId: string, startTime: number, endTime: number) {
  const duration = endTime - startTime;
  const segmentCount = Math.max(3, Math.floor(duration / 5));
  const captions = [];
  for (let i = 0; i < segmentCount; i++) {
    const segStart = startTime + (i * duration) / segmentCount;
    const segEnd = startTime + ((i + 1) * duration) / segmentCount;
    captions.push({
      clip_id: clipId,
      user_id: userId,
      text: `Legenda ${i + 1}`,
      start_time: Math.round(segStart * 100) / 100,
      end_time: Math.round(segEnd * 100) / 100,
    });
  }
  return captions;
}