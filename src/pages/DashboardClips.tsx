import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Scissors, Download, RefreshCw, Play, BarChart3, Heart, Trash2, Loader2 } from "lucide-react";
import { useClips, useToggleFavorite, useDeleteClip } from "@/hooks/use-pipeline";
import { toast } from "sonner";

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

const ViralityDetails = ({ details }: { details: any }) => {
  if (!details) return null;
  const items = [
    { label: "Gancho", value: details.hook_strength },
    { label: "Emoção", value: details.emotion },
    { label: "Ritmo", value: details.pacing },
    { label: "Retenção", value: details.retention },
  ];

  return (
    <div className="space-y-1.5 mt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-14">{item.label}</span>
          <div className="flex-1 h-1 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-foreground/60" style={{ width: `${item.value}%` }} />
          </div>
          <span className="w-6 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardClips = () => {
  const { data: clips, isLoading } = useClips();
  const toggleFav = useToggleFavorite();
  const deleteClip = useDeleteClip();

  const handleDelete = (id: string) => {
    deleteClip.mutate(id, {
      onSuccess: () => toast.success("Clip removido"),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Clips</h1>
          <p className="text-sm text-muted-foreground">{clips?.length || 0} clips gerados</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : !clips || clips.length === 0 ? (
        <div className="venus-card p-12 text-center">
          <Scissors size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-bold text-lg mb-2">Nenhum clip gerado</h3>
          <p className="text-sm text-muted-foreground mb-4">Faça upload de um vídeo para gerar clips automaticamente</p>
          <Button variant="outline" asChild>
            <a href="/dashboard/upload">Upload de vídeo</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <div key={clip.id} className="venus-card overflow-hidden group">
              <div className="aspect-video bg-accent flex items-center justify-center relative">
                <Play size={32} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleFav.mutate({ clipId: clip.id, isFavorite: !clip.is_favorite })}
                    className="w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"
                  >
                    <Heart size={14} className={clip.is_favorite ? "fill-foreground text-foreground" : "text-muted-foreground"} />
                  </button>
                </div>
                <span className="absolute bottom-2 right-2 text-xs bg-background/80 backdrop-blur px-2 py-0.5 rounded font-medium">
                  {formatDuration(clip.duration_seconds)}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="text-sm font-bold truncate">{clip.title}</h3>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">Score de Viralidade</div>
                  <ScoreBar score={clip.virality_score || 0} />
                  <ViralityDetails details={clip.virality_details} />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="default" size="sm" className="flex-1">
                    <Download size={14} className="mr-1" /> Exportar
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/dashboard/editor"><Scissors size={14} /></a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(clip.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardClips;
