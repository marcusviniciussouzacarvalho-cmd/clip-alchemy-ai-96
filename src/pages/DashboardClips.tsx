import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Scissors, Download, Play, Heart, Trash2, Loader2, BarChart3, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useClips, useToggleFavorite, useDeleteClip } from "@/hooks/use-pipeline";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ViralTitles } from "@/components/ai/ViralTitles";
import { ClipSuggestions } from "@/components/ai/ClipSuggestions";
import { AdvancedVirality } from "@/components/ai/AdvancedVirality";
import { ClipComparison } from "@/components/ai/ClipComparison";
import { useState } from "react";

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 85 ? 'bg-emerald-400' : score >= 70 ? 'bg-amber-400' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-accent overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums w-7 text-right">{score}</span>
    </div>
  );
};

const ViralityDetails = ({ details }: { details: any }) => {
  if (!details) return null;
  const items = [
    { label: "Gancho", value: details.hook_strength },
    { label: "Emoção", value: details.emotion },
    { label: "Ritmo", value: details.pacing },
    { label: "Retenção", value: details.retention },
  ];

  return (
    <div className="space-y-1 mt-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-[11px]">
          <span className="text-muted-foreground w-12">{item.label}</span>
          <div className="flex-1 h-0.5 rounded-full bg-accent overflow-hidden">
            <div className="h-full rounded-full bg-foreground/40" style={{ width: `${item.value}%` }} />
          </div>
          <span className="w-5 text-right tabular-nums text-muted-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardClips = () => {
  const { data: clips, isLoading } = useClips();
  const toggleFav = useToggleFavorite();
  const deleteClip = useDeleteClip();
  const [expandedClip, setExpandedClip] = useState<string | null>(null);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="venus-card overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !clips || clips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="venus-card p-12 text-center"
        >
          <Scissors size={36} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-bold text-lg mb-1">Nenhum clip gerado</h3>
          <p className="text-sm text-muted-foreground mb-5">Faça upload de um vídeo para gerar clips automaticamente</p>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/upload">Upload de vídeo</a>
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Clip Comparison tool */}
          {clips && clips.length >= 2 && (
            <ClipComparison clips={clips} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clips.map((clip, i) => (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="venus-card overflow-hidden group"
            >
              <div className="aspect-video bg-accent flex items-center justify-center relative">
                <Play size={28} className="text-muted-foreground/40 group-hover:text-foreground/60 transition-colors" />
                <button
                  onClick={() => toggleFav.mutate({ clipId: clip.id, isFavorite: !clip.is_favorite })}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart size={13} className={clip.is_favorite ? "fill-foreground text-foreground" : "text-muted-foreground"} />
                </button>
                <span className="absolute bottom-2 right-2 text-[10px] bg-background/80 backdrop-blur px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <Clock size={10} />
                  {formatDuration(clip.duration_seconds)}
                </span>
              </div>

              <div className="p-3.5 space-y-2.5">
                <h3 className="text-sm font-bold truncate">{clip.title}</h3>

                <div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                    <BarChart3 size={10} />
                    Score de Viralidade
                  </div>
                  <ScoreBar score={clip.virality_score || 0} />
                  <ViralityDetails details={clip.virality_details} />
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <Button variant="default" size="sm" className="flex-1 h-8 text-xs">
                    <Download size={12} className="mr-1" /> Exportar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" asChild>
                    <a href="/dashboard/editor"><Scissors size={12} /></a>
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(clip.id)}>
                    <Trash2 size={12} />
                  </Button>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setExpandedClip(expandedClip === clip.id ? null : clip.id)}
                  >
                    {expandedClip === clip.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </Button>
                </div>

                {expandedClip === clip.id && (
                  <div className="pt-2 space-y-3 border-t border-border mt-2">
                    <ClipSuggestions
                      title={clip.title}
                      durationSeconds={clip.duration_seconds || 0}
                      viralityScore={clip.virality_score || 0}
                      transcript={clip.transcript_text || undefined}
                    />
                    <AdvancedVirality
                      title={clip.title}
                      durationSeconds={clip.duration_seconds || 0}
                      transcript={clip.transcript_text || undefined}
                    />
                    <ViralTitles clipTitle={clip.title} transcript={clip.transcript_text || undefined} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        </div>
    </DashboardLayout>
  );
};

export default DashboardClips;
