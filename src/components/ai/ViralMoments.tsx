import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useViralMoments } from "@/hooks/use-ai-content";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ViralMomentsProps {
  transcript: string;
  onSeek?: (seconds: number) => void;
}

export const ViralMoments = ({ transcript, onSeek }: ViralMomentsProps) => {
  const [moments, setMoments] = useState<any[]>([]);
  const mutation = useViralMoments();

  const detect = () => {
    mutation.mutate({ transcript }, {
      onSuccess: (data) => setMoments(Array.isArray(data) ? data : []),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const typeColors: Record<string, string> = {
    emocional: "bg-rose-500/20 text-rose-400",
    impactante: "bg-amber-500/20 text-amber-400",
    pergunta: "bg-blue-500/20 text-blue-400",
    tom: "bg-purple-500/20 text-purple-400",
    impacto: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Zap size={12} /> Momentos Virais
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={detect} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Zap size={12} className="mr-1" />}
          Detectar
        </Button>
      </div>

      {moments.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:border-foreground/20 cursor-pointer transition-colors"
          onClick={() => onSeek?.(m.timestamp_seconds)}
        >
          <div className="text-center shrink-0">
            <span className="text-xs font-bold tabular-nums">{m.timestamp}</span>
            <div className="mt-1 text-[10px] font-bold text-muted-foreground">{m.score}/100</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-relaxed">{m.description}</p>
            <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${typeColors[m.type] || "bg-accent text-muted-foreground"}`}>
              {m.type}
            </span>
          </div>
        </motion.div>
      ))}

      {moments.length === 0 && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Detecte momentos virais na transcrição</p>
      )}
    </div>
  );
};
