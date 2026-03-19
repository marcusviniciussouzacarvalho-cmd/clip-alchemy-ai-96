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
      temperature: 0.3,
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

function generateSegmentsFromWords(transcriptId: string, words: any[]): any[] {
  const segments: any[] = [];
  let currentWords: any[] = [];
  let segStart = 0;

  for (const word of words) {
    if (currentWords.length === 0) {
      segStart = word.start;
    }
    currentWords.push(word);

    const text = word.text || "";
    const isSentenceEnd = /[.!?]$/.test(text);
    const isLongEnough = currentWords.length >= 10;

    if (isSentenceEnd || isLongEnough) {
      segments.push({
        transcript_id: transcriptId,
        text: currentWords.map((w: any) => w.text).join(" "),
        start_time: Math.round(segStart * 100) / 100,
        end_time: Math.round((word.end || word.start + 0.5) * 100) / 100,
        confidence: 0.95,
        speaker: word.speaker || null,
      });
      currentWords = [];
    }
  }

  if (currentWords.length > 0) {
    const lastWord = currentWords[currentWords.length - 1];
    segments.push({
      transcript_id: transcriptId,
      text: currentWords.map((w: any) => w.text).join(" "),
      start_time: Math.round(segStart * 100) / 100,
      end_time: Math.round((lastWord.end || lastWord.start + 0.5) * 100) / 100,
      confidence: 0.95,
      speaker: lastWord.speaker || null,
    });
  }

  return segments;
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
    confidence: 0.5,
  }));
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

async function transcribeWithElevenLabs(supabase: any, video: any): Promise<{ text: string; words: any[]; source: string }> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) {
    throw new Error("NO_STT_KEY");
  }

  if (!video.file_path) {
    throw new Error("NO_FILE_PATH");
  }

  // Check file size first — ElevenLabs has limits and edge functions have timeouts
  console.log("[STT] Downloading video from storage:", video.file_path);
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("videos")
    .download(video.file_path);

  if (downloadError || !fileData) {
    console.error("[STT] Download error:", downloadError);
    throw new Error("DOWNLOAD_FAILED");
  }

  const fileSizeMB = fileData.size / (1024 * 1024);
  console.log("[STT] File downloaded, size:", fileSizeMB.toFixed(1), "MB");

  // Warn if file is very large (>50MB) — may timeout
  if (fileSizeMB > 200) {
    console.warn("[STT] File too large for edge function processing:", fileSizeMB.toFixed(1), "MB");
    throw new Error("FILE_TOO_LARGE");
  }

  console.log("[STT] Sending to ElevenLabs Scribe v2...");

  const formData = new FormData();
  const fileName = video.file_path.split("/").pop() || "video.mp4";
  formData.append("file", new File([fileData], fileName, { type: fileData.type || "video/mp4" }));
  formData.append("model_id", "scribe_v2");
  formData.append("tag_audio_events", "true");
  formData.append("diarize", "true");
  formData.append("language_code", video.language === "pt" ? "por" : video.language === "en" ? "eng" : "por");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

  try {
    const sttResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!sttResponse.ok) {
      const errText = await sttResponse.text();
      console.error("[STT] ElevenLabs error:", sttResponse.status, errText);
      throw new Error(`STT_API_ERROR_${sttResponse.status}`);
    }

    const transcription = await sttResponse.json();
    console.log("[STT] ✅ Real transcription received. Text length:", transcription.text?.length, "Words:", transcription.words?.length);

    if (!transcription.text || transcription.text.length < 10) {
      console.warn("[STT] Transcription too short or empty, treating as failure");
      throw new Error("STT_EMPTY_RESULT");
    }

    return {
      text: transcription.text,
      words: transcription.words || [],
      source: "elevenlabs_real_audio",
    };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("STT_TIMEOUT");
    }
    throw err;
  }
}

