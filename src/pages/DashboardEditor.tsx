import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, ZoomIn, Smile, Image, Copy, Layout, Type, Crop, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { VideoSummary } from "@/components/ai/VideoSummary";
import { AutoChapters } from "@/components/ai/AutoChapters";
import { ViralMoments } from "@/components/ai/ViralMoments";
import { DerivedContent } from "@/components/ai/DerivedContent";
import { RetentionChart } from "@/components/ai/RetentionChart";
import { HookDetector } from "@/components/ai/HookDetector";
import { ThumbnailGenerator } from "@/components/ai/ThumbnailGenerator";

const DashboardEditor = () => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(5);
  const totalDuration = 75; // 1:15

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold mb-1">Editor de Clip</h1>
        <p className="text-sm text-muted-foreground">Edite e personalize seu clip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Player */}
        <div className="lg:col-span-3 space-y-3">
          <div className="venus-card overflow-hidden">
            <div className="aspect-video bg-accent flex items-center justify-center relative">
              <button
                onClick={() => setPlaying(!playing)}
                className="w-14 h-14 rounded-full bg-foreground/90 flex items-center justify-center hover:bg-foreground transition-colors hover:scale-105 active:scale-95"
              >
                {playing ? <Pause size={20} className="text-background" /> : <Play size={20} className="text-background ml-0.5" />}
              </button>
            </div>

            {/* Player controls */}
            <div className="px-4 py-3 bg-card border-t border-border">
              <div className="flex items-center gap-3">
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack size={14} />
                </button>
                <button
                  onClick={() => setPlaying(!playing)}
                  className="text-foreground"
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward size={14} />
                </button>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>

                {/* Progress */}
                <div className="flex-1 h-1 rounded-full bg-accent overflow-hidden cursor-pointer group">
                  <div
                    className="h-full rounded-full bg-foreground group-hover:bg-foreground/80 transition-colors"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                </div>

                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Volume2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">00:00</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Timeline</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">01:15</span>
            </div>

            {/* Visual timeline */}
            <div className="h-12 bg-accent rounded-lg relative overflow-hidden mb-3">
              {/* Waveform placeholder */}
              <div className="absolute inset-0 flex items-center px-1">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 mx-px bg-muted-foreground/20 rounded-sm"
                    style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }}
                  />
                ))}
              </div>
              {/* Selection */}
              <div className="absolute inset-y-0 left-[10%] right-[20%] bg-foreground/10 border-x-2 border-foreground rounded">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-foreground rounded-l cursor-col-resize" />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-foreground rounded-r cursor-col-resize" />
              </div>
              {/* Playhead */}
              <motion.div
                className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</label>
                <Input defaultValue="00:05" className="mt-1 h-7 text-xs" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fim</label>
                <Input defaultValue="00:58" className="mt-1 h-7 text-xs" />
              </div>
            </div>
          </div>
          {/* Retention Chart - below timeline */}
          <RetentionChart transcript="Exemplo de transcrição do vídeo para análise de retenção." durationSeconds={totalDuration} />
        </div>
        {/* Tools sidebar */}
        <div className="space-y-3">
          <div className="venus-card p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: ZoomIn, label: "Zoom" },
                { icon: Smile, label: "Emojis" },
                { icon: Image, label: "Logo" },
                { icon: Type, label: "Título" },
                { icon: Copy, label: "Duplicar" },
                { icon: Layout, label: "Template" },
                { icon: Crop, label: "Reframe" },
              ].map((t) => (
                <button
                  key={t.label}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <t.icon size={16} strokeWidth={1.5} />
                  <span className="text-[10px]">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Reframe */}
          <div className="venus-card p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Auto Reframe</h3>
            <div className="space-y-1">
              {[
                { label: "9:16 Vertical", ratio: "9:16" },
                { label: "1:1 Quadrado", ratio: "1:1" },
                { label: "16:9 Horizontal", ratio: "16:9" },
              ].map((format) => (
                <button
                  key={format.label}
                  className="w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <span className="text-xs">{format.label}</span>
                  <span className="text-[10px] text-muted-foreground/60">{format.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legendas */}
          <div className="venus-card p-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Legenda</h3>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</label>
                <Input defaultValue="Bold Centered" className="mt-1 h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Cor</label>
                <Input defaultValue="#FFFFFF" className="mt-1 h-7 text-xs" />
              </div>
            </div>
          </div>

          <Button className="w-full" size="sm">Salvar alterações</Button>

          {/* Thumbnail Generator */}
          <ThumbnailGenerator clipTitle="Clip de exemplo" transcript="Exemplo de transcrição do vídeo." />

          {/* AI Panels */}
          <HookDetector transcript="Exemplo de transcrição do vídeo para detectar o hook." />
          <VideoSummary transcript="Exemplo de transcrição do vídeo para demonstração das funcionalidades de IA." />
          <AutoChapters transcript="Exemplo de transcrição do vídeo." durationSeconds={totalDuration} />
          <ViralMoments transcript="Exemplo de transcrição do vídeo." />
          <DerivedContent title="Clip de exemplo" transcript="Exemplo de transcrição do vídeo para gerar conteúdos derivados." />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardEditor;
