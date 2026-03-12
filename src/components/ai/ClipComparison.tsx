import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCompareClips } from "@/hooks/use-ai-content";
import { GitCompare, Loader2, Trophy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ClipData {
  id: string;
  title: string;
  duration_seconds: number | null;
  virality_score: number | null;
  transcript_text: string | null;
}

interface ClipComparisonProps {
  clips: ClipData[];
}

export const ClipComparison = ({ clips }: ClipComparisonProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const mutation = useCompareClips();

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
        ? [...prev, id]
        : prev
    );
    setResult(null);
  };

  const compare = () => {
    if (selected.length < 2) {
      toast.error("Selecione pelo menos 2 clips");
      return;
    }
    const selectedClips = selected.map((id) => {
      const clip = clips.find((c) => c.id === id)!;
      return {
        title: clip.title,
        duration: clip.duration_seconds || 0,
        score: clip.virality_score || 0,
        transcript: clip.transcript_text || undefined,
      };
    });
    mutation.mutate({ clips: selectedClips }, {
      onSuccess: (d) => setResult(d),
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <GitCompare size={12} /> Comparar Clips
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={compare} disabled={mutation.isPending || selected.length < 2}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <GitCompare size={12} className="mr-1" />}
          Comparar ({selected.length})
        </Button>
      </div>

      {/* Clip selection */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {clips.map((clip) => {
          const isSelected = selected.includes(clip.id);
          const winnerIdx = result?.winner_index;
          const isWinner = winnerIdx !== undefined && selected[winnerIdx] === clip.id;

          return (
            <button
              key={clip.id}
              onClick={() => toggle(clip.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                isSelected
                  ? isWinner
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-accent border border-foreground/20"
                  : "border border-border hover:border-foreground/20"
              }`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                isSelected ? "bg-foreground border-foreground" : "border-border"
              }`}>
                {isSelected && <Check size={10} className="text-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium truncate block">{clip.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {clip.duration_seconds ? `${Math.floor(clip.duration_seconds / 60)}:${String(Math.floor((clip.duration_seconds || 0) % 60)).padStart(2, '0')}` : '—'} · Score: {clip.virality_score || 0}
                </span>
              </div>
              {isWinner && <Trophy size={14} className="text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Comparison result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2 border-t border-border">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-emerald-400" />
              <span className="text-xs font-bold">Vencedor: {clips.find((c) => c.id === selected[result.winner_index])?.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{result.reason}</p>
          </div>

          {result.rankings?.map((rank: any, i: number) => {
            const clip = clips.find((c) => c.id === selected[rank.index]);
            if (!clip) return null;
            return (
              <div key={i} className="space-y-1.5">
                <span className="text-xs font-bold">#{i + 1} {clip.title}</span>
                <div className="flex flex-wrap gap-1">
                  {rank.strengths?.map((s: string, j: number) => (
                    <span key={`s${j}`} className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Check size={8} /> {s}
                    </span>
                  ))}
                  {rank.weaknesses?.map((w: string, j: number) => (
                    <span key={`w${j}`} className="text-[9px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <X size={8} /> {w}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{rank.recommendation}</p>
              </div>
            );
          })}
        </motion.div>
      )}

      {clips.length < 2 && (
        <p className="text-xs text-muted-foreground text-center py-2">Necessário pelo menos 2 clips para comparar</p>
      )}
    </div>
  );
};
