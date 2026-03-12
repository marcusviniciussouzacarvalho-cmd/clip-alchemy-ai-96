import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Video, Scissors, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStats } from "@/hooks/use-pipeline";
import { Skeleton } from "@/components/ui/skeleton";

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

const DashboardAnalytics = () => {
  const { data: stats, isLoading } = useDashboardStats();

  const statCards = [
    { icon: Video, label: "Vídeos processados", value: stats?.videoCount ?? 0, sub: "total" },
    { icon: Scissors, label: "Clips gerados", value: stats?.clipCount ?? 0, sub: "total" },
    { icon: Clock, label: "Créditos usados", value: stats?.totalUsed ?? 0, sub: "total" },
    { icon: TrendingUp, label: "Créditos restantes", value: stats?.credits ?? 0, sub: "disponíveis" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground">Métricas de uso da plataforma</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="venus-card p-5"
          >
            <s.icon size={16} className="text-muted-foreground mb-3" />
            <div className="text-2xl font-extrabold font-display tabular-nums">
              {isLoading ? <Skeleton className="h-7 w-12" /> : String(s.value)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
            <div className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="venus-card p-6 mb-6"
      >
        <h3 className="font-bold text-sm mb-6">Clips gerados por dia</h3>
        <div className="flex items-end justify-between gap-2 h-36">
          {weekData.map((d, i) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold tabular-nums">{d.clips}</span>
              <motion.div
                className="w-full rounded-t bg-foreground"
                initial={{ height: 0 }}
                animate={{ height: `${(d.clips / maxClips) * 100}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
              />
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Virality distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="venus-card p-6"
      >
        <h3 className="font-bold text-sm mb-4">Distribuição de Viralidade</h3>
        <div className="space-y-3">
          {[
            { label: "90-100", pct: 15, color: "bg-emerald-400" },
            { label: "80-89", pct: 35, color: "bg-foreground" },
            { label: "70-79", pct: 30, color: "bg-muted-foreground" },
            { label: "< 70", pct: 20, color: "bg-muted-foreground/40" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 tabular-nums">Score {item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-accent overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${item.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                />
              </div>
              <span className="text-xs font-bold w-8 tabular-nums">{item.pct}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardAnalytics;
