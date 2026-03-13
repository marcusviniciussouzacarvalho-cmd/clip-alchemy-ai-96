import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useVideo, useClips, useTranscript, useProcessVideo, useReprocessJob, useJobs } from "@/hooks/use-pipeline";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Video, Play, Scissors, FileText, RefreshCw, Loader2, Clock, BarChart3, AlertCircle, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import VideoPlayer, { VideoPlayerRef } from "@/components/video/VideoPlayer";
import { formatDuration, getVideoStatusInfo } from "@/lib/video-utils";
import { useQueryClient } from "@tanstack/react-query";

const DashboardVideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: video, isLoading: videoLoading, refetch: refetchVideo } = useVideo(id);
  const { data: clips, isLoading: clipsLoading, refetch: refetchClips } = useClips(id);
  const { data: transcript } = useTranscript(id);
  const { data: jobs } = useJobs(id);
  const processVideo = useProcessVideo();
  const reprocessJob = useReprocessJob();
  const navigate = useNavigate();
  const playerRef = useRef<VideoPlayerRef>(null);
  const queryClient = useQueryClient();

  // Realtime subscription for this specific video's data
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`video-detail-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "videos", filter: `id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["video", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "processing_jobs", filter: `video_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["jobs", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clips", filter: `video_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["clips", id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transcripts", filter: `video_id=eq.${id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["transcript", id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);

  // Manual clip creation state
  const [showClipCreator, setShowClipCreator] = useState(false);
  const [clipTitle, setClipTitle] = useState("");
  const [clipStart, setClipStart] = useState("0:00");
  const [clipEnd, setClipEnd] = useState("0:30");
  const [creatingClip, setCreatingClip] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const latestJob = jobs?.[0];
  const isProcessing = latestJob && !["completed", "failed"].includes(latestJob.status);
  const statusInfo = getVideoStatusInfo(video?.status || null);

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

  const parseTime = (str: string): number => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    return 0;
  };

  const handleSetClipStart = () => {
    const t = playerRef.current?.getCurrentTime() || 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    setClipStart(`${m}:${s.toString().padStart(2, "0")}`);
  };

  const handleSetClipEnd = () => {
    const t = playerRef.current?.getCurrentTime() || 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    setClipEnd(`${m}:${s.toString().padStart(2, "0")}`);
  };

  const handleCreateClip = useCallback(async () => {
    if (!id || !video) return;
    const startSec = parseTime(clipStart);
    const endSec = parseTime(clipEnd);

    if (endSec <= startSec) {
      toast.error("O fim deve ser maior que o início");
      return;
    }
    if (!clipTitle.trim()) {
      toast.error("Informe um título para o clip");
      return;
    }

    setCreatingClip(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("clips").insert({
        video_id: id,
        user_id: user.id,
        title: clipTitle.trim(),
        start_time: startSec,
        end_time: endSec,
        duration_seconds: endSec - startSec,
        format: "9:16",
        status: "manual",
        virality_score: 0,
      });

      if (error) throw error;
      toast.success("Clip criado com sucesso!");
      setClipTitle("");
      setShowClipCreator(false);
      refetchClips();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar clip");
    } finally {
      setCreatingClip(false);
    }
  }, [id, video, clipTitle, clipStart, clipEnd, refetchClips]);

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
              <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>
                {statusInfo.label}
              </Badge>
              {video.source_type === "youtube" && (
                <span className="flex items-center gap-1 text-xs"><ExternalLink size={10} /> YouTube</span>
              )}
              {video.category && <span>{video.category}</span>}
              <span>{new Date(video.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statusInfo.canProcess && !isProcessing && (
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
            <Button size="sm" variant="outline" onClick={() => setShowClipCreator(!showClipCreator)}>
              <Plus size={14} className="mr-1" /> Criar clip
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to={`/dashboard/editor?video=${id}`}><Scissors size={14} className="mr-1" /> Editor</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player & main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Functional Video Player */}
          <div className="venus-card overflow-hidden">
            <VideoPlayer
              ref={playerRef}
              video={video}
              onDurationChange={setVideoDuration}
            />
          </div>

          {/* Manual clip creator */}
          {showClipCreator && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="venus-card p-4 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Scissors size={14} /> Criar clip manual
              </h3>
              <div>
                <Input
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  placeholder="Título do clip"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</label>
                  <div className="flex gap-1.5 mt-1">
                    <Input value={clipStart} onChange={(e) => setClipStart(e.target.value)} className="h-7 text-xs" />
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={handleSetClipStart}>
                      Marcar
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fim</label>
                  <div className="flex gap-1.5 mt-1">
                    <Input value={clipEnd} onChange={(e) => setClipEnd(e.target.value)} className="h-7 text-xs" />
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={handleSetClipEnd}>
                      Marcar
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateClip} disabled={creatingClip} className="flex-1">
                  {creatingClip ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                  Criar clip
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowClipCreator(false)}>Cancelar</Button>
              </div>
            </motion.div>
          )}

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
                  <p className="text-xs text-muted-foreground mt-1">{latestJob?.error_message || video.error_message || "Erro desconhecido"}</p>
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
                    <button
                      key={seg.id}
                      className="flex items-start gap-2 text-xs w-full text-left hover:bg-accent/50 rounded px-1 py-0.5 transition-colors"
                      onClick={() => playerRef.current?.seekTo(seg.start_time)}
                    >
                      <span className="text-muted-foreground/60 tabular-nums w-10 shrink-0">
                        {Math.floor(seg.start_time / 60)}:{Math.floor(seg.start_time % 60).toString().padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground">{seg.text}</span>
                    </button>
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
              {(video.duration_seconds || videoDuration > 0) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{formatDuration(video.duration_seconds || videoDuration)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Origem</span>
                <span className="font-medium capitalize">{video.source_type || "upload"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
              </div>
              {video.current_step && video.status === "processing" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Etapa</span>
                  <span className="font-medium text-xs">{video.current_step}</span>
                </div>
              )}
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
              {video.source_type === "youtube" && video.external_video_id && (
                <a
                  href={`https://youtube.com/watch?v=${video.external_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  <ExternalLink size={10} /> Ver no YouTube
                </a>
              )}
            </div>
          </div>

          {/* Clips */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Scissors size={12} /> Clips ({clips?.length || 0})
              </h3>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowClipCreator(true)}>
                <Plus size={10} className="mr-1" /> Novo
              </Button>
            </div>
            {clipsLoading ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !clips?.length ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-2">Nenhum clip gerado</p>
                {statusInfo.canProcess && (
                  <Button variant="outline" size="sm" className="text-[10px]" onClick={handleProcess}>
                    <Play size={10} className="mr-1" /> Processar para gerar clips
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {clips.slice(0, 8).map((clip) => (
                  <button
                    key={clip.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left"
                    onClick={() => {
                      playerRef.current?.seekTo(Number(clip.start_time));
                      playerRef.current?.play();
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{clip.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Clock size={8} />{formatDuration(clip.duration_seconds)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <BarChart3 size={8} />{clip.virality_score || 0}
                        </span>
                        <Badge variant="outline" className="text-[8px] h-3.5">{clip.status}</Badge>
                      </div>
                    </div>
                    <Play size={12} className="text-muted-foreground shrink-0" />
                  </button>
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
                      <Badge variant="outline" className={`text-[9px] ${
                        job.status === "completed" ? "bg-foreground text-background" :
                        job.status === "failed" ? "bg-destructive/20 text-destructive-foreground" :
                        "bg-accent text-muted-foreground"
                      }`}>
                        {job.status === "completed" ? "Concluído" : job.status === "failed" ? "Erro" : job.status}
                      </Badge>
                    </div>
                    <div className="h-0.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full bg-foreground" style={{ width: `${job.progress || 0}%` }} />
                    </div>
                    {job.error_message && (
                      <p className="text-[10px] text-destructive">{job.error_message}</p>
                    )}
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
