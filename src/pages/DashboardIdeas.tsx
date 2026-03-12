import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContentIdeas } from "@/hooks/use-ai-content";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Loader2, Bookmark, Trash2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSupabaseAuth } from "@/hooks/use-auth";

const formatColors: Record<string, string> = {
  tutorial: "bg-blue-500/20 text-blue-400",
  storytelling: "bg-purple-500/20 text-purple-400",
  lista: "bg-amber-500/20 text-amber-400",
  opinião: "bg-rose-500/20 text-rose-400",
  react: "bg-emerald-500/20 text-emerald-400",
  vlog: "bg-cyan-500/20 text-cyan-400",
};

const DashboardIdeas = () => {
  const [tab, setTab] = useState<"generate" | "saved">("generate");
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [ideas, setIdeas] = useState<any[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const ideaMut = useContentIdeas();
  const { user } = useAuth();

  const loadSaved = async () => {
    if (!user) return;
    setLoadingSaved(true);
    const { data } = await supabase
      .from("saved_ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSavedIdeas(data || []);
    setLoadingSaved(false);
  };

  useEffect(() => {
    if (tab === "saved") loadSaved();
  }, [tab, user]);

  const generate = () => {
    if (!topic) return toast.error("Informe o tema");
    ideaMut.mutate({ topic, niche }, {
      onSuccess: (data) => setIdeas(Array.isArray(data) ? data : []),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const saveIdea = async (idea: any) => {
    if (!user) return;
    const { error } = await supabase.from("saved_ideas").insert({
      user_id: user.id,
      title: idea.title,
      hooks: idea.hook ? [idea.hook] : [],
      category: idea.format || "geral",
      source: "ai",
    });
    if (error) toast.error("Erro ao salvar");
    else toast.success("Ideia salva!");
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase.from("saved_ideas").delete().eq("id", id);
    if (error) toast.error("Erro ao deletar");
    else {
      toast.success("Ideia removida");
      setSavedIdeas((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Ideias de Conteúdo</h1>
        <p className="text-sm text-muted-foreground">Gere e salve ideias de vídeos com IA</p>
      </div>

      <div className="flex gap-1 mb-5 p-0.5 bg-accent rounded-lg w-fit">
        <button onClick={() => setTab("generate")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${tab === "generate" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
          <Sparkles size={12} /> Gerar
        </button>
        <button onClick={() => setTab("saved")} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${tab === "saved" ? "bg-foreground text-background" : "text-muted-foreground"}`}>
          <Bookmark size={12} /> Salvas ({savedIdeas.length})
        </button>
      </div>

      {tab === "generate" ? (
        <div className="space-y-5">
          <div className="venus-card p-5 flex flex-col sm:flex-row gap-3">
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema (ex: marketing digital)" className="h-9 text-sm flex-1" />
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Nicho (opcional)" className="h-9 text-sm w-full sm:w-40" />
            <Button size="sm" onClick={generate} disabled={ideaMut.isPending}>
              {ideaMut.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Sparkles size={14} className="mr-1.5" />}
              Gerar ideias
            </Button>
          </div>

          {ideas.length === 0 && !ideaMut.isPending ? (
            <div className="venus-card p-12 text-center">
              <Lightbulb size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-bold mb-1">Gere ideias de conteúdo</h3>
              <p className="text-sm text-muted-foreground">Informe um tema e a IA sugerirá vídeos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ideas.map((idea, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="venus-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold">{idea.title}</h3>
                    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => saveIdea(idea)}>
                      <Bookmark size={14} />
                    </Button>
                  </div>
                  {idea.hook && (
                    <p className="text-xs text-muted-foreground italic">"{idea.hook}"</p>
                  )}
                  {idea.description && (
                    <p className="text-xs text-muted-foreground">{idea.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${formatColors[idea.format] || "bg-accent text-muted-foreground"}`}>
                      {idea.format}
                    </span>
                    {idea.estimated_views && (
                      <span className="text-[10px] text-muted-foreground">📈 {idea.estimated_views}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loadingSaved ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : savedIdeas.length === 0 ? (
            <div className="venus-card p-12 text-center">
              <Bookmark size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="font-bold mb-1">Nenhuma ideia salva</h3>
              <p className="text-sm text-muted-foreground">Gere ideias e salve as melhores</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedIdeas.map((idea, i) => (
                <motion.div key={idea.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="venus-card p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">{idea.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${formatColors[idea.category] || "bg-accent text-muted-foreground"}`}>
                        {idea.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{new Date(idea.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                    {idea.hooks?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">"{idea.hooks[0]}"</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteIdea(idea.id)}>
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardIdeas;
