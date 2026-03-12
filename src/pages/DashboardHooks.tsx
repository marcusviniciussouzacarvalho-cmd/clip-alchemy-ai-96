import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { VIRAL_HOOKS } from "@/hooks/use-ai-content";
import { Anchor, Copy, Check, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const categories = [...new Set(VIRAL_HOOKS.map((h) => h.category))];

const DashboardHooks = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = filter ? VIRAL_HOOKS.filter((h) => h.category === filter) : VIRAL_HOOKS;

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Hook copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Biblioteca de Hooks Virais</h1>
        <p className="text-sm text-muted-foreground">Frases de abertura que viralizam</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setFilter(null)}
          className={`text-[11px] px-3 py-1 rounded-full transition-colors ${
            !filter ? "bg-foreground text-background font-semibold" : "bg-accent text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-[11px] px-3 py-1 rounded-full transition-colors capitalize ${
              filter === cat ? "bg-foreground text-background font-semibold" : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((hook, i) => (
          <motion.div
            key={hook.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="venus-card p-4 flex items-start justify-between gap-3 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">"{hook.text}"</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full capitalize">{hook.category}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  hook.impact === "alto" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  {hook.impact}
                </span>
              </div>
            </div>
            <button
              onClick={() => copy(hook.text, hook.id)}
              className="shrink-0 p-2 rounded-lg hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
            >
              {copiedId === hook.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-muted-foreground" />}
            </button>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardHooks;