async function buildTranscript(supabase: any, video: any, jobId: string, videoId: string): Promise<{ text: string; words: any[]; source: string }> {
  const title = video?.title || "Vídeo";
  const hasFile = !!video?.file_path;

  // Try real STT first if we have a file
  if (hasFile) {
    try {
      const result = await transcribeWithElevenLabs(supabase, video);
      return result;
    } catch (err: any) {
      const reason = err.message || "unknown";
      console.warn("[STT] Real transcription failed:", reason);
      
      // Log the failure clearly
      await supabase.from("job_logs").insert({
        job_id: jobId,
        level: "warn",
        message: `[STT] Transcrição real falhou: ${reason}. Usando fallback por IA.`,
        metadata: { error: reason, file_path: video.file_path, file_size: video.file_size },
      });

      // Update status to show fallback is being used
      await updateJob(supabase, jobId, videoId, "transcribing", 25, `STT falhou (${reason}). Gerando transcrição por IA...`);
    }
  }

  // AI-generated fallback — generate based on title/description only
  // IMPORTANT: clearly mark this as synthetic, NOT real audio content
  const description = video?.description || "";
  const duration = video?.duration_seconds || 180;

  try {
    const aiTranscript = await callAI(
      `Eu preciso de um placeholder de transcrição para um vídeo chamado "${title}".
Descrição do vídeo: "${description || 'sem descrição'}".
Duração aproximada: ${duration} segundos.

IMPORTANTE: Este é apenas um PLACEHOLDER porque a transcrição real do áudio falhou.
Gere um texto curto e genérico que sirva como marcador temporário.
NÃO invente conteúdo específico — apenas indique que a transcrição real não está disponível.
Exemplo: "Transcrição automática indisponível para este vídeo. O conteúdo de áudio não pôde ser processado. Tente reprocessar o vídeo ou verifique se o arquivo de áudio está correto."`,
      "Você gera textos placeholder para quando a transcrição de áudio real não está disponível. Seja breve e honesto."
    );
    return { text: aiTranscript || `Transcrição indisponível para "${title}"`, words: [], source: "ai_fallback_placeholder" };
  } catch {
    return { text: `Transcrição indisponível para "${title}". Reprocesse o vídeo para tentar novamente.`, words: [], source: "fallback_unavailable" };
  }
}

async function detectMoments(transcriptText: string, duration: number, title: string, transcriptSource: string) {
  // If transcript is not from real audio, generate basic time-based clips
  if (transcriptSource !== "elevenlabs_real_audio") {
    console.log("[MOMENTS] Transcript is not from real audio, generating time-based clips");
    return generateBasicMoments(duration, title, transcriptSource);
  }

  try {
    const aiMoments = await callAI(
      `Analise a transcrição REAL abaixo (extraída do áudio do vídeo) e identifique os 4 a 6 MELHORES momentos para clips curtos de redes sociais.

REGRAS OBRIGATÓRIAS:
1. O título de cada clip DEVE ser uma frase extraída diretamente ou derivada do conteúdo real da transcrição.
2. NÃO invente títulos genéricos como "Momento Impactante" ou "O Início". Use as palavras reais do falante.
3. Cada clip deve ter entre 15 e 60 segundos.
4. O campo "transcript_excerpt" deve conter o texto EXATO daquele trecho da transcrição.
5. Priorize: ganchos fortes, frases de impacto, mudanças de tom, momentos emocionais, revelações.
6. Os timestamps (start_seconds, end_seconds) devem corresponder ao conteúdo real.

Duração total do vídeo: ${duration} segundos.
Título do vídeo: "${title}"

TRANSCRIÇÃO REAL:
${transcriptText.slice(0, 8000)}

Responda APENAS com um JSON array. Cada item:
{
  "start_seconds": number,
  "end_seconds": number,
  "title": "frase real ou derivada do conteúdo",
  "reason": "por que este momento é bom para clip",
  "score": number (50-99),
  "hook_strength": number (40-99),
  "emotion": number (40-99),
  "pacing": number (40-99),
  "retention": number (40-99),
  "transcript_excerpt": "texto exato do trecho"
}`,
      `Você é um especialista em conteúdo viral e análise de vídeos para redes sociais.
Sua tarefa é identificar os melhores momentos de um vídeo baseado na transcrição REAL do áudio.
Os títulos devem SEMPRE refletir o conteúdo real falado no vídeo.
NUNCA gere títulos genéricos ou inventados.`
    );

    const parsed = parseJSON(aiMoments);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("[MOMENTS] AI returned invalid response, using basic moments");
      return generateBasicMoments(duration, title, transcriptSource);
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
        transcript_excerpt: m.transcript_excerpt || "",
      };
    });
  } catch (err: any) {
    console.error("[MOMENTS] AI detection failed:", err.message);
    return generateBasicMoments(duration, title, transcriptSource);
  }
}

