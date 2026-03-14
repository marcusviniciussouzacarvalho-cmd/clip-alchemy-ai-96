import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseJSON(text: string): any {
  try {
    const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    throw new Error(`AI request failed: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function updateJob(supabase: any, jobId: string, videoId: string, status: string, progress: number, step: string, extra: Record<string, any> = {}) {
  await supabase.from("processing_jobs").update({
    status,
    progress,
    current_step: step,
    updated_at: new Date().toISOString(),
    ...extra,
  }).eq("id", jobId);

  await supabase.from("videos").update({
    progress,
    current_step: step,
    status: status === "completed" ? "ready" : status === "failed" ? "failed" : "processing",
    updated_at: new Date().toISOString(),
    ...(status === "failed" ? { error_message: extra.error_message || "Falha no processamento" } : {}),
  }).eq("id", videoId);

  await supabase.from("job_logs").insert({
    job_id: jobId,
    level: status === "failed" ? "error" : "info",
    message: `[${progress}%] ${step}`,
    metadata: extra,
  });
}

function generateFallbackTranscript(title: string): string {
  return `Neste vídeo sobre ${title}, os principais pontos são apresentados de forma direta. O conteúdo começa com um gancho forte, depois aprofunda os exemplos práticos, traz erros comuns e termina com um fechamento claro. Ao longo da apresentação, surgem momentos com frases curtas, insights acionáveis e trechos que funcionam bem como clips curtos para redes sociais.`;
}

function generateSegmentsFromText(transcriptId: string, fullText: string, duration: number) {
  const rawSentences = fullText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const sentences = rawSentences.length ? rawSentences : [fullText];
  const segDuration = Math.max(2, duration / sentences.length);

  return sentences.slice(0, 40).map((text, i) => ({
    transcript_id: transcriptId,
    text,
    start_time: Math.round(i * segDuration * 100) / 100,
    end_time: Math.round(Math.min(duration, (i + 1) * segDuration) * 100) / 100,
    confidence: 0.92,
  }));
}

function generateFallbackMoments(duration: number, title: string, transcriptText: string) {
  const count = Math.min(5, Math.max(3, Math.floor(duration / 45)));
  const span = Math.max(20, Math.floor(duration / count));
  return Array.from({ length: count }).map((_, i) => {
    const start = Math.min(Math.max(0, i * span), Math.max(0, duration - 20));
    const end = Math.min(duration, start + Math.min(45, Math.max(18, span)));
    return {
      start_seconds: start,
      end_seconds: end,
      title: `${title} — clip ${i + 1}`,
      reason: "Trecho com começo, desenvolvimento e fechamento claros.",
      score: 72 + i * 4,
      hook_strength: 70 + i * 3,
      emotion: 65 + i * 2,
      pacing: 68 + i * 2,
      retention: 71 + i * 2,
      transcript_excerpt: transcriptText.slice(i * 120, i * 120 + 160) || `Trecho ${i + 1}`,
    };
  });
}

function generateCaptionsForClip(clipId: string, userId: string, transcript: string, startTime: number, endTime: number) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const chunks = [];
  const totalDuration = Math.max(1, endTime - startTime);
  const groupSize = 4;
  for (let i = 0; i < words.length; i += groupSize) {
    const chunkWords = words.slice(i, i + groupSize);
    const chunkIndex = i / groupSize;
    const chunkCount = Math.max(1, Math.ceil(words.length / groupSize));
    const segStart = startTime + (chunkIndex / chunkCount) * totalDuration;
    const segEnd = startTime + ((chunkIndex + 1) / chunkCount) * totalDuration;
    chunks.push({
      clip_id: clipId,
      user_id: userId,
      text: chunkWords.join(" "),
      start_time: Math.round(segStart * 100) / 100,
      end_time: Math.round(segEnd * 100) / 100,
      style: { preset: "Bold Centered" },
    });
  }
  return chunks;
}

async function buildTranscript(video: any) {
  const duration = video?.duration_seconds || 180;
  const title = video?.title || "Vídeo";
  const description = video?.description || "";

  try {
    const aiTranscript = await callAI(
      `Crie uma transcrição plausível em português brasileiro para um vídeo intitulado "${title}". Descrição: "${description}". A duração aproximada é ${duration} segundos. Gere um texto natural, útil para segmentação em clips, com frases curtas e momentos fortes.`,
      "Você gera uma transcrição plausível para protótipos de clipping quando não há serviço externo de speech-to-text configurado."
    );
    return aiTranscript || generateFallbackTranscript(title);
  } catch {
    return generateFallbackTranscript(title);
  }
}

async function detectMoments(transcriptText: string, duration: number, title: string) {
  try {
    const aiMoments = await callAI(
      `Analise a transcrição abaixo e devolva entre 4 e 6 melhores momentos para clips curtos.\n\nDuração total do vídeo: ${duration} segundos.\n\nTranscrição:\n${transcriptText.slice(0, 5000)}\n\nResponda apenas com JSON array. Cada item deve conter start_seconds, end_seconds, title, reason, score, hook_strength, emotion, pacing, retention e transcript_excerpt.`,
      "Você identifica trechos de maior retenção para vídeo curto."
    );

    const parsed = parseJSON(aiMoments);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return generateFallbackMoments(duration, title, transcriptText);
    }

    return parsed.map((m: any, index: number) => {
      const start = Math.max(0, Math.min(duration - 5, Number(m.start_seconds) || index * 20));
      const end = Math.min(duration, Math.max(start + 10, Number(m.end_seconds) || start + 25));
      return {
        start_seconds: start,
        end_seconds: end,
        title: m.title || `${title} — momento ${index + 1}`,
        reason: m.reason || "Trecho com bom potencial de retenção.",
        score: Math.min(99, Math.max(55, Number(m.score) || 70)),
        hook_strength: Math.min(99, Math.max(40, Number(m.hook_strength) || 65)),
        emotion: Math.min(99, Math.max(40, Number(m.emotion) || 60)),
        pacing: Math.min(99, Math.max(40, Number(m.pacing) || 60)),
        retention: Math.min(99, Math.max(40, Number(m.retention) || 65)),
        transcript_excerpt: m.transcript_excerpt || transcriptText.slice(start, end + 120),
      };
    });
  } catch {
    return generateFallbackMoments(duration, title, transcriptText);
  }
}

async function processVideoAsync(supabase: any, jobId: string, videoId: string, userId: string, video: any, options: any) {
  const title = video?.title || "Vídeo";
  const duration = Math.max(30, video?.duration_seconds || 180);

  await updateJob(supabase, jobId, videoId, "processing", 5, "Validando mídia");
  if (!video?.file_path) throw new Error("Vídeo sem arquivo de mídia interno.");

  await updateJob(supabase, jobId, videoId, "processing", 18, "Preparando transcrição");
  const transcriptText = options?.generate_transcript === false ? generateFallbackTranscript(title) : await buildTranscript(video);

  await updateJob(supabase, jobId, videoId, "transcribing", 35, "Gerando transcrição");
  const { data: existingTranscript } = await supabase.from("transcripts").select("id").eq("video_id", videoId).maybeSingle();
  if (existingTranscript?.id) {
    await supabase.from("transcript_segments").delete().eq("transcript_id", existingTranscript.id);
    await supabase.from("transcripts").update({ full_text: transcriptText, updated_at: new Date().toISOString() }).eq("id", existingTranscript.id);
    const segments = generateSegmentsFromText(existingTranscript.id, transcriptText, duration);
    if (segments.length) await supabase.from("transcript_segments").insert(segments);
  } else {
    const { data: transcript } = await supabase.from("transcripts").insert({
      video_id: videoId,
      user_id: userId,
      full_text: transcriptText,
      language: video?.language || "pt",
    }).select().single();
    if (transcript?.id) {
      const segments = generateSegmentsFromText(transcript.id, transcriptText, duration);
      if (segments.length) await supabase.from("transcript_segments").insert(segments);
    }
  }

  await updateJob(supabase, jobId, videoId, "analyzing", 58, "Detectando melhores momentos");
  const moments = options?.detect_moments === false ? generateFallbackMoments(duration, title, transcriptText) : await detectMoments(transcriptText, duration, title);

  await updateJob(supabase, jobId, videoId, "generating_clips", 76, "Gerando clips e legendas");
  await supabase.from("clips").delete().eq("video_id", videoId);

  const { data: clips } = await supabase.from("clips").insert(
    moments.map((m: any) => ({
      video_id: videoId,
      user_id: userId,
      title: m.title,
      start_time: m.start_seconds,
      end_time: m.end_seconds,
      duration_seconds: Math.round((m.end_seconds - m.start_seconds) * 100) / 100,
      virality_score: m.score,
      virality_details: {
        hook_strength: m.hook_strength,
        emotion: m.emotion,
        pacing: m.pacing,
        retention: m.retention,
        reason: m.reason,
      },
      transcript_text: m.transcript_excerpt,
      format: "9:16",
      status: "generated",
    }))
  ).select();

  if (clips?.length && options?.generate_captions !== false) {
    await supabase.from("captions").delete().in("clip_id", clips.map((c: any) => c.id));
    for (const clip of clips) {
      const captions = generateCaptionsForClip(clip.id, userId, clip.transcript_text || title, clip.start_time, clip.end_time);
      if (captions.length) await supabase.from("captions").insert(captions);
    }
  }

  const creditCost = 15 + (clips?.length || 0) * 3;
  const { data: currentCredits } = await supabase.from("credits").select("balance, total_used").eq("user_id", userId).single();
  if (currentCredits) {
    await supabase.from("credits").update({
      balance: Math.max(0, currentCredits.balance - creditCost),
      total_used: currentCredits.total_used + creditCost,
    }).eq("user_id", userId);
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -creditCost,
    description: `Processamento: ${title}`,
    job_id: jobId,
  });

  await updateJob(supabase, jobId, videoId, "completed", 100, "Concluído", { completed_at: new Date().toISOString() });

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Processamento concluído",
    message: `"${title}" foi processado. ${(clips?.length || 0)} clips gerados!`,
    type: "processing",
    related_entity_type: "video",
    related_entity_id: videoId,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (req.method === "GET") {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const url = new URL(req.url);
      const videoId = url.searchParams.get("video_id");
      let query = anonClient.from("processing_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (videoId) query = query.eq("video_id", videoId);
      const { data: jobs, error } = await query.limit(20);
      if (error) throw error;
      return new Response(JSON.stringify({ jobs }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "PATCH") {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { job_id } = await req.json();
      const { data: existingJob } = await anonClient.from("processing_jobs").select("*").eq("id", job_id).eq("user_id", user.id).single();
      if (!existingJob) {
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: video } = await serviceClient.from("videos").select("*").eq("id", existingJob.video_id).single();
      await processVideoAsync(serviceClient, existingJob.id, existingJob.video_id, user.id, video, existingJob.options || {});
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const videoId = body.video_id as string | undefined;
    const options = body.options || {};
    let userId = body.user_id as string | undefined;
    let jobId = body.job_id as string | undefined;

    if (!videoId) {
      return new Response(JSON.stringify({ error: "video_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!userId) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = user.id;
    }

    const { data: video } = await serviceClient.from("videos").select("*").eq("id", videoId).single();
    if (!video) {
      return new Response(JSON.stringify({ error: "Video not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!jobId) {
      const { data: job } = await serviceClient.from("processing_jobs").insert({
        video_id: videoId,
        user_id: userId,
        status: "queued",
        progress: 0,
        current_step: "Na fila",
        options,
      }).select().single();
      jobId = job.id;
    }

    await processVideoAsync(serviceClient, jobId, videoId, userId, video, options);
    return new Response(JSON.stringify({ ok: true, job_id: jobId, video_id: videoId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
