import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";

async function callAI(action: string, params: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke("ai-content", {
    body: { action, ...params },
  });
  if (error) throw new Error(error.message || "AI request failed");
  if (data?.error) throw new Error(data.error);
  return data.result;
}

export function useViralTitles() {
  return useMutation({
    mutationFn: (params: { title: string; transcript?: string }) =>
      callAI("viral_titles", params),
  });
}

export function useViralMoments() {
  return useMutation({
    mutationFn: (params: { transcript: string }) =>
      callAI("viral_moments", params),
  });
}

export function useVideoSummary() {
  return useMutation({
    mutationFn: (params: { transcript: string }) =>
      callAI("video_summary", params),
  });
}

export function useAutoChapters() {
  return useMutation({
    mutationFn: (params: { transcript: string; duration_seconds?: number }) =>
      callAI("auto_chapters", params),
  });
}

export function useClipSuggestions() {
  return useMutation({
    mutationFn: (params: { title: string; duration_seconds: number; virality_score: number; transcript?: string }) =>
      callAI("clip_suggestions", params),
  });
}

export function useGenerateScript() {
  return useMutation({
    mutationFn: (params: { topic: string; audience: string; duration: number }) =>
      callAI("generate_script", params),
  });
}

export function useRepurposeContent() {
  return useMutation({
    mutationFn: (params: { title: string; transcript: string }) =>
      callAI("repurpose_content", params),
  });
}

export function useTrends() {
  return useMutation({
    mutationFn: () => callAI("trends", {}),
  });
}

export function useThumbnailText() {
  return useMutation({
    mutationFn: (params: { title: string; transcript?: string }) =>
      callAI("thumbnail_text", params),
  });
}

export function useAdvancedVirality() {
  return useMutation({
    mutationFn: (params: { title: string; duration_seconds: number; transcript?: string }) =>
      callAI("advanced_virality", params),
  });
}

export function useDetectHook() {
  return useMutation({
    mutationFn: (params: { transcript: string }) =>
      callAI("detect_hook", params),
  });
}

export function useRetentionCurve() {
  return useMutation({
    mutationFn: (params: { transcript: string; duration_seconds: number }) =>
      callAI("retention_curve", params),
  });
}

export function useCompareClips() {
  return useMutation({
    mutationFn: (params: { clips: Array<{ title: string; duration: number; score: number; transcript?: string }> }) =>
      callAI("compare_clips", params),
  });
}

export function useGenerateHashtags() {
  return useMutation({
    mutationFn: (params: { title: string; topic?: string; transcript?: string }) =>
      callAI("generate_hashtags", params),
  });
}

export function useGenerateDescription() {
  return useMutation({
    mutationFn: (params: { title: string; transcript?: string; platform?: string }) =>
      callAI("generate_description", params),
  });
}

export function useGenerateCTA() {
  return useMutation({
    mutationFn: (params: { title: string; topic?: string; goal?: string }) =>
      callAI("generate_cta", params),
  });
}

export function useContentIdeas() {
  return useMutation({
    mutationFn: (params: { topic: string; niche?: string }) =>
      callAI("content_ideas", params),
  });
}

// Viral hooks library (static data, no AI needed)
export const VIRAL_HOOKS = [
  { id: 1, text: "Ninguém fala sobre isso...", category: "curiosidade", impact: "alto" },
  { id: 2, text: "Esse erro está destruindo seu resultado.", category: "erro", impact: "alto" },
  { id: 3, text: "Se eu soubesse disso antes...", category: "arrependimento", impact: "alto" },
  { id: 4, text: "Pare de fazer isso agora.", category: "urgência", impact: "alto" },
  { id: 5, text: "A verdade que ninguém conta sobre...", category: "revelação", impact: "alto" },
  { id: 6, text: "Isso mudou completamente minha vida.", category: "transformação", impact: "médio" },
  { id: 7, text: "Você está fazendo isso errado.", category: "erro", impact: "alto" },
  { id: 8, text: "O segredo por trás de...", category: "curiosidade", impact: "médio" },
  { id: 9, text: "3 coisas que aprendi da pior forma.", category: "experiência", impact: "médio" },
  { id: 10, text: "Por que ninguém fala sobre...", category: "curiosidade", impact: "alto" },
  { id: 11, text: "Eu perdi R$10.000 porque não sabia disso.", category: "perda", impact: "alto" },
  { id: 12, text: "Isso é o que separa amadores de profissionais.", category: "autoridade", impact: "médio" },
  { id: 13, text: "Atenção: isso pode mudar tudo.", category: "urgência", impact: "alto" },
  { id: 14, text: "Você não vai acreditar no que aconteceu.", category: "surpresa", impact: "médio" },
  { id: 15, text: "A estratégia que me fez crescer 10x.", category: "resultado", impact: "alto" },
  { id: 16, text: "Nunca faça isso se você quer crescer.", category: "erro", impact: "alto" },
  { id: 17, text: "Eu estava completamente errado sobre...", category: "revelação", impact: "médio" },
  { id: 18, text: "Assista até o final, vale a pena.", category: "retenção", impact: "médio" },
  { id: 19, text: "Uma coisa que todo iniciante deveria saber.", category: "conselho", impact: "médio" },
  { id: 20, text: "Isso vai te economizar anos de trabalho.", category: "promessa", impact: "alto" },
];

export function useHooksLibrary(category?: string) {
  return VIRAL_HOOKS.filter((h) => !category || h.category === category);
}
