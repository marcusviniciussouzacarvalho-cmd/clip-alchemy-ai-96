import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useViralTitles } from "@/hooks/use-ai-content";
import { Sparkles, Copy, Check, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ViralTitlesProps {
  clipTitle: string;
  transcript?: string;
  onSelectTitle?: (title: string) => void;
}

export const ViralTitles = ({ clipTitle, transcript, onSelectTitle }: ViralTitlesProps) => {
  const [titles, setTitles] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const mutation = useViralTitles();

  const generate = () => {
    mutation.mutate({ title: clipTitle, transcript }, {
      onSuccess: (data) => setTitles(Array.isArray(data) ? data : []),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const copyTitle = (title: string, idx: number) => {
    navigator.clipboard.writeText(title);
    setCopied(idx);
    toast.success("Título copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={12} /> Títulos Virais
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
          Gerar
        </Button>
      </div>

      <AnimatePresence>
        {titles.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer ${
              selected === i ? "border-foreground bg-accent" : "border-border hover:border-foreground/30"
            }`}
            onClick={() => { setSelected(i); onSelectTitle?.(t.title); }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{t.title}</p>
              <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">{t.pattern} · {t.hook_strength}/100</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); copyTitle(t.title, i); }} className="p-1 hover:bg-accent rounded">
                {copied === i ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-muted-foreground" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); setSelected(i); }} className="p-1 hover:bg-accent rounded">
                <Star size={12} className={selected === i ? "fill-foreground text-foreground" : "text-muted-foreground"} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {titles.length === 0 && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Clique em "Gerar" para criar títulos virais</p>
      )}
    </div>
  );
};
