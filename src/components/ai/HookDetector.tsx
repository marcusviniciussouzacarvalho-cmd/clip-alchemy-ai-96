import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDetectHook } from "@/hooks/use-ai-content";
import { Anchor, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface HookDetectorProps {
  transcript: string;
}

const hookTypeColors: Record<string, string> = {
  pergunta: "bg-blue-500/20 text-blue-400",
  "afirmação forte": "bg-amber-500/20 text-amber-400",
  curiosidade: "bg-purple-500/20 text-purple-400",
  "promessa de valor": "bg-emerald-500/20 text-emerald-400",
  choque: "bg-rose-500/20 text-rose-400",
};

export const HookDetector = ({ transcript }: HookDetectorProps) => {
  const [hook, setHook] = useState<any>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const mutation = useDetectHook();

  const detect = () => {
    mutation.mutate({ transcript }, {
      onSuccess: (d) => setHook(d),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Anchor size={12} /> Hook Detectado
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={detect} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Anchor size={12} className="mr-1" />}
          Detectar
        </Button>
      </div>

      {hook && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="p-3 rounded-lg bg-accent border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hookTypeColors[hook.type] || "bg-accent text-muted-foreground"}`}>
                {hook.type}
              </span>
              <span className="text-[10px] text-muted-foreground">~{hook.duration_seconds}s</span>
              <span className="text-[10px] font-bold ml-auto">{hook.strength}/100</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">"{hook.text}"</p>
          </div>

          {/* Strength bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Força do hook</span>
              <span className="font-bold">{hook.strength}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-accent overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${hook.strength >= 80 ? 'bg-emerald-400' : hook.strength >= 60 ? 'bg-amber-400' : 'bg-destructive'}`}
                initial={{ width: 0 }}
                animate={{ width: `${hook.strength}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          {/* Improvement suggestion */}
          <div className="p-2.5 rounded-lg border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">💡 Sugestão de melhoria</span>
            <p className="text-xs text-muted-foreground mt-1">{hook.improvement}</p>
          </div>

          {/* Alternative hooks */}
          {hook.alternative_hooks?.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alternativas</span>
              <div className="space-y-1.5 mt-1.5">
                {hook.alternative_hooks.map((alt: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-foreground/20 transition-colors group">
                    <span className="text-xs flex-1">"{alt}"</span>
                    <button
                      onClick={() => copyText(alt, i)}
                      className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                    >
                      {copied === i ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-muted-foreground" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!hook && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Detecte e analise o hook do vídeo</p>
      )}
    </div>
  );
};
