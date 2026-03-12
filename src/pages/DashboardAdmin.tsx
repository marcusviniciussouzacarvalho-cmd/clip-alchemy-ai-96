import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { Video, Scissors, Activity, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    staleTime: 1000 * 30,
    queryFn: async () => {
      const [videosRes, clipsRes, jobsRes, recentJobsRes, logsRes] = await Promise.all([
        supabase.from("videos").select("id", { count: "exact", head: true }),
        supabase.from("clips").select("id", { count: "exact", head: true }),
        supabase.from("processing_jobs").select("id, status", { count: "exact" }),
        supabase.from("processing_jobs").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("job_logs").select("*").order("created_at", { ascending: false }).limit(15),
      ]);

      const allJobs = jobsRes.data || [];
      const activeJobs = allJobs.filter((j) => j.status !== "completed" && j.status !== "failed");
      const failedJobs = allJobs.filter((j) => j.status === "failed");

      return {
        totalVideos: videosRes.count || 0,
        totalClips: clipsRes.count || 0,
        totalJobs: jobsRes.count || 0,
        activeJobCount: activeJobs.length,
        failedJobCount: failedJobs.length,
        recentJobs: recentJobsRes.data || [],
        logs: logsRes.data || [],
      };
    },
  });
}

const DashboardAdmin = () => {
  const { data: stats, isLoading } = useAdminStats();

  const platformStats = [
    { icon: Video, label: "Vídeos totais", value: stats?.totalVideos ?? 0 },
    { icon: Scissors, label: "Clips gerados", value: stats?.totalClips ?? 0 },
    { icon: Activity, label: "Jobs ativos", value: stats?.activeJobCount ?? 0 },
    { icon: AlertCircle, label: "Jobs com erro", value: stats?.failedJobCount ?? 0 },
  ];

  const statusLabel: Record<string, string> = {
    queued: "Na fila", processing: "Processando", transcribing: "Transcrevendo",
    analyzing: "Analisando", generating_clips: "Gerando clips", rendering: "Renderizando",
    completed: "Concluído", failed: "Erro",
  };

  return (
    <DashboardLayout>
      <AdminLayout>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {platformStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="venus-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <s.icon size={16} className="text-muted-foreground" />
                <TrendingUp size={12} className="text-muted-foreground/40" />
              </div>
              <div className="text-2xl font-extrabold font-display tabular-nums">
                {isLoading ? <Skeleton className="h-7 w-12" /> : String(s.value)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent jobs */}
          <div className="venus-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Activity size={16} /> Jobs recentes
            </h3>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !stats?.recentJobs.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum job</p>
            ) : (
              <div className="space-y-3">
                {stats.recentJobs.map((j) => (
                  <div key={j.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-xs truncate max-w-[180px]">
                        {j.current_step || statusLabel[j.status] || j.status}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        j.status === "completed" ? "bg-foreground text-background" :
                        j.status === "failed" ? "bg-destructive/20 text-destructive-foreground" :
                        "bg-accent text-muted-foreground"
                      }`}>
                        {statusLabel[j.status] || j.status}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${j.progress || 0}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(j.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System logs */}
          <div className="venus-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={16} /> Logs do sistema
            </h3>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
            ) : !stats?.logs.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum log</p>
            ) : (
              <div className="space-y-1 font-mono text-xs max-h-[400px] overflow-y-auto">
                {stats.logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                    <span className="text-muted-foreground w-14 shrink-0 tabular-nums">
                      {new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className={`w-10 shrink-0 font-bold uppercase ${
                      l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : "text-muted-foreground"
                    }`}>
                      {l.level}
                    </span>
                    <span className="text-muted-foreground truncate">{l.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </DashboardLayout>
  );
};

export default DashboardAdmin;
