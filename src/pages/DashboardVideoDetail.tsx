import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideo, useClips, useTranscript, useProcessVideo, useReprocessJob, useJobs } from "@/hooks/use-pipeline";
import { useParams, Link } from "react-router-dom";
import { Video, Play, Scissors, FileText, RefreshCw, Loader2, Clock, BarChart3, AlertCircle, ChevronRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ready: "bg-foreground text-background",
  completed: "bg-foreground text-background",
  processing: "bg-accent text-muted-foreground animate-pulse",
  error: "bg-destructive/20 text-destructive-foreground",
  failed: "bg-destructive/20 text-destructive-foreground",
  uploaded: "bg-accent text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  ready: "Pronto",
  completed: "Concluído",
  processing: "Processando",
  error: "Erro",
  failed: "Erro",
  uploaded: "Enviado",
  draft: "Rascunho",
};

const DashboardVideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading: videoLoading } = useVideo(id);
  const { data: clips, isLoading: clipsLoading } = useClips(id);
  const { data: transcript } = useTranscript(id);
  const { data: jobs } = useJobs(id);
  const processVideo = useProcessVideo();
  const reprocessJob = useReprocessJob();

  const latestJob = jobs?.[0];
  const isProcessing = latestJob && !["completed", "failed"].includes(latestJob.status);

  const handleProcess = async () => {
    if (!id) return;
    try {
      await processVideo.mutateAsync({ videoId: id });
      toast.success("Processamento iniciado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar processamento");
    }
  };

  const handleReprocess = async () => {
    if (!latestJob) return;
    try {
      await reprocessJob.mutateAsync(latestJob.id);
      toast.success("Reprocessamento iniciado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao reprocessar");
    }
  };

  if (videoLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="aspect-video w-full max-w-3xl rounded-xl" />
          <Skeleton className="h-20 w-full max-w-3xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout>
        <div className="venus-card p-12 text-center">
          <Video size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-bold text-lg mb-1">Vídeo não encontrado</h3>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link to="/dashboard/library">Voltar à biblioteca</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link to="/dashboard/library" className="hover:text-foreground transition-colors">Biblioteca</Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{video.title}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">{video.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className={`text-[10px] ${statusColors[video.status || "uploaded"]}`}>
                {statusLabels[video.status || "uploaded"] || video.status}
              </Badge>
              {(video as any).source_type === "youtube" && (
                <span className="flex items-center gap-1 text-xs"><ExternalLink size={10} /> YouTube</span>
              )}
              {video.category && <span>{video.category}</span>}
              <span>{new Date(video.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isProcessing && (video.status === "uploaded" || video.status === "draft") && (
              <Button size="sm" onClick={handleProcess} disabled={processVideo.isPending}>
                {processVideo.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Play size={14} className="mr-1" />}
                Processar
              </Button>
            )}
            {latestJob?.status === "failed" && (
              <Button size="sm" variant="outline" onClick={handleReprocess} disabled={reprocessJob.isPending}>
                <RefreshCw size={14} className="mr-1" /> Reprocessar
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link to="/dashboard/editor"><Scissors size={14} className="mr-1" /> Editor</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player / Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="venus-card overflow-hidden">
            <div className="aspect-video bg-accent flex items-center justify-center relative">
              {(video as any).thumbnail_url ? (
                <img src={(video as any).thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
              ) : (
                <Play size={36} className="text-muted-foreground/30" />
              )}
              {(video as any).source_type === "youtube" && (video as any).external_video_id && (
                <a
                  href={`https://youtube.com/watch?v=${(video as any).external_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-background/80 backdrop-blur px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:bg-background transition-colors"
                >
                  <ExternalLink size={10} /> Ver no YouTube
                </a>
              )}
            </div>
          </div>

          {/* Processing progress */}
          {isProcessing && latestJob && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="venus-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{latestJob.current_step || "Processando..."}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{latestJob.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <motion.div className="h-full rounded-full bg-foreground" animate={{ width: `${latestJob.progress}%` }} />
              </div>
            </motion.div>
          )}

          {/* Error */}
          {(video.status === "error" || latestJob?.status === "failed") && (
            <div className="venus-card p-4 border-destructive/30">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Erro no processamento</p>
                  <p className="text-xs text-muted-foreground mt-1">{latestJob?.error_message || (video as any).error_message || "Erro desconhecido"}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleReprocess}>
                    <RefreshCw size={12} className="mr-1" /> Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div className="venus-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="venus-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Transcrição
              </h3>
              <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto">
                {transcript.full_text || "Transcrição não disponível"}
              </div>
              {transcript.transcript_segments && transcript.transcript_segments.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-border pt-3">
                  {transcript.transcript_segments.slice(0, 10).map((seg: any) => (
                    <div key={seg.id} className="flex items-start gap-2 text-xs">
                      <span className="text-muted-foreground/60 tabular-nums w-10 shrink-0">
                        {Math.floor(seg.start_time / 60)}:{Math.floor(seg.start_time % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground">{seg.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="venus-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Informações</h3>
            <div className="space-y-2 text-sm">
              {video.duration_seconds && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{Math.floor(video.duration_seconds / 60)}:{Math.floor(video.duration_seconds % 60).toString().padStart(2, "0")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origem</span>
                <span className="font-medium capitalize">{(video as any).source_type || "upload"}</span>
              </div>
              {video.language && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idioma</span>
                  <span className="font-medium">{video.language}</span>
                </div>
              )}
              {video.file_size && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho</span>
                  <span className="font-medium">{(video.file_size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Clips */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Scissors size={12} /> Clips ({clips?.length || 0})
              </h3>
            </div>
            {clipsLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !clips?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum clip gerado</p>
            ) : (
              <div className="space-y-1.5">
                {clips.slice(0, 8).map((clip) => (
                  <div key={clip.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{clip.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5"><Clock size={8} />{clip.duration_seconds ? `${Math.floor(clip.duration_seconds / 60)}:${Math.floor(clip.duration_seconds % 60).toString().padStart(2, "0")}` : "—"}</span>
                        <span className="flex items-center gap-0.5"><BarChart3 size={8} />{clip.virality_score || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {clips.length > 8 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                    <Link to="/dashboard/clips">Ver todos os clips</Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Jobs history */}
          {jobs && jobs.length > 0 && (
            <div className="venus-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Histórico de processamento</h3>
              <div className="space-y-2">
                {jobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{job.current_step || job.status}</span>
                      <Badge variant="outline" className={`text-[9px] ${statusColors[job.status]}`}>
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </div>
                    <div className="h-0.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${job.progress || 0}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(job.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardVideoDetail;