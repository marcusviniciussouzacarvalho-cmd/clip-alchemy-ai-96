import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { useCredits, useCreditTransactions } from "@/hooks/use-pipeline";

const creditActions = [
  { label: "Upload de vídeo (por minuto)", cost: "2 créditos" },
  { label: "Geração de clips", cost: "5 créditos/clip" },
  { label: "Transcrição", cost: "1 crédito/min" },
  { label: "Legendas automáticas", cost: "1 crédito/clip" },
  { label: "Auto Reframe", cost: "3 créditos/clip" },
  { label: "Exportação HD", cost: "2 créditos" },
  { label: "Exportação 4K", cost: "5 créditos" },
];

const DashboardCredits = () => {
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: transactions, isLoading: txLoading } = useCreditTransactions();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Créditos</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus créditos de uso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="venus-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Saldo atual</div>
                <div className="text-4xl font-extrabold font-display">
                  {creditsLoading ? <Loader2 className="animate-spin" /> : credits?.balance ?? 0}
                </div>
                <div className="text-sm text-muted-foreground">créditos disponíveis</div>
              </div>
              <Button><Zap size={16} className="mr-2" /> Comprar créditos</Button>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Total usado</span>
                <span>{credits?.total_used ?? 0} créditos</span>
              </div>
              <div className="h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${credits ? Math.min(100, (credits.total_used / (credits.balance + credits.total_used)) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="venus-card p-6">
            <h3 className="font-bold mb-4">Histórico</h3>
            {txLoading ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação ainda</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="venus-card p-6 h-fit">
          <h3 className="font-bold mb-4">Tabela de custos</h3>
          <div className="space-y-3">
            {creditActions.map((a) => (
              <div key={a.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{a.label}</span>
                <span className="font-medium">{a.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCredits;
