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
  clip_title?: string;
  render_method?: string;
  metadata?: any;
}

export function useExportClip() {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportClip = async (clipId: string) => {
    console.log("[PATCH V3] export clip started", { clipId });
    setExporting(clipId);
    try {
      const { data, error } = await supabase.functions.invoke("export-clip", {
        body: { clip_id: clipId },
      });

      if (error) throw new Error(error.message || "Erro na exportação");

      // Handle configuration errors
      if (data?.requires_config) {
        toast.error("Renderização indisponível", {
          description: data.help || "Configure VIDEO_RENDER_ENDPOINT nas configurações.",
          duration: 8000,
        });
        return null;
      }

      if (data?.error) throw new Error(data.error);

      const result: ExportResult = data.export;
      await downloadResult(result);
      return result;
    } catch (err: any) {
      if (err.message?.includes("501") || err.message?.includes("indisponível")) {
        toast.error("Renderização server-side não configurada", {
          description: "O serviço de renderização (VIDEO_RENDER_ENDPOINT) precisa ser configurado para exportar clips.",
          duration: 8000,
        });
      } else {
        toast.error(err.message || "Erro ao exportar clip");
      }
      return null;
    } finally {
      setExporting(null);
    }
  };

  const exportSelection = async (videoId: string, startTime: number, endTime: number, format?: string) => {
    console.log("[PATCH V3] export selection started", { videoId, startTime, endTime, format });
    setExporting(videoId);
    try {
      const { data, error } = await supabase.functions.invoke("export-clip", {
        body: { video_id: videoId, start_time: startTime, end_time: endTime, format },
      });

      if (error) throw new Error(error.message || "Erro na exportação");

      if (data?.requires_config) {
        toast.error("Renderização indisponível", {
          description: data.help || "Configure VIDEO_RENDER_ENDPOINT nas configurações.",
          duration: 8000,
        });
        return null;
      }

      if (data?.error) throw new Error(data.error);

      const result: ExportResult = data.export;
      await downloadResult(result);
      return result;
    } catch (err: any) {
      if (err.message?.includes("501") || err.message?.includes("indisponível")) {
        toast.error("Renderização server-side não configurada", {
          description: "O serviço de renderização (VIDEO_RENDER_ENDPOINT) precisa ser configurado para exportar clips.",
          duration: 8000,
        });
      } else {
        toast.error(err.message || "Erro ao exportar");
      }
      return null;
    } finally {
      setExporting(null);
    }
  };

  return { exportClip, exportSelection, exporting };
}

async function downloadResult(result: ExportResult) {
  if (!result.download_url) {
    toast.error("Nenhum arquivo de download disponível");
    return;
  }

  const fileName = result.file_name || "clip.mp4";

  // Download the rendered file
  const response = await fetch(result.download_url);
  if (!response.ok) {
    throw new Error("Falha ao baixar o arquivo renderizado");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast.success("Clip exportado!", {
    description: `${fileName} (${Math.round(result.duration)}s) — ${result.render_method === "server_side" ? "Renderizado no servidor" : "Download direto"}`,
  });
}
