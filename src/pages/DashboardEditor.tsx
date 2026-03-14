import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Play, ZoomIn, Smile, Image, Copy, Layout, Type, Crop, Pause, SkipBack, SkipForward, Volume2, Send, Loader2, Sparkles, Bot, User, Scissors, RotateCcw, RotateCw, Video, ChevronLeft, Save, Check, Square, RectangleHorizontal, RectangleVertical, Download } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useSearchParams, Link } from "react-router-dom";
import { useVideo, useClips, useTranscript } from "@/hooks/use-pipeline";
import VideoPlayer, { VideoPlayerRef } from "@/components/video/VideoPlayer";
import { formatDuration } from "@/lib/video-utils";
import { supabase } from "@/integrations/supabase/client";
import { useExportClip } from "@/hooks/use-export";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface EditorState {
  startTime: number;
  endTime: number;
  format: string;
  captionColor: string;
  captionStyle: string;
  title: string;
}

const QUICK_SUGGESTIONS = [
  { label: "Versão curta", msg: "Crie uma versão curta de 30 segundos" },
  { label: "Formato 9:16", msg: "Mude para formato vertical 9:16" },
  { label: "Remover silêncios", msg: "Remova os silêncios longos" },
  { label: "Legenda branca", msg: "Deixe a legenda branca com fundo preto" },
  { label: "Zoom no rosto", msg: "Aplique zoom no rosto do apresentador" },
  { label: "Hook forte", msg: "Melhore o gancho dos primeiros 3 segundos" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/editor-chat`;

const DashboardEditor = () => {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("video") || undefined;
  const { data: video, isLoading: videoLoading } = useVideo(videoId);
  const { data: clips, refetch: refetchClips } = useClips(videoId);
  const { data: transcript } = useTranscript(videoId);

  const playerRef = useRef<VideoPlayerRef>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Editor state with undo/redo
  const [editorState, setEditorState] = useState<EditorState>({
    startTime: 0,
    endTime: 30,
    format: "9:16",
    captionColor: "#FFFFFF",
    captionStyle: "Bold Centered",
    title: "",
  });
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Clip creation & export
  const { exportSelection, exporting: exportingId } = useExportClip();
  const [creatingClip, setCreatingClip] = useState(false);

  // Timeline drag
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | "playhead" | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize editor state from video
  useEffect(() => {
    if (!video) return;

    const initial: EditorState = {
      startTime: 0,
      endTime: Math.min(30, totalDuration || 30),
      format: "9:16",
      captionColor: "#FFFFFF",
      captionStyle: "Bold Centered",
      title: video.title || "",
    };

    setEditorState(initial);
    setHistory([initial]);
    setHistoryIndex(0);
    setSessionLoaded(false);

    const loadSession = async () => {
      if (!videoId) return;
      const { data, error } = await (supabase as any)
        .from("editor_sessions")
        .select("state, updated_at")
        .eq("video_id", videoId)
        .maybeSingle();

      if (error) return;
      if (data?.state) {
        const saved = data.state as Partial<EditorState>;
        const restored: EditorState = { ...initial, ...saved };
        setEditorState(restored);
        setHistory([restored]);
        setHistoryIndex(0);
        if (data.updated_at) setLastSaved(new Date(data.updated_at));
      }
      setSessionLoaded(true);
    };

    loadSession();
  }, [video?.id, videoId]);

  // Update endTime when duration loads
  useEffect(() => {
    if (totalDuration > 0 && editorState.endTime === 30) {
      pushState({ ...editorState, endTime: Math.min(30, totalDuration) });
    }
  }, [totalDuration]);

  // Autosave every 30s when dirty
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [isDirty, editorState]);

  const pushState = (newState: EditorState, commitHistory = true) => {
    setEditorState(newState);
    if (commitHistory) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex(prev => prev + 1);
    }
    setIsDirty(true);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setEditorState(history[newIdx]);
    setIsDirty(true);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setEditorState(history[newIdx]);
    setIsDirty(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const parseTime = (str: string): number => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
    return 0;
  };

  // Handle timeline drag
  const handleTimelineMouseDown = (e: React.MouseEvent, type: "start" | "end" | "playhead") => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: MouseEvent) => {
      if (!timelineRef.current || !totalDuration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * totalDuration;

      if (dragging === "playhead") {
        playerRef.current?.seekTo(time);
      } else if (dragging === "start") {
        const newStart = Math.max(0, Math.min(editorState.endTime - 1, time));
        pushState({ ...editorState, startTime: Math.round(newStart * 10) / 10 }, false);
      } else if (dragging === "end") {
        const newEnd = Math.max(editorState.startTime + 1, Math.min(totalDuration, time));
        pushState({ ...editorState, endTime: Math.round(newEnd * 10) / 10 }, false);
      }
    };

    const handleUp = () => {
      setDragging(null);
      setHistory(prev => {
        const next = [...prev.slice(0, historyIndex + 1), editorState];
        return next;
      });
      setHistoryIndex(prev => prev + 1);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, totalDuration, editorState]);

  // Timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (dragging) return;
    if (!timelineRef.current || !totalDuration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    playerRef.current?.seekTo(pct * totalDuration);
  };

  // Save editor state
  const handleSave = async (auto = false) => {
    if (!videoId || !isDirty) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Não autenticado");

      const payload = {
        user_id: user.id,
        video_id: videoId,
        state: editorState as any,
      };

      const { error } = await (supabase as any)
        .from("editor_sessions")
        .upsert(payload, { onConflict: "video_id,user_id" });

      if (error) throw error;
      setIsDirty(false);
      setLastSaved(new Date());
      if (!auto) toast.success("Alterações salvas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  // Create clip from current selection
  const handleCreateClip = async () => {
    if (!videoId || !video) return;
    if (editorState.endTime <= editorState.startTime) {
      toast.error("Selecione um trecho válido na timeline");
      return;
    }

    setCreatingClip(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const duration = editorState.endTime - editorState.startTime;
      const clipTitle = editorState.title
        ? `${editorState.title} (${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)})`
        : `Clip ${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)}`;

      const { error } = await supabase.from("clips").insert({
        video_id: videoId,
        user_id: user.id,
        title: clipTitle,
        start_time: editorState.startTime,
        end_time: editorState.endTime,
        duration_seconds: duration,
        format: editorState.format,
        status: "manual",
        virality_score: 0,
      });

      if (error) throw error;
      toast.success("Clip criado com sucesso!");
      refetchClips();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar clip");
    } finally {
      setCreatingClip(false);
    }
  };

  // Tool actions
  const handleFormatChange = (ratio: string) => {
    pushState({ ...editorState, format: ratio });
    toast.success(`Formato alterado para ${ratio}`);
  };

  const handleCaptionStyleChange = (style: string) => {
    pushState({ ...editorState, captionStyle: style });
  };

  const handleCaptionColorChange = (color: string) => {
    pushState({ ...editorState, captionColor: color });
  };

  const handleDuplicate = async () => {
    if (!videoId || !video) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("clips").insert({
        video_id: videoId,
        user_id: user.id,
        title: `${editorState.title || video.title} (cópia)`,
        start_time: editorState.startTime,
        end_time: editorState.endTime,
        duration_seconds: editorState.endTime - editorState.startTime,
        format: editorState.format,
        status: "manual",
        virality_score: 0,
      });

      if (error) throw error;
      toast.success("Clip duplicado!");
      refetchClips();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // AI Chat
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          context: { format: editorState.format, currentTime, totalDuration, captionColor: editorState.captionColor, captionStyle: editorState.captionStyle, videoTitle: video?.title },
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erro na conexão" }));
        throw new Error(err.error || "Erro ao conectar com a IA");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch { /* partial JSON */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar comando de IA");
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e.message || "Erro ao processar"}` }]);
    } finally {
      setChatLoading(false);
    }
  }, [messages, chatLoading, editorState, currentTime, totalDuration, video?.title]);

  if (!sessionLoaded && video) {
    return (
      <DashboardLayout>
        <div className="venus-card p-12 text-center">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando sessão de edição...</p>
        </div>
      </DashboardLayout>
    );
  }

  // No video selected
  if (!videoId) {
    return (
      <DashboardLayout>
        <div className="venus-card p-12 text-center">
          <Video size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-bold text-lg mb-1">Nenhum vídeo selecionado</h3>
          <p className="text-sm text-muted-foreground mb-4">Abra um vídeo na biblioteca para editá-lo</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/library">Ir para a biblioteca</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (videoLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="aspect-video w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to={`/dashboard/videos/${videoId}`} className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft size={12} /> Voltar ao vídeo
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold mb-1">Editor de Clip</h1>
          <p className="text-sm text-muted-foreground truncate max-w-md">{video?.title || "Editando"}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Save indicator */}
          <div className="text-[10px] text-muted-foreground mr-2">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Salvando...</span>
            ) : isDirty ? (
              <span className="text-destructive">● Não salvo</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-primary"><Check size={10} /> Salvo</span>
            ) : null}
          </div>

          <Button variant="ghost" size="sm" className="h-7" disabled={historyIndex <= 0} onClick={undo}>
            <RotateCcw size={14} className="mr-1" /> Desfazer
          </Button>
          <Button variant="ghost" size="sm" className="h-7" disabled={historyIndex >= history.length - 1} onClick={redo}>
            <RotateCw size={14} className="mr-1" /> Refazer
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleSave(false)} disabled={!isDirty || saving}>
            <Save size={14} className="mr-1" /> Salvar
          </Button>
          <Button size="sm" onClick={() => setChatOpen(!chatOpen)} variant={chatOpen ? "default" : "outline"}>
            <Bot size={14} className="mr-1" /> IA
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main editor area */}
        <div className={`flex-1 ${chatOpen ? "lg:flex-[3]" : ""} space-y-3`}>
          {/* Real Video Player */}
          {video && (
            <div className="venus-card overflow-hidden">
              <VideoPlayer
                ref={playerRef}
                video={video}
                onTimeUpdate={setCurrentTime}
                onDurationChange={(d) => setTotalDuration(d)}
                startTime={editorState.startTime}
                endTime={editorState.endTime}
              />
            </div>
          )}

          {/* Timeline with draggable handles */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">00:00</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Timeline</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(totalDuration)}</span>
            </div>

            <div
              ref={timelineRef}
              className="h-14 bg-accent rounded-lg relative overflow-hidden mb-3 cursor-pointer select-none"
              onClick={handleTimelineClick}
            >
              {/* Waveform bars */}
              <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="flex-1 mx-px bg-muted-foreground/20 rounded-sm" style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }} />
                ))}
              </div>

              {/* Selection range */}
              {totalDuration > 0 && (
                <div
                  className="absolute inset-y-0 bg-primary/15 border-x-2 border-primary rounded"
                  style={{
                    left: `${(editorState.startTime / totalDuration) * 100}%`,
                    width: `${((editorState.endTime - editorState.startTime) / totalDuration) * 100}%`,
                  }}
                >
                  {/* Start handle - draggable */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-3 bg-primary cursor-col-resize rounded-l flex items-center justify-center hover:bg-primary/80 z-20"
                    onMouseDown={(e) => handleTimelineMouseDown(e, "start")}
                  >
                    <div className="w-0.5 h-4 bg-primary-foreground rounded" />
                  </div>
                  {/* End handle - draggable */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-3 bg-primary cursor-col-resize rounded-r flex items-center justify-center hover:bg-primary/80 z-20"
                    onMouseDown={(e) => handleTimelineMouseDown(e, "end")}
                  >
                    <div className="w-0.5 h-4 bg-primary-foreground rounded" />
                  </div>
                </div>
              )}

              {/* Playhead - draggable */}
              {totalDuration > 0 && (
                <div
                  className="absolute top-0 bottom-0 z-30 cursor-grab active:cursor-grabbing"
                  style={{ left: `${(currentTime / totalDuration) * 100}%`, transform: "translateX(-50%)" }}
                  onMouseDown={(e) => handleTimelineMouseDown(e, "playhead")}
                >
                  <div className="w-0.5 h-full bg-foreground" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background" />
                </div>
              )}

              {/* Clip markers */}
              {clips?.map((clip) => (
                <div
                  key={clip.id}
                  className="absolute top-0 h-1.5 bg-primary/60 rounded-full cursor-pointer hover:bg-primary"
                  style={{
                    left: `${totalDuration > 0 ? (Number(clip.start_time) / totalDuration) * 100 : 0}%`,
                    width: `${totalDuration > 0 ? ((Number(clip.end_time) - Number(clip.start_time)) / totalDuration) * 100 : 0}%`,
                  }}
                  title={clip.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    pushState({ ...editorState, startTime: Number(clip.start_time), endTime: Number(clip.end_time) });
                    playerRef.current?.seekTo(Number(clip.start_time));
                  }}
                />
              ))}
            </div>

            {/* Time inputs */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</label>
                <div className="flex gap-1 mt-1">
                  <Input
                    value={formatTime(editorState.startTime)}
                    onChange={e => {
                      const t = parseTime(e.target.value);
                      if (!isNaN(t)) pushState({ ...editorState, startTime: t });
                    }}
                    className="h-7 text-xs"
                  />
                  <Button variant="outline" size="sm" className="h-7 text-[9px] px-1.5" onClick={() => {
                    pushState({ ...editorState, startTime: Math.round(currentTime * 10) / 10 });
                  }}>
                    Marcar
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums pt-4">
                {formatTime(editorState.endTime - editorState.startTime)}
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fim</label>
                <div className="flex gap-1 mt-1">
                  <Input
                    value={formatTime(editorState.endTime)}
                    onChange={e => {
                      const t = parseTime(e.target.value);
                      if (!isNaN(t)) pushState({ ...editorState, endTime: t });
                    }}
                    className="h-7 text-xs"
                  />
                  <Button variant="outline" size="sm" className="h-7 text-[9px] px-1.5" onClick={() => {
                    pushState({ ...editorState, endTime: Math.round(currentTime * 10) / 10 });
                  }}>
                    Marcar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tools row */}
          <div className="flex gap-3">
            {/* Main tools */}
            <div className="venus-card p-4 flex-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Ferramentas</h3>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  onClick={handleCreateClip}
                  disabled={creatingClip}
                >
                  <Scissors size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">{creatingClip ? "..." : "Clip"}</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  onClick={handleDuplicate}
                >
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Duplicar</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <ZoomIn size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Zoom</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <Smile size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Emojis</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <Image size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Logo</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <Layout size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Template</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <Type size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Título</span>
                </button>
                <button
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground opacity-50 cursor-not-allowed"
                  title="Em breve"
                  disabled
                >
                  <Crop size={14} strokeWidth={1.5} />
                  <span className="text-[9px]">Reframe</span>
                </button>
              </div>
            </div>

            {/* Format */}
            <div className="venus-card p-4 w-44">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Formato</h3>
              <div className="space-y-1">
                {[
                  { label: "9:16 Vertical", ratio: "9:16", icon: RectangleVertical },
                  { label: "1:1 Quadrado", ratio: "1:1", icon: Square },
                  { label: "16:9 Horizontal", ratio: "16:9", icon: RectangleHorizontal },
                ].map((f) => (
                  <button
                    key={f.ratio}
                    onClick={() => handleFormatChange(f.ratio)}
                    className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${
                      editorState.format === f.ratio
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <span>{f.label}</span>
                    <f.icon size={12} />
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="venus-card p-4 w-44">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Legenda</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Estilo</label>
                  <select
                    value={editorState.captionStyle}
                    onChange={(e) => handleCaptionStyleChange(e.target.value)}
                    className="mt-1 w-full h-7 text-xs rounded-md border border-border bg-background px-2"
                  >
                    <option>Bold Centered</option>
                    <option>Karaoke</option>
                    <option>Minimal</option>
                    <option>Pop</option>
                    <option>Neon</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Cor</label>
                  <div className="flex gap-1 mt-1">
                    {["#FFFFFF", "#FFD700", "#00FF88", "#FF4444", "#4488FF"].map(c => (
                      <button
                        key={c}
                        onClick={() => handleCaptionColorChange(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          editorState.captionColor === c ? "border-foreground scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing clips list */}
          {clips && clips.length > 0 && (
            <div className="venus-card p-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Clips ({clips.length})
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {clips.map((clip) => (
                  <button
                    key={clip.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors w-full text-left text-xs"
                    onClick={() => {
                      pushState({ ...editorState, startTime: Number(clip.start_time), endTime: Number(clip.end_time) });
                      playerRef.current?.seekTo(Number(clip.start_time));
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{clip.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(clip.duration_seconds)} · Score: {clip.virality_score || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[8px] ml-2">{clip.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transcript segments - clickable */}
          {transcript?.transcript_segments && transcript.transcript_segments.length > 0 && (
            <div className="venus-card p-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Transcrição</h3>
              <div className="max-h-32 overflow-y-auto space-y-0.5">
                {transcript.transcript_segments.map((seg: any) => (
                  <button
                    key={seg.id}
                    className={`flex items-start gap-2 text-xs w-full text-left px-1.5 py-1 rounded transition-colors ${
                      currentTime >= seg.start_time && currentTime < seg.end_time
                        ? "bg-foreground/10 text-foreground"
                        : "hover:bg-accent/50 text-muted-foreground"
                    }`}
                    onClick={() => playerRef.current?.seekTo(seg.start_time)}
                  >
                    <span className="text-muted-foreground/60 tabular-nums w-8 shrink-0 text-[10px]">
                      {formatTime(seg.start_time)}
                    </span>
                    <span>{seg.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom action bar */}
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" onClick={handleCreateClip} disabled={creatingClip}>
              {creatingClip ? <Loader2 size={14} className="animate-spin mr-1" /> : <Scissors size={14} className="mr-1" />}
              Criar clip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => videoId && exportSelection(videoId, editorState.startTime, editorState.endTime, editorState.format)}
              disabled={!!exportingId}
            >
              {exportingId ? <Loader2 size={14} className="animate-spin mr-1" /> : <Download size={14} className="mr-1" />}
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={!isDirty}>
              <Save size={14} className="mr-1" /> Salvar
            </Button>
          </div>
        </div>

        {/* AI Chat Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 shrink-0 venus-card flex flex-col h-[calc(100vh-180px)] sticky top-24"
            >
              <div className="p-3 border-b border-border flex items-center gap-2">
                <Bot size={16} className="text-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider">Assistente IA</span>
                <Sparkles size={12} className="text-muted-foreground ml-auto" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <Bot size={28} className="mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground mb-4">Peça qualquer edição em linguagem natural</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {QUICK_SUGGESTIONS.map(s => (
                        <button key={s.label} onClick={() => sendMessage(s.msg)} className="text-[10px] px-2 py-1 rounded-full bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Bot size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === "user" ? "bg-foreground text-background" : "bg-accent"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center shrink-0">
                        <User size={12} className="text-background" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Bot size={12} className="text-muted-foreground" />
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-accent">
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {messages.length > 0 && !chatLoading && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {QUICK_SUGGESTIONS.slice(0, 3).map(s => (
                    <button key={s.label} onClick={() => sendMessage(s.msg)} className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }} className="flex gap-1.5">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ex: corte os 3 primeiros segundos..."
                    className="h-8 text-xs"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="sm" className="h-8 w-8 p-0 shrink-0" disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default DashboardEditor;
