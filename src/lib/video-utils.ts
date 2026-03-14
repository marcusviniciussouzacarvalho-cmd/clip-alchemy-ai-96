import { supabase } from "@/integrations/supabase/client";

export async function getPlaybackUrl(video: {
  source_type?: string | null;
  file_path?: string | null;
  source_url?: string | null;
  external_video_id?: string | null;
}): Promise<{ url: string | null; type: "native" | "youtube"; error?: string }> {
  if (video.file_path) {
    const { data, error } = await supabase.storage
      .from("videos")
      .createSignedUrl(video.file_path, 3600);

    if (error || !data?.signedUrl) {
      return { url: null, type: "native", error: error?.message || "Erro ao gerar URL de reprodução" };
    }

    return { url: data.signedUrl, type: "native" };
  }

  if (video.source_type === "youtube" && video.external_video_id) {
    return {
      url: `https://www.youtube.com/embed/${video.external_video_id}?rel=0&modestbranding=1&enablejsapi=1`,
      type: "youtube",
    };
  }

  return { url: null, type: "native", error: "Arquivo interno não encontrado" };
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getVideoStatusInfo(status: string | null): {
  label: string;
  color: string;
  canProcess: boolean;
  canPlay: boolean;
} {
  switch (status) {
    case "ready":
    case "completed":
    case "clips_ready":
      return { label: "Pronto", color: "bg-foreground text-background", canProcess: false, canPlay: true };
    case "processing":
    case "transcribing":
    case "analyzing":
    case "generating_clips":
    case "rendering":
    case "queued":
      return { label: "Processando", color: "bg-accent text-muted-foreground animate-pulse", canProcess: false, canPlay: true };
    case "failed":
    case "error":
      return { label: "Erro", color: "bg-destructive/20 text-destructive-foreground", canProcess: true, canPlay: false };
    case "uploaded":
    case "draft":
      return { label: "Enviado", color: "bg-accent text-muted-foreground", canProcess: true, canPlay: true };
    default:
      return { label: status || "Desconhecido", color: "bg-accent text-muted-foreground", canProcess: true, canPlay: false };
  }
}