function generateBasicMoments(duration: number, title: string, transcriptSource: string) {
  const count = Math.min(5, Math.max(3, Math.floor(duration / 45)));
  const span = Math.max(20, Math.floor(duration / count));
  return Array.from({ length: count }).map((_, i) => {
    const start = Math.min(Math.max(0, i * span), Math.max(0, duration - 20));
    const end = Math.min(duration, start + Math.min(45, Math.max(18, span)));
    return {
      start_seconds: start,
      end_seconds: end,
      title: `${title} — parte ${i + 1}`,
      reason: transcriptSource === "elevenlabs_real_audio"
        ? "Segmentação automática (análise de IA falhou)."
        : "Segmentação por tempo (transcrição real indisponível).",
      score: 40 + i * 3,
      hook_strength: 40,
      emotion: 40,
      pacing: 40,
      retention: 40,
      transcript_excerpt: "",
    };
  });
}

async function processVideoAsync(supabase: any, jobId: string, videoId: string, userId: string, video: any, options: any) {
  const title = video?.title || "Vídeo";
  const duration = Math.max(30, video?.duration_seconds || 180);

  await updateJob(supabase, jobId, videoId, "processing", 5, "Validando mídia");
  
  if (!video?.file_path) {
    throw new Error("Vídeo sem arquivo de mídia interno. Faça upload do arquivo primeiro.");
  }

  // STEP: Transcription
  await updateJob(supabase, jobId, videoId, "transcribing", 10, "Iniciando transcrição do áudio...");
  
  let transcriptResult: { text: string; words: any[]; source: string };
  
  if (options?.generate_transcript === false) {
    transcriptResult = { text: title, words: [], source: "skipped" };
  } else {
    transcriptResult = await buildTranscript(supabase, video, jobId, videoId);
  }

  const transcriptText = transcriptResult.text;
  const transcriptSource = transcriptResult.source;

  await updateJob(supabase, jobId, videoId, "transcribing", 40, `Transcrição: ${transcriptSource}`, {
    transcript_source: transcriptSource,
    transcript_length: transcriptText.length,
    word_count: transcriptResult.words?.length || 0,
  });

  // Save transcript
  const { data: existingTranscript } = await supabase.from("transcripts").select("id").eq("video_id", videoId).maybeSingle();
  
  if (existingTranscript?.id) {
    await supabase.from("transcript_segments").delete().eq("transcript_id", existingTranscript.id);
    await supabase.from("transcripts").update({
      full_text: transcriptText,
      language: video?.language || "pt",
      updated_at: new Date().toISOString(),
    }).eq("id", existingTranscript.id);
    
    const segments = transcriptResult.words?.length > 0
      ? generateSegmentsFromWords(existingTranscript.id, transcriptResult.words)
      : generateSegmentsFromText(existingTranscript.id, transcriptText, duration);
    
    if (segments.length) await supabase.from("transcript_segments").insert(segments);
  } else {
    const { data: transcript } = await supabase.from("transcripts").insert({
      video_id: videoId,
      user_id: userId,
      full_text: transcriptText,
      language: video?.language || "pt",
    }).select().single();
    
    if (transcript?.id) {
      const segments = transcriptResult.words?.length > 0
        ? generateSegmentsFromWords(transcript.id, transcriptResult.words)
        : generateSegmentsFromText(transcript.id, transcriptText, duration);
      
      if (segments.length) await supabase.from("transcript_segments").insert(segments);
    }
  }

  // STEP: Detect moments
  await updateJob(supabase, jobId, videoId, "analyzing", 55, "Detectando melhores momentos...");
  const moments = options?.detect_moments === false
    ? generateBasicMoments(duration, title, transcriptSource)
    : await detectMoments(transcriptText, duration, title, transcriptSource);

  // STEP: Generate clips
  await updateJob(supabase, jobId, videoId, "generating_clips", 75, "Gerando clips e legendas...");
  await supabase.from("clips").delete().eq("video_id", videoId);

  const clipsToInsert = moments.map((m: any) => ({
    video_id: videoId,
    user_id: userId,
    title: m.title,
    start_time: m.start_seconds,
    end_time: m.end_seconds,
    // duration_seconds is a GENERATED column — do NOT include
    virality_score: m.score,
    virality_details: {
      hook_strength: m.hook_strength,
      emotion: m.emotion,
      pacing: m.pacing,
      retention: m.retention,
      reason: m.reason,
      transcript_source: transcriptSource,
    },
    transcript_text: m.transcript_excerpt,
    format: "9:16",
    status: "generated",
  }));

  console.log("[CLIPS] Inserting", clipsToInsert.length, "clips for video", videoId);
  const { data: clips, error: clipsError } = await supabase.from("clips").insert(clipsToInsert).select();
  
  if (clipsError) {
    console.error("[CLIPS] Insert error:", JSON.stringify(clipsError));
    throw new Error(`Falha ao salvar clips: ${clipsError.message}`);
  }
  console.log("[CLIPS] ✅ Inserted", clips?.length, "clips successfully");

  // Generate captions for each clip
  if (clips?.length && options?.generate_captions !== false && transcriptSource === "elevenlabs_real_audio") {
    await supabase.from("captions").delete().in("clip_id", clips.map((c: any) => c.id));
    for (const clip of clips) {
      const captions = generateCaptionsForClip(clip.id, userId, clip.transcript_text || title, clip.start_time, clip.end_time);
      if (captions.length) await supabase.from("captions").insert(captions);
    }
  }

  // Deduct credits
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
    description: `Processamento: ${title} (STT: ${transcriptSource})`,
    job_id: jobId,
  });

  const sttLabel = transcriptSource === "elevenlabs_real_audio" ? "transcrição real do áudio" : "transcrição indisponível (placeholder)";
  await updateJob(supabase, jobId, videoId, "completed", 100, `Concluído (${sttLabel})`, { completed_at: new Date().toISOString() });

  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Processamento concluído",
    message: `"${title}" processado com ${sttLabel}. ${(clips?.length || 0)} clips gerados.`,
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
        return new Response(JSON.stringify({ error: "Authorization required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: jobs } = await serviceClient
        .from("processing_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ jobs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { video_id, options = {} } = body;

      if (!video_id) {
        return new Response(JSON.stringify({ error: "video_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: video } = await serviceClient
        .from("videos")
        .select("*")
        .eq("id", video_id)
        .single();

      if (!video) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create job
      const { data: job, error: jobError } = await serviceClient
        .from("processing_jobs")
        .insert({
          video_id,
          user_id: user.id,
          status: "queued",
          options,
        })
        .select()
        .single();

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: "Failed to create job" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Process async
      (async () => {
        try {
          await processVideoAsync(serviceClient, job.id, video_id, user.id, video, options);
        } catch (err: any) {
          console.error("[PROCESS] Fatal error:", err.message);
          await updateJob(serviceClient, job.id, video_id, "failed", 0, "Erro fatal", {
            error_message: err.message,
          });
        }
      })();

      return new Response(JSON.stringify({ ok: true, job_id: job.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { job_id } = body;

      if (!job_id) {
        return new Response(JSON.stringify({ error: "job_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: { user } } = await anonClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: job } = await serviceClient
        .from("processing_jobs")
        .select("*")
        .eq("id", job_id)
        .single();

      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: video } = await serviceClient
        .from("videos")
        .select("*")
        .eq("id", job.video_id)
        .single();

      // Reset job
      await serviceClient.from("processing_jobs").update({
        status: "queued",
        progress: 0,
        current_step: "Reprocessando...",
        error_message: null,
        started_at: new Date().toISOString(),
        completed_at: null,
      }).eq("id", job_id);

      // Reprocess async
      (async () => {
        try {
          await processVideoAsync(serviceClient, job_id, job.video_id, user.id, video, job.options || {});
        } catch (err: any) {
          console.error("[REPROCESS] Fatal error:", err.message);
          await updateJob(serviceClient, job_id, job.video_id, "failed", 0, "Erro fatal no reprocessamento", {
            error_message: err.message,
          });
        }
      })();

      return new Response(JSON.stringify({ ok: true, reprocessing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[HANDLER] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
