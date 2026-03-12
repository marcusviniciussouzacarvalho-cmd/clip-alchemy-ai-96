import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function useAdminJobs() {
  return useQuery({
    queryKey: ["admin-jobs"],
    staleTime: 1000 * 15,
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from("processing_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return jobs;
    },
  });
}

const statusLabel: Record<string, string> = {
  queued: "Na fila", processing: "Processando", transcribing: "Transcrevendo",
  analyzing: "Analisando", generating_clips: "Gerando clips", rendering: "Renderizando",
  completed: "Concluído", failed: "Erro",
};

const AdminJobs = () => {
  const { data: jobs, isLoading, refetch } = useAdminJobs();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const loadLogs = async (jobId: string) => {
    if (expandedJob === jobId) { setExpandedJob(null); return; }
    setExpandedJob(jobId);
    setLoadingLogs(true);
    const { data } = await supabase
      .from("job_logs")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });
    setLogs(data || []);
    setLoadingLogs(false);
  };

  const handleRestart = async (jobId: string) => {
    const { error } = await supabase
      .from("processing_jobs")
      .update({ status: "queued" as any, progress: 0, current_step: "Reiniciando...", error_message: null })
      .eq("id", jobId);
    if (error) toast.error(error.message);
    else { toast.success("Job reiniciado"); refetch(); }
  };

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <Activity size={14} className="inline mr-1" />
            {jobs?.length || 0} jobs recentes
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-7 text-xs">
            <RefreshCw size={12} className="mr-1" /> Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : !jobs?.length ? (
          <div className="venus-card p-10 text-center">
            <Activity size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum job encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="venus-card overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        job.status === "completed" ? "bg-foreground text-background" :
                        job.status === "failed" ? "bg-destructive/20 text-destructive-foreground" :
                        "bg-accent text-muted-foreground"
                      }`}>
                        {statusLabel[job.status] || job.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{job.current_step || ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {job.status === "failed" && (
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleRestart(job.id)}>
                          <RefreshCw size={10} className="mr-1" /> Reiniciar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => loadLogs(job.id)}>
                        {expandedJob === job.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </Button>
                    </div>
                  </div>

                  <div className="h-1 rounded-full bg-accent overflow-hidden mb-1.5">
                    <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${job.progress || 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[200px]">ID: {job.id.slice(0, 8)}...</span>
                    <span>{job.progress || 0}% • {new Date(job.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  {job.error_message && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 text-destructive-foreground text-[11px] flex items-start gap-1.5">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      {job.error_message}
                    </div>
                  )}
                </div>

                {expandedJob === job.id && (
                  <div className="border-t border-border p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Logs</p>
                    {loadingLogs ? (
                      <Skeleton className="h-20 w-full" />
                    ) : logs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum log</p>
                    ) : (
                      <div className="space-y-1 font-mono text-[11px] max-h-48 overflow-y-auto">
                        {logs.map((l) => (
                          <div key={l.id} className="flex items-start gap-2">
                            <span className="text-muted-foreground w-16 shrink-0 tabular-nums">
                              {new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </span>
                            <span className={`w-10 shrink-0 font-bold uppercase ${l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : "text-muted-foreground"}`}>
                              {l.level}
                            </span>
                            <span className="text-muted-foreground">{l.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminJobs;
