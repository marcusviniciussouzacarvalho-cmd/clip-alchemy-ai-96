import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateHashtags, useGenerateDescription, useGenerateCTA } from "@/hooks/use-ai-content";
import { Hash, FileText, Megaphone, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DashboardSocialTools = () => {
  const [tab, setTab] = useState<"hashtags" | "description" | "cta">("hashtags");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [transcript, setTranscript] = useState("");
  const [platform, setPlatform] = useState("YouTube");
  const [goal, setGoal] = useState("engajamento");
  const [copied, setCopied] = useState<string | null>(null);

  const [hashtagResult, setHashtagResult] = useState<any>(null);
  const [descResult, setDescResult] = useState<any>(null);
  const [ctaResult, setCtaResult] = useState<any[]>([]);

  const hashtagsMut = useGenerateHashtags();
  const descMut = useGenerateDescription();
  const ctaMut = useGenerateCTA();

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const generateHashtags = () => {
    if (!title) return toast.error("Informe o título");
    hashtagsMut.mutate({ title, topic, transcript }, {
      onSuccess: (data) => setHashtagResult(data),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const generateDesc = () => {
    if (!title) return toast.error("Informe o título");
    descMut.mutate({ title, transcript, platform }, {
      onSuccess: (data) => setDescResult(data),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const generateCTA = () => {
    if (!title) return toast.error("Informe o título");
    ctaMut.mutate({ title, topic, goal }, {
      onSuccess: (data) => setCtaResult(Array.isArray(data) ? data : []),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const tabs = [
    { key: "hashtags" as const, icon: Hash, label: "Hashtags" },
    { key: "description" as const, icon: FileText, label: "Descrição" },
    { key: "cta" as const, icon: Megaphone, label: "CTA" },
  ];

  const isPending = hashtagsMut.isPending || descMut.isPending || ctaMut.isPending;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Ferramentas Sociais</h1>
        <p className="text-sm text-muted-foreground">Gere hashtags, descrições e CTAs com IA</p>
      </div>

      <div className="flex gap-1 mb-5 p-0.5 bg-accent rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="venus-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Informações do conteúdo</h3>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do vídeo" className="h-9 text-sm" />
          {tab === "hashtags" && (
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema / nicho (opcional)" className="h-9 text-sm" />
          )}
          {tab === "description" && (
            <div className="flex gap-1 p-0.5 bg-accent rounded-lg w-fit">
              {["YouTube", "Instagram", "TikTok"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${platform === p ? "bg-foreground text-background" : "text-muted-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          {tab === "cta" && (
            <div className="flex gap-1 p-0.5 bg-accent rounded-lg w-fit">
              {["engajamento", "inscrição", "venda", "tráfego"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${goal === g ? "bg-foreground text-background" : "text-muted-foreground"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
          <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transcrição ou resumo (opcional)" rows={3} className="text-sm" />
          <Button
            size="sm"
            onClick={tab === "hashtags" ? generateHashtags : tab === "description" ? generateDesc : generateCTA}
            disabled={isPending}
          >
            {isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
            Gerar {tab === "hashtags" ? "Hashtags" : tab === "description" ? "Descrição" : "CTAs"}
          </Button>
        </div>

        {/* Output */}
        <div className="venus-card p-5 space-y-3">
          <h3 className="text-sm font-bold">Resultado</h3>

          {tab === "hashtags" && hashtagResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {hashtagResult.primary?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 uppercase font-bold">Principais</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtagResult.primary.map((h: string, i: number) => (
                      <span key={i} className="text-xs bg-foreground text-background px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80" onClick={() => copyText(`#${h}`, `p-${i}`)}>
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hashtagResult.niche?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 uppercase font-bold">Nicho</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtagResult.niche.map((h: string, i: number) => (
                      <span key={i} className="text-xs bg-accent px-2 py-0.5 rounded-full cursor-pointer hover:bg-accent/80" onClick={() => copyText(`#${h}`, `n-${i}`)}>
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hashtagResult.trending?.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1.5 uppercase font-bold">Em alta 🔥</p>
                  <div className="flex flex-wrap gap-1.5">
                    {hashtagResult.trending.map((h: string, i: number) => (
                      <span key={i} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => copyText(`#${h}`, `t-${i}`)}>
                        #{h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => copyText(hashtagResult.hashtags?.map((h: string) => `#${h}`).join(" ") || "", "all")}>
                {copied === "all" ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                Copiar todas
              </Button>
            </motion.div>
          )}

          {tab === "description" && descResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Descrição completa</p>
                <p className="text-sm whitespace-pre-wrap bg-accent/50 rounded-lg p-3">{descResult.description}</p>
                <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(descResult.description, "desc")}>
                  {copied === "desc" ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />} Copiar
                </Button>
              </div>
              {descResult.short_version && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Versão curta</p>
                  <p className="text-sm bg-accent/50 rounded-lg p-3">{descResult.short_version}</p>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(descResult.short_version, "short")}>
                    {copied === "short" ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />} Copiar
                  </Button>
                </div>
              )}
              {descResult.emojis_version && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase font-bold">Com emojis</p>
                  <p className="text-sm bg-accent/50 rounded-lg p-3">{descResult.emojis_version}</p>
                  <Button variant="ghost" size="sm" className="mt-1" onClick={() => copyText(descResult.emojis_version, "emoji")}>
                    {copied === "emoji" ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />} Copiar
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {tab === "cta" && ctaResult.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {ctaResult.map((cta, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-3 bg-accent/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cta.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded-full">{cta.type}</span>
                      <span className="text-[10px] text-muted-foreground">{cta.best_for}</span>
                      <span className="text-[10px] text-muted-foreground">Score: {cta.strength}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => copyText(cta.text, `cta-${i}`)}>
                    {copied === `cta-${i}` ? <Check size={12} /> : <Copy size={12} />}
                  </Button>
                </div>
              ))}
            </motion.div>
          )}

          {!hashtagResult && !descResult && ctaResult.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40">
              <FileText size={28} className="mx-auto mb-2" />
              <p className="text-sm">Resultado aparecerá aqui</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSocialTools;
