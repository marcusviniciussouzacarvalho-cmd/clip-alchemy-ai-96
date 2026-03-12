import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, ...params } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "viral_titles": {
        systemPrompt = "Você é um especialista em conteúdo viral para redes sociais. Gere títulos virais em português brasileiro.";
        userPrompt = `Gere exatamente 5 títulos virais para um clip de vídeo com o seguinte contexto:
Título original: "${params.title}"
Transcrição: "${params.transcript || ''}"

Use estes padrões virais: curiosidade, surpresa, erro comum, pergunta intrigante, promessa de resultado.

Responda APENAS com um JSON array de objetos com os campos: "title" (string), "pattern" (string - o padrão viral usado), "hook_strength" (number 1-100).`;
        break;
      }
      case "viral_moments": {
        systemPrompt = "Você é um analista de conteúdo viral. Identifique momentos com alto potencial de viralização.";
        userPrompt = `Analise esta transcrição e identifique os 5 momentos mais virais:
"${params.transcript}"

Critérios: intensidade emocional, frases impactantes, perguntas fortes, mudanças de tom, palavras de impacto.

Responda APENAS com um JSON array de objetos: "timestamp" (string formato "MM:SS"), "timestamp_seconds" (number), "description" (string - por que este momento é viral), "score" (number 1-100), "type" (string - "emocional" | "impactante" | "pergunta" | "tom" | "impacto").`;
        break;
      }
      case "video_summary": {
        systemPrompt = "Você é um resumidor de conteúdo especializado. Gere resumos concisos e informativos em português brasileiro.";
        userPrompt = `Gere um resumo estruturado deste vídeo baseado na transcrição:
"${params.transcript}"

Responda APENAS com um JSON objeto: "main_topics" (string[] - 3-5 tópicos), "key_phrases" (string[] - 3-5 frases importantes), "main_ideas" (string[] - 3-5 ideias principais), "summary" (string - resumo em 2-3 frases).`;
        break;
      }
      case "auto_chapters": {
        systemPrompt = "Você é um editor de vídeo especializado em segmentação de conteúdo.";
        userPrompt = `Gere capítulos automáticos para este vídeo (duração: ${params.duration_seconds || 0}s) baseado na transcrição:
"${params.transcript}"

Responda APENAS com um JSON array de objetos: "title" (string), "start_time" (string formato "MM:SS"), "end_time" (string formato "MM:SS"), "start_seconds" (number), "end_seconds" (number).`;
        break;
      }
      case "clip_suggestions": {
        systemPrompt = "Você é um consultor de conteúdo viral. Dê sugestões práticas para melhorar clips.";
        userPrompt = `Analise este clip e dê 4-6 sugestões de melhoria:
Título: "${params.title}"
Duração: ${params.duration_seconds}s
Score de viralidade: ${params.virality_score}/100
Transcrição: "${params.transcript || ''}"

Responda APENAS com um JSON array de objetos: "suggestion" (string), "impact" (string - "alto" | "médio" | "baixo"), "category" (string - "edição" | "conteúdo" | "ritmo" | "hook" | "cta").`;
        break;
      }
      case "generate_script": {
        systemPrompt = "Você é um roteirista profissional de vídeos virais para redes sociais. Escreva em português brasileiro.";
        userPrompt = `Gere um roteiro completo para um vídeo com estas especificações:
Tema: "${params.topic}"
Público-alvo: "${params.audience}"
Duração desejada: ${params.duration} minutos

Responda APENAS com um JSON objeto: "hook" (string - abertura viral), "introduction" (string), "main_points" (array de objetos com "title" e "content"), "call_to_action" (string), "estimated_duration" (string), "tips" (string[] - 2-3 dicas de gravação).`;
        break;
      }
      case "repurpose_content": {
        systemPrompt = "Você é um estrategista de conteúdo multiplataforma. Adapte conteúdo para diferentes formatos.";
        userPrompt = `Transforme este conteúdo de vídeo em outros formatos:
Título: "${params.title}"
Transcrição: "${params.transcript}"

Gere conteúdo para: LinkedIn post, thread para X (Twitter), carrossel para Instagram (slides), artigo para blog.

Responda APENAS com um JSON objeto: "linkedin" (string), "twitter_thread" (string[] - array de tweets), "instagram_carousel" (string[] - array de slides), "blog_article" (string).`;
        break;
      }
      case "trends": {
        systemPrompt = "Você é um analista de tendências de conteúdo digital no Brasil.";
        userPrompt = `Liste as 8 tendências mais relevantes para criadores de conteúdo atualmente.

Responda APENAS com um JSON array de objetos: "topic" (string), "description" (string - 1 frase), "growth" (string - "alta" | "média" | "emergente"), "category" (string), "tip" (string - dica prática para o criador).`;
        break;
      }
      case "thumbnail_text": {
        systemPrompt = "Você é um designer de thumbnails virais. Gere textos curtos e impactantes.";
        userPrompt = `Gere 3 opções de texto para thumbnail deste clip:
Título: "${params.title}"
Transcrição: "${params.transcript || ''}"

Responda APENAS com um JSON array de objetos: "text" (string - máximo 5 palavras), "style" (string - "bold" | "question" | "shock"), "color_suggestion" (string - hex color).`;
        break;
      }
      case "advanced_virality": {
        systemPrompt = "Você é um analista de conteúdo viral com expertise em métricas de engajamento e retenção.";
        userPrompt = `Analise este clip em profundidade e forneça uma pontuação avançada de viralidade:
Título: "${params.title}"
Duração: ${params.duration_seconds}s
Transcrição: "${params.transcript || ''}"

Avalie cada critério de 0 a 100:
1. Força do gancho (primeiros 3 segundos)
2. Intensidade emocional
3. Clareza da mensagem
4. Velocidade/ritmo da fala
5. Potencial de retenção
6. Originalidade do conteúdo

Responda APENAS com um JSON objeto: "overall_score" (number), "criteria" (array de objetos com "name" string, "score" number, "feedback" string curto), "verdict" (string - avaliação geral em 1 frase), "tier" (string - "S" | "A" | "B" | "C" | "D").`;
        break;
      }
      case "detect_hook": {
        systemPrompt = "Você é um especialista em hooks virais para vídeos curtos.";
        userPrompt = `Analise o início desta transcrição e identifique o hook (gancho) do vídeo:
"${params.transcript}"

Identifique: tipo de hook (pergunta, afirmação forte, curiosidade, promessa de valor, choque), os primeiros segundos que capturam atenção, e sugira melhorias.

Responda APENAS com um JSON objeto: "type" (string), "text" (string - o texto do hook detectado), "duration_seconds" (number - duração estimada do hook), "strength" (number 1-100), "improvement" (string - sugestão de melhoria), "alternative_hooks" (string[] - 3 alternativas melhores).`;
        break;
      }
      case "retention_curve": {
        systemPrompt = "Você é um analista de retenção de audiência para vídeos curtos.";
        userPrompt = `Analise esta transcrição e gere uma curva de retenção estimada para o vídeo (duração: ${params.duration_seconds}s):
"${params.transcript}"

Divida o vídeo em 10 segmentos iguais e estime a porcentagem de retenção em cada ponto.
Identifique pontos de queda e picos de interesse.

Responda APENAS com um JSON objeto: "points" (array de objetos com "time_percent" number 0-100, "retention" number 0-100, "label" string curto opcional), "drop_points" (array de objetos com "time_percent" number, "reason" string), "peak_points" (array de objetos com "time_percent" number, "reason" string), "average_retention" (number).`;
        break;
      }
      case "compare_clips": {
        systemPrompt = "Você é um consultor de conteúdo viral. Compare clips e recomende o melhor.";
        userPrompt = `Compare estes clips e determine qual tem maior potencial viral:
${params.clips?.map((c: any, i: number) => `Clip ${i + 1}: Título="${c.title}", Duração=${c.duration}s, Score=${c.score}, Transcrição="${c.transcript || 'N/A'}"`).join('\n')}

Responda APENAS com um JSON objeto: "winner_index" (number - índice do melhor clip, começando em 0), "reason" (string), "rankings" (array de objetos com "index" number, "strengths" string[], "weaknesses" string[], "recommendation" string).`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : content;
    } catch {
      parsed = content;
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
