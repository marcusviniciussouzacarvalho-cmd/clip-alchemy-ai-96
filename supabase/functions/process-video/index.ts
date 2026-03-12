import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProcessRequest {
  video_id: string;
  options?: {
    generate_clips?: boolean;
    generate_transcript?: boolean;
    generate_captions?: boolean;
    detect_moments?: boolean;
  };
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    if (req.method === "POST") {
      const { video_id, options } = (await req.json()) as ProcessRequest;

      if (!video_id) {
        return new Response(JSON.stringify({ error: "video_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify video belongs to user
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", video_id)
        .eq("user_id", userId)
        .single();

      if (videoError || !video) {
        return new Response(JSON.stringify({ error: "Video not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check credits
      const { data: credits } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!credits || credits.balance < 10) {
        return new Response(JSON.stringify({ error: "Insufficient credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create processing job
      const { data: job, error: jobError } = await supabase
        .from("processing_jobs")
        .insert({
          video_id,
          user_id: userId,
          status: "queued",
          progress: 0,
          current_step: "Aguardando na fila",
          options: options || {
            generate_clips: true,
            generate_transcript: true,
            generate_captions: true,
            detect_moments: true,
          },
        })
        .select()
        .single();

      if (jobError) {
        return new Response(JSON.stringify({ error: "Failed to create job", details: jobError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log job creation
      await supabase.from("job_logs").insert({
        job_id: job.id,
        level: "info",
        message: "Job criado e aguardando na fila",
        metadata: { video_id, options },
      });

      // Simulate async processing pipeline
      // In production, this would trigger a background worker
      processVideoAsync(supabase, job.id, video_id, userId, options);

      return new Response(JSON.stringify({ job }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - Check job status
    if (req.method === "GET") {
      const url = new URL(req.url);
      const jobId = url.searchParams.get("job_id");
      const videoId = url.searchParams.get("video_id");

      if (jobId) {
        const { data: job } = await supabase
          .from("processing_jobs")
          .select("*, job_logs(*)")
          .eq("id", jobId)
          .eq("user_id", userId)
          .single();

        return new Response(JSON.stringify({ job }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (videoId) {
        const { data: jobs } = await supabase
          .from("processing_jobs")
          .select("*")
          .eq("video_id", videoId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ jobs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // All jobs for user
      const { data: jobs } = await supabase
        .from("processing_jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ jobs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH - Reprocess failed job
    if (req.method === "PATCH") {
      const { job_id } = await req.json();

      const { data: existingJob } = await supabase
        .from("processing_jobs")
        .select("*")
        .eq("id", job_id)
        .eq("user_id", userId)
        .single();

      if (!existingJob || existingJob.status !== "failed") {
        return new Response(JSON.stringify({ error: "Job not found or not in failed state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Reset job
      const { data: job } = await supabase
        .from("processing_jobs")
        .update({ status: "queued", progress: 0, current_step: "Reprocessando", error_message: null })
        .eq("id", job_id)
        .select()
        .single();

      await supabase.from("job_logs").insert({
        job_id: job_id,
        level: "info",
        message: "Job reprocessado pelo usuário",
      });

      processVideoAsync(supabase, job_id, existingJob.video_id, userId, existingJob.options);

      return new Response(JSON.stringify({ job }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simulated async processing pipeline
async function processVideoAsync(
  supabase: any,
  jobId: string,
  videoId: string,
  userId: string,
  options: any
) {
  const steps = [
    { status: "processing", step: "Extraindo áudio", progress: 10 },
    { status: "transcribing", step: "Transcrevendo áudio", progress: 25 },
    { status: "analyzing", step: "Analisando conteúdo", progress: 40 },
    { status: "analyzing", step: "Detectando melhores momentos", progress: 55 },
    { status: "generating_clips", step: "Gerando clips", progress: 70 },
    { status: "rendering", step: "Renderizando clips", progress: 85 },
    { status: "rendering", step: "Aplicando legendas", progress: 95 },
  ];

  try {
    // Update video status
    await supabase.from("videos").update({ status: "processing" }).eq("id", videoId);

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

      await supabase
        .from("processing_jobs")
        .update({
          status: step.status,
          progress: step.progress,
          current_step: step.step,
          started_at: step.progress === 10 ? new Date().toISOString() : undefined,
        })
        .eq("id", jobId);

      await supabase.from("job_logs").insert({
        job_id: jobId,
        level: "info",
        message: step.step,
        metadata: { progress: step.progress },
      });
    }

    // Generate transcript
    if (options?.generate_transcript !== false) {
      const { data: transcript } = await supabase
        .from("transcripts")
        .insert({
          video_id: videoId,
          user_id: userId,
          full_text: generateMockTranscript(),
          language: "pt",
        })
        .select()
        .single();

      if (transcript) {
        const segments = generateMockSegments(transcript.id);
        await supabase.from("transcript_segments").insert(segments);
      }
    }

    // Generate clips
    if (options?.generate_clips !== false) {
      const clipCount = 3 + Math.floor(Math.random() * 8); // 3-10 clips
      const clips = [];

      for (let i = 0; i < clipCount; i++) {
        const startTime = Math.random() * 1800; // up to 30 min
        const duration = 20 + Math.random() * 70; // 20-90 seconds

        clips.push({
          video_id: videoId,
          user_id: userId,
          title: generateClipTitle(i),
          start_time: Math.round(startTime * 100) / 100,
          end_time: Math.round((startTime + duration) * 100) / 100,
          virality_score: 50 + Math.floor(Math.random() * 50),
          virality_details: {
            hook_strength: 40 + Math.floor(Math.random() * 60),
            emotion: 40 + Math.floor(Math.random() * 60),
            pacing: 40 + Math.floor(Math.random() * 60),
            retention: 40 + Math.floor(Math.random() * 60),
          },
          transcript_text: `Trecho transcrito do clip ${i + 1}...`,
          format: "9:16",
          status: "generated",
        });
      }

      const { data: insertedClips } = await supabase.from("clips").insert(clips).select();

      // Generate captions for each clip
      if (options?.generate_captions !== false && insertedClips) {
        for (const clip of insertedClips) {
          const captions = generateMockCaptions(clip.id, userId, clip.start_time, clip.end_time);
          await supabase.from("captions").insert(captions);
        }
      }
    }

    // Deduct credits
    const creditCost = 30 + Math.floor(Math.random() * 20);
    const { data: currentCredits } = await supabase
      .from("credits")
      .select("balance, total_used")
      .eq("user_id", userId)
      .single();

    if (currentCredits) {
      await supabase
        .from("credits")
        .update({
          balance: Math.max(0, currentCredits.balance - creditCost),
          total_used: currentCredits.total_used + creditCost,
        })
        .eq("user_id", userId);
    }

    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -creditCost,
      description: `Processamento de vídeo`,
      job_id: jobId,
    });

    // Mark completed
    await supabase
      .from("processing_jobs")
      .update({
        status: "completed",
        progress: 100,
        current_step: "Concluído",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    await supabase.from("videos").update({ status: "ready" }).eq("id", videoId);

    await supabase.from("job_logs").insert({
      job_id: jobId,
      level: "info",
      message: "Processamento concluído com sucesso",
    });
  } catch (error) {
    await supabase
      .from("processing_jobs")
      .update({
        status: "failed",
        current_step: "Falha no processamento",
        error_message: error.message,
      })
      .eq("id", jobId);

    await supabase.from("job_logs").insert({
      job_id: jobId,
      level: "error",
      message: `Erro: ${error.message}`,
    });

    await supabase.from("videos").update({ status: "error" }).eq("id", videoId);
  }
}

function generateMockTranscript(): string {
  return `Olá a todos, sejam bem-vindos ao nosso episódio de hoje. Vamos falar sobre um tema muito importante que tem impactado o mercado digital. Primeiro, quero compartilhar uma história incrível de sucesso. Na semana passada, um dos nossos clientes conseguiu triplicar o engajamento nas redes sociais usando técnicas simples de conteúdo. A chave foi entender o que realmente funciona: ganchos fortes, storytelling e chamadas para ação claras. Vamos explorar cada um desses pontos em detalhes...`;
}

function generateMockSegments(transcriptId: string) {
  const texts = [
    "Olá a todos, sejam bem-vindos ao nosso episódio de hoje.",
    "Vamos falar sobre um tema muito importante que tem impactado o mercado digital.",
    "Primeiro, quero compartilhar uma história incrível de sucesso.",
    "Na semana passada, um dos nossos clientes conseguiu triplicar o engajamento.",
    "A chave foi entender o que realmente funciona: ganchos fortes, storytelling e CTAs claras.",
    "Vamos explorar cada um desses pontos em detalhes.",
  ];

  return texts.map((text, i) => ({
    transcript_id: transcriptId,
    text,
    start_time: i * 5,
    end_time: (i + 1) * 5,
    confidence: 0.9 + Math.random() * 0.1,
  }));
}

function generateClipTitle(index: number): string {
  const titles = [
    "Gancho forte sobre engajamento",
    "Dica prática de marketing digital",
    "História de sucesso inspiradora",
    "Pergunta impactante do público",
    "Revelação surpreendente",
    "Momento emocional do episódio",
    "Hack de conteúdo viral",
    "Conclusão poderosa",
    "Debate sobre estratégias",
    "Insight sobre o mercado",
  ];
  return titles[index % titles.length];
}

function generateMockCaptions(clipId: string, userId: string, startTime: number, endTime: number) {
  const duration = endTime - startTime;
  const segmentCount = Math.max(3, Math.floor(duration / 5));
  const captions = [];

  for (let i = 0; i < segmentCount; i++) {
    const segStart = startTime + (i * duration) / segmentCount;
    const segEnd = startTime + ((i + 1) * duration) / segmentCount;
    captions.push({
      clip_id: clipId,
      user_id: userId,
      text: `Legenda do segmento ${i + 1}`,
      start_time: Math.round(segStart * 100) / 100,
      end_time: Math.round(segEnd * 100) / 100,
    });
  }

  return captions;
}
