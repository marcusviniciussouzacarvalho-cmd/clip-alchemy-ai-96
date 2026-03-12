import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGenerateScript } from "@/hooks/use-ai-content";
import { PenTool, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DashboardScriptGenerator = () => {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("5");
  const [script, setScript] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const mutation = useGenerateScript();

  const generate = () => {
    if (!topic.trim()) return toast.error("Informe o tema");
    mutation.mutate(
      { topic, audience: audience || "geral", duration: parseInt(duration) || 5 },
      {
        onSuccess: (data) => setScript(data),
        onError: (err: any) => toast.error(err.message),
      }
    );
  };

  const copyAll = () => {
    if (!script) return;
    const text = `HOOK: ${script.hook}\n\nINTRODUÇÃO:\n${script.introduction}\n\n${script.main_points?.map((p: any) => `## ${p.title}\n${p.content}`).join("\n\n")}\n\nCALL TO ACTION:\n${script.call_to_action}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Roteiro copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Gerar Roteiro</h1>
        <p className="text-sm text-muted-foreground">Crie roteiros profissionais com IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="venus-card p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tema</label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Como usar IA para criar conteúdo" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Público-alvo</label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex: empreendedores digitais" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Duração (min)</label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 h-8 text-sm" />
            </div>
            <Button onClick={generate} disabled={mutation.isPending} className="w-full h-9 text-sm">
              {mutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <PenTool size={14} className="mr-1.5" />}
              Gerar Roteiro
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {script ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="venus-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Duração estimada: {script.estimated_duration}
                </span>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={copyAll}>
                  {copied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                  Copiar tudo
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-accent border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">🎣 Hook</span>
                <p className="text-sm font-bold mt-1">{script.hook}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Introdução</span>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{script.introduction}</p>
              </div>

              {script.main_points?.map((point: any, i: number) => (
                <div key={i}>
                  <span className="text-xs font-bold">{point.title}</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{point.content}</p>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-accent border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">📢 Call to Action</span>
                <p className="text-sm mt-1">{script.call_to_action}</p>
              </div>

              {script.tips?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">💡 Dicas</span>
                  <ul className="mt-1 space-y-1">
                    {script.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">· {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="venus-card p-12 text-center">
              <PenTool size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-bold mb-1">Nenhum roteiro gerado</h3>
              <p className="text-sm text-muted-foreground">Preencha os campos e gere seu roteiro com IA</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardScriptGenerator;
