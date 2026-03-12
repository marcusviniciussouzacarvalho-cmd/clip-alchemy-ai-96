import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Video, Scissors, Clock, CreditCard, ArrowRight, BarChart3, Loader2 } from "lucide-react";
import { useDashboardStats, useJobs } from "@/hooks/use-pipeline";
import { useSupabaseAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: jobs } = useJobs();

  const activeJobs = jobs?.filter((j) => j.status !== "completed" && j.status !== "failed") || [];
  const recentJobs = jobs?.slice(0, 5) || [];

  const statCards = [
    { icon: Video, label: "Vídeos enviados", value: stats?.videoCount ?? "—" },
    { icon: Scissors, label: "Clips gerados", value: stats?.clipCount ?? "—" },
    { icon: CreditCard, label: "Créditos disponíveis", value: stats?.credits ?? "—" },
    { icon: Clock, label: "Créditos usados", value: stats?.totalUsed ?? "—" },
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="p-5 rounded-xl venus-card">
            <s.icon size={18} className="text-muted-foreground mb-3" />
            <div className="text-2xl font-extrabold font-display">
              {statsLoading ? <Loader2 size={20} className="animate-spin" /> : String(s.value)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Button variant="default" asChild>
          <Link to="/dashboard/upload">
            <Upload size={16} className="mr-2" />
            Upload de vídeo
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/clips">
            <Scissors size={16} className="mr-2" />
            Ver clips
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/analytics">
            <BarChart3 size={16} className="mr-2" />
            Analytics
          </Link>
        </Button>
      </div>

      {/* Active jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold mb-4">Processando agora</h2>
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl venus-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{job.current_step}</span>
                  <span className="text-xs text-muted-foreground">{job.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-500"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <h2 className="font-bold mb-4">Atividade recente</h2>
        {recentJobs.length === 0 ? (
          <div className="venus-card p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma atividade ainda</p>
            <Button variant="outline" asChild>
              <Link to="/dashboard/upload">Enviar primeiro vídeo</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 rounded-xl venus-card hover:bg-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent border border-border flex items-center justify-center">
                    <Video size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{job.current_step || job.status}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    job.status === "completed" ? "bg-foreground text-background" :
                    job.status === "failed" ? "bg-destructive text-destructive-foreground" :
                    "bg-accent text-muted-foreground animate-pulse-subtle"
                  }`}>
                    {job.status === "completed" ? "Pronto" : job.status === "failed" ? "Erro" : "Processando"}
                  </span>
                  <ArrowRight size={14} className="text-muted-foreground" />
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
