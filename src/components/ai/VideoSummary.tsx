import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVideoSummary } from "@/hooks/use-ai-content";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface VideoSummaryProps {
  transcript: string;
}

export const VideoSummary = ({ transcript }: VideoSummaryProps) => {
  const [summary, setSummary] = useState<any>(null);
  const mutation = useVideoSummary();

  const generate = () => {
    mutation.mutate({ transcript }, {
      onSuccess: (data) => setSummary(data),
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText size={12} /> Resumo do Conteúdo
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          Gerar resumo
        </Button>
      </div>

      {summary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-sm leading-relaxed">{summary.summary}</p>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tópicos</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {summary.main_topics?.map((t: string, i: number) => (
                <span key={i} className="text-[11px] bg-accent px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frases-chave</span>
            <ul className="mt-1 space-y-1">
              {summary.key_phrases?.map((p: string, i: number) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-foreground mt-0.5">·</span> {p}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ideias Principais</span>
            <ul className="mt-1 space-y-1">
              {summary.main_ideas?.map((idea: string, i: number) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-foreground mt-0.5">·</span> {idea}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {!summary && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Gere um resumo automático do conteúdo</p>
      )}
    </div>
  );
};
