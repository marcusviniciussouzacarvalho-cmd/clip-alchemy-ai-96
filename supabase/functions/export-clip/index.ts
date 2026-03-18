import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clip_id, video_id, start_time, end_time, format } = await req.json();
    let videoData: any = null;
    let clipData: any = null;

    if (clip_id) {
      const { data } = await supabase.from("clips").select("*, videos(*)").eq("id", clip_id).eq("user_id", user.id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: "Clip not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      clipData = data;
      videoData = data.videos;
    } else if (video_id) {
      const { data } = await supabase.from("videos").select("*").eq("id", video_id).eq("user_id", user.id).single();
      if (!data) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      videoData = data;
    } else {
      return new Response(JSON.stringify({ error: "clip_id or video_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Video MUST have an internal file
    if (!videoData.file_path) {
      return new Response(JSON.stringify({
        error: "Este vídeo não possui arquivo interno. A exportação requer mídia internalizada.",
        source_type: videoData.source_type,
        help: videoData.source_type === "youtube"
          ? "Reimporte o vídeo com YOUTUBE_INGEST_ENDPOINT configurado para internalizar o asset."
          : "Faça upload do vídeo novamente.",
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exportStart = clipData?.start_time ?? start_time ?? 0;
    const exportEnd = clipData?.end_time ?? end_time ?? videoData?.duration_seconds ?? 30;
    const duration = Math.max(0.1, exportEnd - exportStart);
    const exportFormat = format || clipData?.format || "9:16";
    const fileNameBase = (clipData?.title || videoData?.title || "clip").replace(/[^a-zA-Z0-9_-]+/g, "_");

    // Check for VIDEO_RENDER_ENDPOINT (server-side rendering)
    const renderEndpoint = Deno.env.get("VIDEO_RENDER_ENDPOINT");

    if (renderEndpoint) {
      // Server-side rendering via external service
      console.log("[EXPORT] Calling VIDEO_RENDER_ENDPOINT:", renderEndpoint);

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Generate signed URL for the render service
      const { data: signed } = await serviceClient.storage
        .from("videos")
        .createSignedUrl(videoData.file_path, 60 * 30); // 30min

      if (!signed?.signedUrl) {
        return new Response(JSON.stringify({ error: "Falha ao gerar URL do arquivo fonte" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const renderResp = await fetch(`${renderEndpoint}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_url: signed.signedUrl,
          video_id: videoData.id,
          clip_id: clipData?.id || null,
          start_time: Number(exportStart),
          end_time: Number(exportEnd),
          format: exportFormat,
          output_ext: "mp4",
        }),
      });

      if (!renderResp.ok) {
        const errText = await renderResp.text();
        console.error("[EXPORT] Render endpoint error:", renderResp.status, errText);
        return new Response(JSON.stringify({
          error: `Serviço de renderização falhou: ${renderResp.status}`,
          details: errText,
        }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const renderData = await renderResp.json();

      if (!renderData.download_url && !renderData.file_path) {
        return new Response(JSON.stringify({ error: "Render service returned no download_url or file_path" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        export: {
          source_type: "rendered_server",
          download_url: renderData.download_url || null,
          file_path: renderData.file_path || null,
          start_time: exportStart,
          end_time: exportEnd,
          duration,
          format: exportFormat,
          file_name: `${fileNameBase}.mp4`,
          clip_title: clipData?.title || videoData?.title || "Clip",
          render_method: "server_side",
          mime_type: renderData.mime_type || "video/mp4",
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No render endpoint configured — return error, no fake fallback
    return new Response(JSON.stringify({
      error: "Renderização server-side indisponível. Configure VIDEO_RENDER_ENDPOINT nas secrets do projeto.",
      requires_config: true,
      help: "Adicione a secret VIDEO_RENDER_ENDPOINT com a URL do seu serviço de renderização (ex: FFmpeg API).",
      fallback_available: false,
    }), {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[EXPORT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
