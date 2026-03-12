import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Video, Scissors, Clock, TrendingUp } from "lucide-react";

const stats = [
  { icon: Video, label: "Vídeos processados", value: "42", sub: "este mês" },
  { icon: Scissors, label: "Clips gerados", value: "186", sub: "este mês" },
  { icon: Clock, label: "Minutos usados", value: "1.234", sub: "de 2.000" },
  { icon: TrendingUp, label: "Score médio", value: "82", sub: "viralidade" },
];

const weekData = [
  { day: "Seg", clips: 8 },
  { day: "Ter", clips: 12 },
  { day: "Qua", clips: 5 },
  { day: "Qui", clips: 18 },
  { day: "Sex", clips: 15 },
  { day: "Sáb", clips: 3 },
  { day: "Dom", clips: 7 },
];

const maxClips = Math.max(...weekData.map(d => d.clips));

const DashboardAnalytics = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="text-2xl font-extrabold mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground">Métricas de uso da plataforma</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="venus-card p-5">
          <s.icon size={18} className="text-muted-foreground mb-3" />
          <div className="text-2xl font-extrabold font-display">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          <div className="text-xs text-muted-foreground/60 mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>

    {/* Simple bar chart */}
    <div className="venus-card p-6 mb-8">
      <h3 className="font-bold mb-6">Clips gerados por dia</h3>
      <div className="flex items-end justify-between gap-2 h-40">
        {weekData.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-bold">{d.clips}</span>
            <div
              className="w-full rounded-t-lg bg-foreground transition-all"
              style={{ height: `${(d.clips / maxClips) * 100}%` }}
            />
            <span className="text-xs text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Virality distribution */}
    <div className="venus-card p-6">
      <h3 className="font-bold mb-4">Distribuição de Viralidade</h3>
      <div className="space-y-3">
        {[
          { label: "Score 90-100", pct: 15 },
          { label: "Score 80-89", pct: 35 },
          { label: "Score 70-79", pct: 30 },
          { label: "Score < 70", pct: 20 },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-24">{item.label}</span>
            <div className="flex-1 h-2 rounded-full bg-accent overflow-hidden">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${item.pct}%` }} />
            </div>
            <span className="text-xs font-bold w-8">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default DashboardAnalytics;
