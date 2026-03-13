import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Trash2, Video, Activity, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function useAdminErrors() {
  return useQuery({
    queryKey: ["admin-errors"],
    queryFn: async () => {
      const [failedJobs, errorVideos, stuckJobs] = await Promise.all([
        supabase.from("processing_jobs").select("*").eq("status", "failed").order("created_at", { ascending: false }).limit(50),
        supabase.from("videos").select("*").eq("status", "error").order("created_at", { ascending: false }).limit(50),
        supabase.from("processing_jobs").select("*").in("status", ["queued", "processing"]).lt("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()).order("created_at", { ascending: false }).limit(50),
      ]);

      return {
        failedJobs: failedJobs.data || [],
        errorVideos: errorVideos.data || [],
        stuckJobs: stuckJobs.data || [],
      };
    },
  });
}

const AdminErrors = () => {
  const { data, isLoading, refetch } = useAdminErrors();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleRestartJob = async (jobId: string) => {
    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    const { error } = await supabase
      .from("processing_jobs")
      .update({ status: "queued" as any, progress: 0, current_step: "Reiniciando...", error_message: null })
      .eq("id", jobId);
    if (error) toast.error(error.message);
    else { toast.success("Job reiniciado"); refetch(); }
    setActionLoading(prev => ({ ...prev, [jobId]: false }));
  };

  const handleMarkFailed = async (jobId: string) => {
    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    const { error } = await supabase
      .from("processing_jobs")
      .update({ status: "failed" as any, error_message: "Marcado como falho pelo admin", current_step: "Cancelado" })
      .eq("id", jobId);
    if (error) toast.error(error.message);
    else { toast.success("Job marcado como falho"); refetch(); }
    setActionLoading(prev => ({ ...prev, [jobId]: false }));
  };

  const totalIssues = (data?.failedJobs.length || 0) + (data?.errorVideos.length || 0) + (data?.stuckJobs.length || 0);

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <AlertCircle size={14} className="inline mr-1" />
            {totalIssues} problema{totalIssues !== 1 ? "s" : ""} encontrado{totalIssues !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            <RefreshCw size={12} className="mr-1" /> Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : totalIssues === 0 ? (
          <div className="venus-card p-12 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-muted-foreground/20" />
            <h3 className="font-bold text-lg mb-1">Nenhum problema</h3>
            <p className="text-sm text-muted-foreground">Todos os sistemas estão funcionando normalmente</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stuck Jobs */}
            {data!.stuckJobs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Clock size={12} /> Jobs travados ({data!.stuckJobs.length})
                </h3>
                <div className="space-y-2">
                  {data!.stuckJobs.map((job, i) => (
                    <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="venus-card p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium">{job.current_step || job.status} — {job.progress}%</p>
                        <p className="text-[10px] text-muted-foreground">ID: {job.id.slice(0, 8)}... • Última atualização: {new Date(job.updated_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleRestartJob(job.id)} disabled={actionLoading[job.id]}>
                          {actionLoading[job.id] ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} className="mr-1" />} Reiniciar
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleMarkFailed(job.id)} disabled={actionLoading[job.id]}>
                          Cancelar
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Jobs */}
            {data!.failedJobs.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Activity size={12} /> Jobs com erro ({data!.failedJobs.length})
                </h3>
                <div className="space-y-2">
                  {data!.failedJobs.map((job, i) => (
                    <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="venus-card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">{job.current_step || "Erro"}</p>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleRestartJob(job.id)} disabled={actionLoading[job.id]}>
                          <RefreshCw size={10} className="mr-1" /> Reiniciar
                        </Button>
                      </div>
                      {job.error_message && <p className="text-[10px] text-destructive-foreground bg-destructive/10 rounded px-2 py-1">{job.error_message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(job.created_at).toLocaleString("pt-BR")}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Videos */}
            {data!.errorVideos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Video size={12} /> Vídeos com erro ({data!.errorVideos.length})
                </h3>
                <div className="space-y-2">
                  {data!.errorVideos.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="venus-card p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium truncate max-w-[300px]">{v.title}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(v.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive-foreground">Erro</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminErrors;