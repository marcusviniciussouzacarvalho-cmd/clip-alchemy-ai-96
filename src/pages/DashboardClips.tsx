import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Scissors, Star, Download, RefreshCw, Play, BarChart3, Heart, Trash2 } from "lucide-react";
import { useState } from "react";

const mockClips = [
  { id: 1, title: "Momento chave - gancho forte", duration: "0:42", score: 92, status: "approved", favorite: true },
  { id: 2, title: "Dica prática de marketing", duration: "0:58", score: 85, status: "pending", favorite: false },
  { id: 3, title: "História de sucesso", duration: "1:15", score: 78, status: "pending", favorite: false },
  { id: 4, title: "Pergunta do público", duration: "0:35", score: 71, status: "rejected", favorite: false },
  { id: 5, title: "Conclusão impactante", duration: "0:48", score: 88, status: "approved", favorite: true },
  { id: 6, title: "Introdução viral", duration: "0:30", score: 95, status: "approved", favorite: false },
];

const ScoreBar = ({ score }: { score: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${score >= 85 ? 'bg-emerald-400' : score >= 70 ? 'bg-amber-400' : 'bg-destructive'}`}
        style={{ width: `${score}%` }}
      />
    </div>
    <span className="text-xs font-bold w-8">{score}</span>
  </div>
);

const DashboardClips = () => {
  const [clips, setClips] = useState(mockClips);

  const toggleFav = (id: number) => {
    setClips(clips.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c));
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Clips</h1>
          <p className="text-sm text-muted-foreground">{clips.length} clips gerados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw size={14} className="mr-1" /> Regenerar
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 size={14} className="mr-1" /> Comparar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clips.map((clip) => (
          <div key={clip.id} className="venus-card overflow-hidden group">
            {/* Video preview */}
            <div className="aspect-video bg-accent flex items-center justify-center relative">
              <Play size={32} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => toggleFav(clip.id)}
                  className="w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"
                >
                  <Heart size={14} className={clip.favorite ? "fill-foreground text-foreground" : "text-muted-foreground"} />
                </button>
              </div>
              <span className="absolute bottom-2 right-2 text-xs bg-background/80 backdrop-blur px-2 py-0.5 rounded font-medium">{clip.duration}</span>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-sm font-bold truncate">{clip.title}</h3>

              {/* Virality Score */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Score de Viralidade</div>
                <ScoreBar score={clip.score} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="default" size="sm" className="flex-1">
                  <Download size={14} className="mr-1" /> Exportar
                </Button>
                <Button variant="outline" size="sm">
                  <Scissors size={14} />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardClips;
