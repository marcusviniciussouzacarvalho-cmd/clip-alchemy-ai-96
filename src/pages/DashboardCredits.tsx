import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CreditCard, Zap, ArrowRight, Clock } from "lucide-react";

const creditActions = [
  { label: "Upload de vídeo (por minuto)", cost: "2 créditos" },
  { label: "Geração de clips", cost: "5 créditos/clip" },
  { label: "Transcrição", cost: "1 crédito/min" },
  { label: "Legendas automáticas", cost: "1 crédito/clip" },
  { label: "Auto Reframe", cost: "3 créditos/clip" },
  { label: "Exportação HD", cost: "2 créditos" },
  { label: "Exportação 4K", cost: "5 créditos" },
];

const history = [
  { desc: "Geração de 8 clips", cost: -40, date: "Hoje, 14:32" },
  { desc: "Transcrição - 15 min", cost: -15, date: "Hoje, 14:30" },
  { desc: "Upload de vídeo - 15 min", cost: -30, date: "Hoje, 14:28" },
  { desc: "Compra de créditos", cost: 500, date: "Ontem, 09:00" },
];

const DashboardCredits = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="text-2xl font-extrabold mb-1">Créditos</h1>
      <p className="text-sm text-muted-foreground">Gerencie seus créditos de uso</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Balance */}
        <div className="venus-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Saldo atual</div>
              <div className="text-4xl font-extrabold font-display">850</div>
              <div className="text-sm text-muted-foreground">créditos disponíveis</div>
            </div>
            <Button>
              <Zap size={16} className="mr-2" /> Comprar créditos
            </Button>
          </div>
          {/* Usage bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Usado este mês</span>
              <span>150 / 1000</span>
            </div>
            <div className="h-2 rounded-full bg-accent overflow-hidden">
              <div className="h-full rounded-full bg-foreground" style={{ width: "15%" }} />
            </div>
          </div>
        </div>

        {/* History */}
        <div className="venus-card p-6">
          <h3 className="font-bold mb-4">Histórico</h3>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{h.desc}</div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                </div>
                <span className={`text-sm font-bold ${h.cost > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                  {h.cost > 0 ? '+' : ''}{h.cost}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost reference */}
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

export default DashboardCredits;
