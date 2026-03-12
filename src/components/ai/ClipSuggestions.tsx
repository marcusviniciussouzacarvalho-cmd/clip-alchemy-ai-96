import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClipSuggestions } from "@/hooks/use-ai-content";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ClipSuggestionsProps {
  title: string;
  durationSeconds: number;
  viralityScore: number;
  transcript?: string;
}

export const ClipSuggestions = ({ title, durationSeconds, viralityScore, transcript }: ClipSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const mutation = useClipSuggestions();

  const generate = () => {
    mutation.mutate(
      { title, duration_seconds: durationSeconds, virality_score: viralityScore, transcript },
      {
        onSuccess: (data) => setSuggestions(Array.isArray(data) ? data : []),
        onError: (err: any) => toast.error(err.message),
      }
    );
  };

  const impactColors: Record<string, string> = {
    alto: "bg-emerald-500/20 text-emerald-400",
    médio: "bg-amber-500/20 text-amber-400",
    baixo: "bg-accent text-muted-foreground",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Lightbulb size={10} /> Sugestões IA
        </span>
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={10} className="animate-spin" /> : "Analisar"}
        </Button>
      </div>

      {suggestions.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-start gap-2 text-xs"
        >
          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${impactColors[s.impact] || impactColors.baixo}`}>
            {s.impact}
          </span>
          <span className="text-muted-foreground">{s.suggestion}</span>
        </motion.div>
      ))}
    </div>
  );
};
