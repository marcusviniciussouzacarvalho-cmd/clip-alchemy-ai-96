import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve the playback URL for a video based on its source type.
 * - upload: creates a signed URL from Supabase storage
 * - youtube: returns a YouTube embed URL
 */
export async function getPlaybackUrl(video: {
  source_type?: string | null;
  file_path?: string | null;
  source_url?: string | null;
  external_video_id?: string | null;
}): Promise<{ url: string | null; type: "native" | "youtube"; error?: string }> {
  const sourceType = video.source_type || "upload";

  if (sourceType === "youtube") {
    const ytId = video.external_video_id;
    if (!ytId) return { url: null, type: "youtube", error: "ID do YouTube não encontrado" };
    return { url: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`, type: "youtube" };
  }

  // Upload / storage
  if (!video.file_path) {
    return { url: null, type: "native", error: "Caminho do arquivo não encontrado" };
  }

  const { data, error } = await supabase.storage
    .from("videos")
    .createSignedUrl(video.file_path, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return { url: null, type: "native", error: error?.message || "Erro ao gerar URL de reprodução" };
  }

  return { url: data.signedUrl, type: "native" };
}

/**
 * Get a YouTube embed URL from a video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Format seconds to mm:ss
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Get status info for display
 */
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
    case "validating_url":
    case "fetching_metadata":
    case "importing":
      return { label: "Importando", color: "bg-accent text-muted-foreground animate-pulse", canProcess: false, canPlay: false };
    case "error":
    case "failed":
      return { label: "Erro", color: "bg-destructive/20 text-destructive-foreground", canProcess: true, canPlay: true };
    case "uploaded":
    case "draft":
      return { label: "Enviado", color: "bg-accent text-muted-foreground", canProcess: true, canPlay: true };
    default:
      return { label: status || "Desconhecido", color: "bg-accent text-muted-foreground", canProcess: true, canPlay: false };
  }
}
