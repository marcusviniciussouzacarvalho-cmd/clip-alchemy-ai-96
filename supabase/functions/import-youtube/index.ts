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
    progress,
    current_step: step,
    status,
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  await supabase.from("videos").update({
    progress,
    current_step: step,
    status: status === "completed" ? "ready" : status,
    updated_at: new Date().toISOString(),
  }).eq("id", videoId);

  await supabase.from("job_logs").insert({
    job_id: jobId,
    level: "info",
    message: `[${progress}%] ${step}`,
  });
}

async function fetchYouTubeMeta(videoId: string) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const oembedRes = await fetch(oembedUrl);
  if (!oembedRes.ok) {
    throw new Error("Video not found or unavailable");
  }
  const oembed = await oembedRes.json();
  return {
    title: oembed.title || "Vídeo do YouTube",
    author: oembed.author_name || "Canal desconhecido",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  };
}

async function resolveIngestAsset(url: string, videoId: string) {
  const directAssetUrl = Deno.env.get("YOUTUBE_DIRECT_ASSET_URL");
  if (directAssetUrl) {
    return {
      downloadUrl: directAssetUrl.replace("{videoId}", videoId).replace("{url}", encodeURIComponent(url)),
      source: "direct_asset_url",
    };
  }

  const ingestEndpoint = Deno.env.get("YOUTUBE_INGEST_ENDPOINT");
  if (!ingestEndpoint) return null;

  const resp = await fetch(ingestEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, videoId }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Ingest endpoint failed: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  if (!data?.downloadUrl) {
    throw new Error("Ingest endpoint did not return downloadUrl");
  }

  return {
    downloadUrl: data.downloadUrl as string,
    durationSeconds: data.durationSeconds as number | undefined,
    source: "ingest_endpoint",
  };
}

async function internalizeRemoteFile(serviceClient: any, userId: string, remoteUrl: string, preferredName: string) {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch remote media: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "video/mp4";
  const ext = contentType.includes("webm") ? "webm" : contentType.includes("quicktime") ? "mov" : "mp4";
  const filePath = `${userId}/imports/${Date.now()}_${preferredName}.${ext}`;
  const bytes = new Uint8Array(await response.arrayBuffer());

  const { error } = await serviceClient.storage.from("videos").upload(filePath, bytes, {
    contentType,
    upsert: false,
  });

  if (error) throw new Error(error.message);
  return { filePath, fileSize: bytes.byteLength, contentType };
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

    const { url, action, asset_url } = await req.json();

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

    const meta = await fetchYouTubeMeta(videoId);

    if (action === "validate") {
      return new Response(JSON.stringify({
        meta: {
          title: meta.title,
          description: `Canal: ${meta.author}`,
          thumbnail: meta.thumbnail,
          duration: "",
          videoId,
          ingest_supported: Boolean(Deno.env.get("YOUTUBE_INGEST_ENDPOINT") || Deno.env.get("YOUTUBE_DIRECT_ASSET_URL") || asset_url),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action !== "import") {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: credits } = await supabase.from("credits").select("balance").eq("user_id", user.id).single();
    if (!credits || credits.balance < 15) {
      return new Response(JSON.stringify({ error: "Créditos insuficientes (mínimo: 15)" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
      return new Response(JSON.stringify({ error: videoErr?.message || "Failed to create video record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: jobErr } = await supabase.from("processing_jobs").insert({
      video_id: video.id,
      user_id: user.id,
      status: "processing",
      progress: 2,
      current_step: "Inicializando ingestão",
      options: {
        generate_clips: true,
        generate_transcript: true,
        generate_captions: true,
        detect_moments: true,
      },
    }).select().single();

    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: jobErr?.message || "Failed to create job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await updateJobProgress(serviceClient, job.id, video.id, 8, "Validando metadados do YouTube");

    let resolvedAssetUrl: string | null = asset_url || null;
    let ingestMetadata: any = null;

    if (!resolvedAssetUrl) {
      try {
        ingestMetadata = await resolveIngestAsset(url, videoId);
        resolvedAssetUrl = ingestMetadata?.downloadUrl || null;
      } catch (error: any) {
        await updateJobProgress(serviceClient, job.id, video.id, 12, `Falha no provedor de ingestão: ${error.message}`, "failed");
        await serviceClient.from("videos").update({
          status: "failed",
          error_message: error.message,
        }).eq("id", video.id);
        return new Response(JSON.stringify({
          error: "Não foi possível internalizar o vídeo automaticamente.",
          details: error.message,
          video,
          job,
        }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!resolvedAssetUrl) {
      await updateJobProgress(serviceClient, job.id, video.id, 10, "Vídeo aguardando URL de mídia interna", "failed");
      await serviceClient.from("videos").update({
        status: "failed",
        error_message: "Nenhum provedor de ingestão configurado. Defina YOUTUBE_INGEST_ENDPOINT ou envie asset_url.",
      }).eq("id", video.id);
      return new Response(JSON.stringify({
        error: "Ingestão automática indisponível.",
        details: "Configure YOUTUBE_INGEST_ENDPOINT / YOUTUBE_DIRECT_ASSET_URL ou envie asset_url no body.",
        video,
        job,
      }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await updateJobProgress(serviceClient, job.id, video.id, 18, "Baixando mídia para storage interno");
    const internalized = await internalizeRemoteFile(serviceClient, user.id, resolvedAssetUrl, videoId);

    await serviceClient.from("videos").update({
      file_path: internalized.filePath,
      file_size: internalized.fileSize,
      source_type: "upload",
      progress: 25,
      current_step: "Mídia internalizada",
      status: "uploaded",
      duration_seconds: ingestMetadata?.durationSeconds ?? video.duration_seconds,
    }).eq("id", video.id);

    await serviceClient.from("job_logs").insert({
      job_id: job.id,
      level: "info",
      message: "Vídeo do YouTube internalizado com sucesso",
      metadata: { remote_asset_url: resolvedAssetUrl, internal_file_path: internalized.filePath },
    });

    const processResp = await fetch(`${Deno.env.get("SUPABASE_URL")!}/functions/v1/process-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_id: video.id,
        user_id: user.id,
        job_id: job.id,
        options: job.options,
      }),
    });

    const processData = await processResp.json().catch(() => ({}));
    if (!processResp.ok) {
      await updateJobProgress(serviceClient, job.id, video.id, 30, processData.error || "Falha ao iniciar processamento", "failed");
      return new Response(JSON.stringify({ error: processData.error || "Failed to process video" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ video: { ...video, file_path: internalized.filePath, source_type: "upload" }, job, process: processData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
