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

async function updateJobProgress(supabase: any, jobId: string, videoId: string, progress: number, step: string, status = "processing") {
  await supabase.from("processing_jobs").update({
    progress, current_step: step, status, updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  await supabase.from("videos").update({
    progress, current_step: step,
    status: status === "completed" ? "ready" : status,
    updated_at: new Date().toISOString(),
  }).eq("id", videoId);

  await supabase.from("job_logs").insert({
    job_id: jobId, level: "info", message: `[${progress}%] ${step}`,
  });
}

async function fetchYouTubeMeta(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const oembedRes = await fetch(oembedUrl);
  if (!oembedRes.ok) throw new Error("Video not found or unavailable");
  const oembed = await oembedRes.json();
  return {
    title: oembed.title || "Vídeo do YouTube",
    author: oembed.author_name || "Canal desconhecido",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

async function callIngestService(url: string, videoId: string, userId: string): Promise<{
  filePath: string;
  assetUrl?: string;
  title?: string;
  durationSeconds?: number;
  mimeType?: string;
  fileSize?: number;
}> {
  const ingestEndpoint = Deno.env.get("YOUTUBE_INGEST_ENDPOINT");
  if (!ingestEndpoint) {
    throw new Error("NO_INGEST_CONFIGURED");
  }

  console.log("[INGEST] Calling YOUTUBE_INGEST_ENDPOINT:", ingestEndpoint);
  const resp = await fetch(`${ingestEndpoint}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_url: url,
      video_id: videoId,
      user_id: userId,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("[INGEST] Endpoint error:", resp.status, text);
    throw new Error(`INGEST_FAILED_${resp.status}: ${text}`);
  }

  const data = await resp.json();
  if (!data?.file_path) {
    throw new Error("INGEST_NO_FILE_PATH");
  }

  return {
    filePath: data.file_path,
    assetUrl: data.asset_url,
    title: data.title,
    durationSeconds: data.duration_seconds,
    mimeType: data.mime_type,
    fileSize: data.file_size,
  };
}

// internalizeRemoteFile removed — the ingestor service now uploads directly to Supabase Storage

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, action, asset_url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = await fetchYouTubeMeta(videoId);
    const hasIngestConfig = Boolean(Deno.env.get("YOUTUBE_INGEST_ENDPOINT"));

    if (action === "validate") {
      return new Response(JSON.stringify({
        meta: {
          title: meta.title,
          description: `Canal: ${meta.author}`,
          thumbnail: meta.thumbnail,
          duration: "",
          videoId,
          ingest_supported: hasIngestConfig || Boolean(asset_url),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "import") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits
    const { data: credits } = await supabase.from("credits").select("balance").eq("user_id", user.id).single();
    if (!credits || credits.balance < 15) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes (mínimo: 15)" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create video record
    const { data: video, error: videoErr } = await supabase.from("videos").insert({
      user_id: user.id,
      title: meta.title,
      description: `Importado do YouTube. Canal: ${meta.author}`,
      language: "pt",
      category: "youtube-import",
      tags: ["youtube", "import"],
      status: "processing",
      source_type: "youtube",
      source_url: url,
      external_video_id: videoId,
      thumbnail_url: meta.thumbnail,
      progress: 2,
      current_step: "Criando importação",
    }).select().single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: videoErr?.message || "Failed to create video" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create job
    const { data: job, error: jobErr } = await supabase.from("processing_jobs").insert({
      video_id: video.id, user_id: user.id,
      status: "processing", progress: 2,
      current_step: "Inicializando ingestão",
      options: { generate_clips: true, generate_transcript: true, generate_captions: true, detect_moments: true },
    }).select().single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: jobErr?.message || "Failed to create job" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to internalize the YouTube video
    let resolvedAssetUrl: string | null = asset_url || null;
    let ingestMeta: any = null;

    if (!resolvedAssetUrl) {
      try {
        await updateJobProgress(serviceClient, job.id, video.id, 8, "Conectando ao serviço de ingestão...");
        ingestMeta = await resolveIngestAsset(url, videoId);
        resolvedAssetUrl = ingestMeta.downloadUrl;
      } catch (err: any) {
        console.error("[INGEST] Failed:", err.message);

        // NO FALLBACK TO EMBED — report the error clearly
        const isNotConfigured = err.message === "NO_INGEST_CONFIGURED";
        const errorMsg = isNotConfigured
          ? "Ingestão do YouTube indisponível. Configure YOUTUBE_INGEST_ENDPOINT nas secrets do projeto."
          : `Falha na ingestão: ${err.message}`;

        await updateJobProgress(serviceClient, job.id, video.id, 0, errorMsg, "failed");
        await serviceClient.from("videos").update({
          status: "failed",
          error_message: errorMsg,
          updated_at: new Date().toISOString(),
        }).eq("id", video.id);

        return new Response(JSON.stringify({
          error: errorMsg,
          requires_config: isNotConfigured,
          help: isNotConfigured
            ? "Adicione a secret YOUTUBE_INGEST_ENDPOINT com a URL do seu serviço de download de vídeo (ex: yt-dlp API)."
            : undefined,
          video: { id: video.id },
          job: { id: job.id },
        }), {
          status: isNotConfigured ? 501 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Download and internalize
    await updateJobProgress(serviceClient, job.id, video.id, 18, "Baixando mídia para storage interno...");
    const internalized = await internalizeRemoteFile(serviceClient, user.id, resolvedAssetUrl!, videoId);

    await serviceClient.from("videos").update({
      file_path: internalized.filePath,
      file_size: internalized.fileSize,
      source_type: "upload",
      progress: 25,
      current_step: "Mídia internalizada — iniciando processamento",
      status: "uploaded",
      duration_seconds: ingestMeta?.durationSeconds ?? null,
    }).eq("id", video.id);

    await serviceClient.from("job_logs").insert({
      job_id: job.id, level: "info",
      message: "✅ YouTube internalizado como asset interno",
      metadata: { internal_file_path: internalized.filePath, file_size: internalized.fileSize },
    });

    // Trigger process-video (now with real file_path)
    const processResp = await fetch(`${Deno.env.get("SUPABASE_URL")!}/functions/v1/process-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: video.id, user_id: user.id, job_id: job.id, options: job.options,
      }),
    });

    const processData = await processResp.json().catch(() => ({}));
    if (!processResp.ok) {
      await updateJobProgress(serviceClient, job.id, video.id, 30, processData.error || "Falha no processamento", "failed");
    }

    return new Response(JSON.stringify({
      video: { ...video, source_type: "upload", file_path: internalized.filePath },
      job,
      internalized: true,
      process: processData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[IMPORT] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
