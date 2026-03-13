import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface ExportResult {
  download_url?: string;
  source_type: string;
  start_time: number;
  end_time: number;
  duration: number;
  format: string;
  file_name?: string;
  youtube_id?: string;
  youtube_url?: string;
  clip_title?: string;
  transcript?: string;
  metadata?: any;
  trim?: { start: number; end: number };
}

export function useExportClip() {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportClip = async (clipId: string) => {
    setExporting(clipId);
    try {
      const { data, error } = await supabase.functions.invoke("export-clip", {
        body: { clip_id: clipId },
      });

      if (error) throw new Error(error.message || "Erro na exportação");
      if (data?.error) throw new Error(data.error);

      const result: ExportResult = data.export;

      if (result.source_type === "upload" && result.download_url) {
        // For uploaded videos: download the file with time fragment
        const url = `${result.download_url}`;
        const a = document.createElement("a");
        a.href = url;
        a.download = result.file_name || "clip.mp4";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success("Download iniciado!", {
          description: `Clip: ${result.file_name || "clip.mp4"} (${Math.round(result.duration)}s)`,
        });
      } else if (result.source_type === "youtube") {
        // For YouTube: show metadata and offer to copy info
        const info = [
          `🎬 ${result.clip_title || "Clip"}`,
          `⏱️ ${formatTime(result.start_time)} → ${formatTime(result.end_time)} (${Math.round(result.duration)}s)`,
          `🔗 ${result.youtube_url}&t=${Math.floor(result.start_time)}`,
          result.transcript ? `📝 "${result.transcript}"` : "",
          result.metadata?.virality_score ? `⚡ Score: ${result.metadata.virality_score}/100` : "",
        ].filter(Boolean).join("\n");

        await navigator.clipboard.writeText(info);
        toast.success("Informações do clip copiadas!", {
          description: "O link do YouTube com timestamp e metadados foram copiados para a área de transferência.",
        });
      }

      return result;
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar clip");
      throw err;
    } finally {
      setExporting(null);
    }
  };

  const exportSelection = async (videoId: string, startTime: number, endTime: number, format?: string) => {
    setExporting(videoId);
    try {
      const { data, error } = await supabase.functions.invoke("export-clip", {
        body: { video_id: videoId, start_time: startTime, end_time: endTime, format },
      });

      if (error) throw new Error(error.message || "Erro na exportação");
      if (data?.error) throw new Error(data.error);

      const result: ExportResult = data.export;

      if (result.source_type === "upload" && result.download_url) {
        const a = document.createElement("a");
        a.href = result.download_url;
        a.download = `clip_${Math.round(startTime)}-${Math.round(endTime)}.mp4`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download iniciado!");
      } else if (result.source_type === "youtube") {
        const url = `${result.youtube_url}&t=${Math.floor(startTime)}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link do YouTube com timestamp copiado!");
      }

      return result;
    } catch (err: any) {
      toast.error(err.message || "Erro ao exportar");
      throw err;
    } finally {
      setExporting(null);
    }
  };

  return { exportClip, exportSelection, exporting };
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
