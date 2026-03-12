import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useCredits, useCreditTransactions } from "@/hooks/use-pipeline";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const creditActions = [
  { label: "Upload (por minuto)", cost: "2" },
  { label: "Geração de clips", cost: "5/clip" },
  { label: "Transcrição", cost: "1/min" },
  { label: "Legendas automáticas", cost: "1/clip" },
  { label: "Auto Reframe", cost: "3/clip" },
  { label: "Exportação HD", cost: "2" },
  { label: "Exportação 4K", cost: "5" },
];

const DashboardCredits = () => {
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: transactions, isLoading: txLoading } = useCreditTransactions();

  const usagePercent = credits
    ? Math.min(100, (credits.total_used / Math.max(1, credits.balance + credits.total_used)) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Créditos</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus créditos de uso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="venus-card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Saldo atual</div>
                <div className="text-4xl font-extrabold font-display tabular-nums">
                  {creditsLoading ? <Skeleton className="h-10 w-20" /> : credits?.balance ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">créditos disponíveis</div>
              </div>
              <Button size="sm"><Zap size={14} className="mr-1.5" /> Comprar</Button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Usado</span>
                <span className="tabular-nums">{credits?.total_used ?? 0} créditos</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-foreground"
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </motion.div>

          {/* History */}
          <div className="venus-card p-6">
            <h3 className="font-bold text-sm mb-4">Histórico</h3>
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-2.5 w-20" /></div>
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma transação ainda</p>
            ) : (
              <div className="space-y-0">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{tx.description}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${tx.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="venus-card p-5 h-fit"
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4">Tabela de custos</h3>
          <div className="space-y-2.5">
            {creditActions.map((a) => (
              <div key={a.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{a.label}</span>
                <span className="font-medium text-xs tabular-nums">{a.cost}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCredits;
