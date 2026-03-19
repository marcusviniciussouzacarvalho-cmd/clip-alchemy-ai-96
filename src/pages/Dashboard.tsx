import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Video, Scissors, Clock, CreditCard, ArrowRight, BarChart3, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useDashboardStats, useJobs } from "@/hooks/use-pipeline";
import { useSupabaseAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: jobs } = useJobs();

  const activeJobs = jobs?.filter((j) => j.status !== "completed" && j.status !== "failed") || [];
  const recentJobs = jobs?.slice(0, 5) || [];
  const hasAnyData = stats && (stats.videoCount > 0 || stats.clipCount > 0);

  const statCards = [
    { icon: Video, label: "Vídeos enviados", value: stats?.videoCount ?? 0, color: "text-foreground" },
    { icon: Scissors, label: "Clips gerados", value: stats?.clipCount ?? 0, color: "text-foreground" },
    { icon: CreditCard, label: "Créditos disponíveis", value: stats?.credits ?? 0, color: "text-foreground" },
    { icon: Clock, label: "Créditos usados", value: stats?.totalUsed ?? 0, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="venus-card-hover p-5 group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <s.icon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </div>
            <div className="text-2xl font-extrabold font-display tabular-nums">
              {statsLoading ? <Skeleton className="h-7 w-16" /> : String(s.value)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant="default" size="sm" asChild>
          <Link to="/dashboard/upload">
            <Upload size={14} className="mr-1.5" />
            Upload
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/clips">
            <Scissors size={14} className="mr-1.5" />
            Clips
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/analytics">
            <BarChart3 size={14} className="mr-1.5" />
            Analytics
          </Link>
        </Button>
      </div>

      {/* Onboarding - show when no data */}
      {!statsLoading && !hasAnyData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="venus-card p-8 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-foreground" />
            <h2 className="font-bold">Comece agora</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Criar conta", desc: "Conta criada com sucesso", done: true },
              { step: "2", title: "Enviar vídeo", desc: "Faça upload do seu primeiro vídeo", done: false, href: "/dashboard/upload" },
              { step: "3", title: "Gerar clips", desc: "A IA vai criar clips automaticamente", done: false },
            ].map((s) => (
              <div
                key={s.step}
                className={`p-4 rounded-lg border transition-colors ${
                  s.done ? "border-foreground/20 bg-accent/50" : "border-border hover:border-foreground/10"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-3 ${
                  s.done ? "bg-foreground text-background" : "bg-accent text-muted-foreground border border-border"
                }`}>
                  {s.done ? "✓" : s.step}
                </div>
                <h3 className="text-sm font-bold mb-0.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                {s.href && !s.done && (
                  <Button variant="outline" size="sm" asChild className="mt-3">
                    <Link to={s.href}>
                      <Zap size={12} className="mr-1" /> Começar
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Processando agora</h2>
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 venus-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{job.current_step || "Processando..."}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{job.progress}%</span>
                </div>
                <div className="h-1 rounded-full bg-accent overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-foreground"
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">Atividade recente</h2>
        {recentJobs.length === 0 ? (
          <div className="venus-card p-10 text-center">
            <Video size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-4">Nenhuma atividade ainda</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/upload">Enviar primeiro vídeo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg venus-card hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <Video size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{job.current_step || job.status}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    job.status === "completed" ? "bg-foreground text-background" :
                    job.status === "failed" ? "bg-destructive/20 text-destructive-foreground" :
                    "bg-accent text-muted-foreground animate-pulse-subtle"
                  }`}>
                    {job.status === "completed" ? "Pronto" : job.status === "failed" ? "Erro" : "Processando"}
                  </span>
                  <ArrowRight size={12} className="text-muted-foreground/40" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
