import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRepurposeContent } from "@/hooks/use-ai-content";
import { Repeat, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface DerivedContentProps {
  title: string;
  transcript: string;
}

const tabs = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter_thread", label: "X Thread" },
  { key: "instagram_carousel", label: "Instagram" },
  { key: "blog_article", label: "Blog" },
];

export const DerivedContent = ({ title, transcript }: DerivedContentProps) => {
  const [content, setContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [copied, setCopied] = useState(false);
  const mutation = useRepurposeContent();

  const generate = () => {
    mutation.mutate({ title, transcript }, {
      onSuccess: (data) => setContent(data),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const getContent = () => {
    if (!content) return "";
    const val = content[activeTab];
    if (Array.isArray(val)) return val.join("\n\n---\n\n");
    return val || "";
  };

  const copyContent = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    toast.success("Conteúdo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Repeat size={12} /> Conteúdos Derivados
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Repeat size={12} className="mr-1" />}
          Gerar
        </Button>
      </div>

      {content && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                  activeTab === tab.key ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground bg-accent rounded-lg p-3 max-h-60 overflow-y-auto">
              {getContent()}
            </pre>
            <button
              onClick={copyContent}
              className="absolute top-2 right-2 p-1.5 rounded bg-background/80 hover:bg-background transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-muted-foreground" />}
            </button>
          </div>
        </motion.div>
      )}

      {!content && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Transforme seu vídeo em conteúdo para outras plataformas</p>
      )}
    </div>
  );
};
