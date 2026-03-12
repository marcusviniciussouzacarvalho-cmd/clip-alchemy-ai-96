import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAutoChapters } from "@/hooks/use-ai-content";
import { List, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AutoChaptersProps {
  transcript: string;
  durationSeconds?: number;
  onSeek?: (seconds: number) => void;
}

export const AutoChapters = ({ transcript, durationSeconds, onSeek }: AutoChaptersProps) => {
  const [chapters, setChapters] = useState<any[]>([]);
  const mutation = useAutoChapters();

  const generate = () => {
    mutation.mutate({ transcript, duration_seconds: durationSeconds }, {
      onSuccess: (data) => setChapters(Array.isArray(data) ? data : []),
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <List size={12} /> Capítulos Automáticos
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          Gerar
        </Button>
      </div>

      {chapters.map((ch, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
          onClick={() => onSeek?.(ch.start_seconds)}
        >
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-16 shrink-0">
            {ch.start_time} - {ch.end_time}
          </span>
          <span className="text-sm font-medium">{ch.title}</span>
        </motion.div>
      ))}

      {chapters.length === 0 && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Gere capítulos automaticamente</p>
      )}
    </div>
  );
};
