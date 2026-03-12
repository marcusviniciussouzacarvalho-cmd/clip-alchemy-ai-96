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
      // Fetch metadata via oembed (no API key needed)
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
        duration: "", // oembed doesn't provide duration
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

      // Get metadata for the title
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
          status: "uploaded",
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
      const { data: job } = await supabase
        .from("processing_jobs")
        .insert({
          video_id: video.id,
          user_id: user.id,
          status: "queued",
          progress: 0,
          current_step: "Importando do YouTube",
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

      // Log
      if (job) {
        await supabase.from("job_logs").insert({
          job_id: job.id,
          level: "info",
          message: `Vídeo importado do YouTube: ${videoId}`,
          metadata: { youtube_url: url, video_id: video.id },
        });
      }

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
