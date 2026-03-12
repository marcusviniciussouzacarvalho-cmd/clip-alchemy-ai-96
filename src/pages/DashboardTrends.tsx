import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useTrends } from "@/hooks/use-ai-content";
import { TrendingUp, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const growthColors: Record<string, string> = {
  alta: "bg-emerald-500/20 text-emerald-400",
  média: "bg-amber-500/20 text-amber-400",
  emergente: "bg-blue-500/20 text-blue-400",
};

const DashboardTrends = () => {
  const [trends, setTrends] = useState<any[]>([]);
  const mutation = useTrends();

  const load = () => {
    mutation.mutate(undefined, {
      onSuccess: (data) => setTrends(Array.isArray(data) ? data : []),
      onError: (err: any) => toast.error(err.message),
    });
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Tendências de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Temas populares para criadores</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <RefreshCw size={14} className="mr-1.5" />}
          Atualizar
        </Button>
      </div>

      {trends.length === 0 && !mutation.isPending ? (
        <div className="venus-card p-12 text-center">
          <TrendingUp size={32} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-bold mb-1">Descubra tendências</h3>
          <p className="text-sm text-muted-foreground mb-4">Clique em "Atualizar" para ver os temas mais relevantes</p>
          <Button variant="outline" size="sm" onClick={load}>Carregar tendências</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trends.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="venus-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{t.topic}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${growthColors[t.growth] || "bg-accent text-muted-foreground"}`}>
                  {t.growth}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full">{t.category}</span>
                <span className="text-[10px] text-muted-foreground">💡 {t.tip}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardTrends;
