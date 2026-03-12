import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdvancedVirality } from "@/hooks/use-ai-content";
import { BarChart3, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AdvancedViralityProps {
  title: string;
  durationSeconds: number;
  transcript?: string;
}

const tierColors: Record<string, string> = {
  S: "bg-emerald-500 text-background",
  A: "bg-blue-500 text-background",
  B: "bg-amber-500 text-background",
  C: "bg-orange-500 text-background",
  D: "bg-destructive text-background",
};

export const AdvancedVirality = ({ title, durationSeconds, transcript }: AdvancedViralityProps) => {
  const [data, setData] = useState<any>(null);
  const mutation = useAdvancedVirality();

  const analyze = () => {
    mutation.mutate({ title, duration_seconds: durationSeconds, transcript }, {
      onSuccess: (d) => setData(d),
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Trophy size={12} /> Análise Avançada
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={analyze} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <BarChart3 size={12} className="mr-1" />}
          Analisar
        </Button>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Overall score and tier */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-black ${tierColors[data.tier] || "bg-accent text-foreground"}`}>
                {data.tier}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">Score geral</span>
                <span className="text-lg font-black tabular-nums">{data.overall_score}</span>
              </div>
              <div className="h-2 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${data.overall_score >= 80 ? 'bg-emerald-400' : data.overall_score >= 60 ? 'bg-amber-400' : 'bg-destructive'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.overall_score}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Criteria breakdown */}
          <div className="space-y-2">
            {data.criteria?.map((c: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-medium">{c.name}</span>
                  <span className="text-[11px] font-bold tabular-nums">{c.score}</span>
                </div>
                <div className="h-1 rounded-full bg-accent overflow-hidden mb-0.5">
                  <motion.div
                    className={`h-full rounded-full ${c.score >= 80 ? 'bg-emerald-400' : c.score >= 60 ? 'bg-amber-400' : 'bg-destructive'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{c.feedback}</span>
              </motion.div>
            ))}
          </div>

          {/* Verdict */}
          <div className="p-2.5 rounded-lg bg-accent border border-border">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Veredicto</span>
            <p className="text-xs mt-1">{data.verdict}</p>
          </div>
        </motion.div>
      )}

      {!data && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Análise detalhada de viralidade com 6 critérios</p>
      )}
    </div>
  );
};
