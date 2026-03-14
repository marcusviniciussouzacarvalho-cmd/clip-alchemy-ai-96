import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface ExportResult {
  playback_url?: string;
  download_url?: string;
  source_type: string;
  start_time: number;
  end_time: number;
  duration: number;
  format: string;
  file_name?: string;
  clip_title?: string;
  transcript?: string;
  metadata?: any;
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
      await renderAndDownload(result);
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
      await renderAndDownload(result);
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

async function renderAndDownload(result: ExportResult) {
  if (!result.playback_url && !result.download_url) {
    throw new Error("Arquivo interno indisponível para exportação");
  }

  const sourceUrl = result.playback_url || result.download_url!;
  const blob = await renderClipBlob(sourceUrl, result.start_time, result.end_time);
  const fileName = result.file_name || `${(result.clip_title || "clip").replace(/[^a-zA-Z0-9_-]+/g, "_")}.webm`;
  downloadBlob(blob, fileName);

  toast.success("Clip exportado!", {
    description: `${fileName} (${Math.round(result.duration)}s)`,
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderClipBlob(src: string, startTime: number, endTime: number): Promise<Blob> {
  const video = document.createElement("video");
  video.src = src;
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await once(video, "loadedmetadata");

  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível iniciar canvas de exportação");

  const stream = canvas.captureStream(30);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const targetDuration = Math.max(0.2, endTime - startTime);
  let raf = 0;

  const drawFrame = () => {
    if (!video.paused && !video.ended) {
      ctx.drawImage(video, 0, 0, width, height);
      raf = requestAnimationFrame(drawFrame);
    }
  };

  video.currentTime = Math.max(0, startTime);
  await once(video, "seeked");
  recorder.start(250);
  await video.play();
  drawFrame();

  await waitUntil(() => video.currentTime >= endTime || video.ended, targetDuration * 1500 + 3000);
  video.pause();
  cancelAnimationFrame(raf);
  recorder.stop();
  await once(recorder, "stop");

  return new Blob(chunks, { type: mimeType });
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const onResolve = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`Erro durante ${event}`));
    };
    const cleanup = () => {
      target.removeEventListener(event, onResolve as EventListener);
      target.removeEventListener("error", onError as EventListener);
    };
    target.addEventListener(event, onResolve as EventListener, { once: true });
    target.addEventListener("error", onError as EventListener, { once: true });
  });
}

async function waitUntil(check: () => boolean, timeoutMs: number) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Tempo limite excedido durante a renderização do clip");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
