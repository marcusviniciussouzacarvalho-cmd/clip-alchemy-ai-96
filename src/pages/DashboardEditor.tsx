import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, ZoomIn, Smile, Image, Copy, Layout, Type, Crop, Pause } from "lucide-react";
import { useState } from "react";

const DashboardEditor = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Editor de Clip</h1>
        <p className="text-sm text-muted-foreground">Edite e personalize seu clip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Player */}
        <div className="lg:col-span-3 space-y-4">
          <div className="venus-card overflow-hidden">
            <div className="aspect-video bg-accent flex items-center justify-center">
              <button
                onClick={() => setPlaying(!playing)}
                className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform"
              >
                {playing ? <Pause size={24} className="text-background" /> : <Play size={24} className="text-background ml-1" />}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">00:00</span>
              <span className="text-xs font-bold">Timeline</span>
              <span className="text-xs text-muted-foreground">01:15</span>
            </div>
            <div className="h-10 bg-accent rounded-lg relative overflow-hidden">
              <div className="absolute inset-y-0 left-[10%] right-[20%] bg-foreground/20 border-x-2 border-foreground rounded" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Início</label>
                <Input defaultValue="00:05" className="mt-1 h-8 text-xs" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input defaultValue="00:58" className="mt-1 h-8 text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Tools sidebar */}
        <div className="space-y-4">
          <div className="venus-card p-4">
            <h3 className="font-bold text-sm mb-3">Ferramentas</h3>
            <div className="grid grid-cols-2 gap-2">
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
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <t.icon size={18} />
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Reframe */}
          <div className="venus-card p-4">
            <h3 className="font-bold text-sm mb-3">Auto Reframe</h3>
            <div className="space-y-2">
              {["9:16 Vertical", "1:1 Quadrado", "16:9 Horizontal"].map((format) => (
                <button
                  key={format}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Legendas */}
          <div className="venus-card p-4">
            <h3 className="font-bold text-sm mb-3">Legenda</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Estilo</label>
                <Input defaultValue="Bold Centered" className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cor</label>
                <Input defaultValue="#FFFFFF" className="mt-1 h-8 text-xs" />
              </div>
            </div>
          </div>

          <Button className="w-full">Salvar alterações</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardEditor;
