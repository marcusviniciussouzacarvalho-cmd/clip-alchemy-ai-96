import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Scissors, Copy, RotateCcw, RotateCw, Video, ChevronLeft, Save, Check,
  Square, RectangleHorizontal, RectangleVertical, Download, Loader2,
  Bot, User, Send, Sparkles,
} from "lucide-react";
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

// Editor components
import TimelineTracks from "@/components/editor/TimelineTracks";
import EditorToolbar from "@/components/editor/EditorToolbar";
import VideoPreviewOverlay from "@/components/editor/VideoPreviewOverlay";
import type { EditorState } from "@/components/editor/types";
import { createDefaultEditorState } from "@/components/editor/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_SUGGESTIONS = [
  { label: "Versão curta", msg: "Crie uma versão curta de 30 segundos" },
  { label: "Formato 9:16", msg: "Mude para formato vertical 9:16" },
  { label: "Legenda branca", msg: "Deixe a legenda branca com fundo preto" },
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
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

  // Editor state with undo/redo
  const [editorState, setEditorState] = useState<EditorState>(createDefaultEditorState("", 30));
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Clip creation & export
  const { exportSelection, exporting: exportingId } = useExportClip();
  const [creatingClip, setCreatingClip] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Measure preview container
  useEffect(() => {
    if (!previewContainerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPreviewSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    obs.observe(previewContainerRef.current);
    return () => obs.disconnect();
  }, []);

  // Initialize editor state from video
  useEffect(() => {
    if (!video) return;

    const initial = createDefaultEditorState(video.title || "", totalDuration || 30);
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

      if (error) { setSessionLoaded(true); return; }
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
    if (totalDuration > 0 && editorState.endTime === 30 && totalDuration !== 30) {
      pushState({ ...editorState, endTime: Math.min(30, totalDuration) });
    }
  }, [totalDuration]);

  // Autosave every 30s when dirty
  useEffect(() => {
    if (!isDirty) return;
    const timer = setTimeout(() => handleSave(true), 30000);
    return () => clearTimeout(timer);
  }, [isDirty, editorState]);

  const pushState = useCallback((newState: EditorState, commitHistory = true) => {
    setEditorState(newState);
    if (commitHistory) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex(prev => prev + 1);
    }
    setIsDirty(true);
  }, [historyIndex]);

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

  // Save editor state
  const handleSave = async (auto = false) => {
    if (!videoId || !isDirty) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Não autenticado");

      const { error } = await (supabase as any)
        .from("editor_sessions")
        .upsert({
          user_id: auth.user.id,
          video_id: videoId,
          state: editorState as any,
        }, { onConflict: "video_id,user_id" });

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

      const clipTitle = editorState.title
        ? `${editorState.title} (${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)})`
        : `Clip ${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)}`;

      const { error } = await supabase.from("clips").insert({
        video_id: videoId,
        user_id: user.id,
        title: clipTitle,
        start_time: editorState.startTime,
        end_time: editorState.endTime,
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
          context: { format: editorState.format, currentTime, totalDuration, videoTitle: video?.title },
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
      toast.error(e.message || "Erro ao processar");
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }, [messages, chatLoading, editorState, currentTime, totalDuration, video?.title]);

  // Loading states
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
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to={`/dashboard/videos/${videoId}`} className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft size={12} /> Voltar ao vídeo
            </Link>
          </div>
          <h1 className="text-xl font-extrabold">Editor de Clip</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate max-w-xs">{video?.title}</p>
            {clips && clips.length > 0 && (
              <Badge variant="outline" className="text-[9px]">{clips.length} clips</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-[10px] text-muted-foreground mr-2">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Salvando...</span>
            ) : isDirty ? (
              <span className="text-destructive">● Não salvo</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-primary"><Check size={10} /> Salvo</span>
            ) : null}
          </div>

          <Button variant="ghost" size="sm" className="h-7 px-2" disabled={historyIndex <= 0} onClick={undo}>
            <RotateCcw size={13} />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" disabled={historyIndex >= history.length - 1} onClick={redo}>
            <RotateCw size={13} />
          </Button>
          <Button size="sm" variant="outline" className="h-7" onClick={() => handleSave(false)} disabled={!isDirty || saving}>
            <Save size={13} className="mr-1" /> Salvar
          </Button>
          <Button size="sm" className="h-7" onClick={() => setChatOpen(!chatOpen)} variant={chatOpen ? "default" : "outline"}>
            <Bot size={13} className="mr-1" /> IA
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Main editor */}
        <div className={`flex-1 ${chatOpen ? "lg:flex-[3]" : ""} space-y-3`}>
          {/* Video preview with overlays */}
          {video && (
            <div ref={previewContainerRef} className="venus-card overflow-hidden relative">
              <VideoPlayer
                ref={playerRef}
                video={video}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setTotalDuration}
                startTime={editorState.startTime}
                endTime={editorState.endTime}
              />
              <VideoPreviewOverlay
                editorState={editorState}
                currentTime={currentTime}
                containerWidth={previewSize.w}
                containerHeight={previewSize.h}
              />
            </div>
          )}

          {/* Multi-track timeline */}
          <TimelineTracks
            editorState={editorState}
            totalDuration={totalDuration}
            currentTime={currentTime}
            onSeek={(t) => playerRef.current?.seekTo(t)}
            onUpdateState={pushState}
            clips={clips}
          />

          {/* Editor toolbar: captions, text, tools */}
          <EditorToolbar
            editorState={editorState}
            onUpdateState={pushState}
            currentTime={currentTime}
            totalDuration={totalDuration}
            transcriptSegments={transcript?.transcript_segments}
          />

          {/* Tools & format row */}
          <div className="flex gap-2">
            {/* Quick tools */}
            <div className="venus-card p-3 flex gap-1">
              <button
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                onClick={handleCreateClip}
                disabled={creatingClip}
              >
                <Scissors size={14} />
                <span className="text-[9px]">{creatingClip ? "..." : "Clip"}</span>
              </button>
              <button
                className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                onClick={handleDuplicate}
              >
                <Copy size={14} />
                <span className="text-[9px]">Duplicar</span>
              </button>
            </div>

            {/* Format selector */}
            <div className="venus-card p-3 flex gap-1">
              {[
                { label: "9:16", ratio: "9:16", icon: RectangleVertical },
                { label: "1:1", ratio: "1:1", icon: Square },
                { label: "16:9", ratio: "16:9", icon: RectangleHorizontal },
              ].map(f => (
                <button
                  key={f.ratio}
                  onClick={() => pushState({ ...editorState, format: f.ratio })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    editorState.format === f.ratio
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <f.icon size={12} />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex-1" />
            <Button size="sm" className="h-auto" onClick={handleCreateClip} disabled={creatingClip}>
              {creatingClip ? <Loader2 size={13} className="animate-spin mr-1" /> : <Scissors size={13} className="mr-1" />}
              Criar clip
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto"
              onClick={() => videoId && exportSelection(videoId, editorState.startTime, editorState.endTime, editorState.format)}
              disabled={!!exportingId}
            >
              {exportingId ? <Loader2 size={13} className="animate-spin mr-1" /> : <Download size={13} className="mr-1" />}
              Exportar
            </Button>
          </div>

          {/* Clips list */}
          {clips && clips.length > 0 && (
            <div className="venus-card p-3">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Clips ({clips.length})
              </h3>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {clips.map(clip => (
                  <button
                    key={clip.id}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-accent/50 transition-colors w-full text-left text-xs"
                    onClick={() => {
                      pushState({ ...editorState, startTime: Number(clip.start_time), endTime: Number(clip.end_time) });
                      playerRef.current?.seekTo(Number(clip.start_time));
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-[11px]">{clip.title}</p>
                      <span className="text-[9px] text-muted-foreground">
                        {formatDuration(clip.duration_seconds)} · Score: {clip.virality_score || 0}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[8px] ml-2">{clip.status}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript?.transcript_segments && transcript.transcript_segments.length > 0 && (
            <div className="venus-card p-3">
              <h3 className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Transcrição</h3>
              <div className="max-h-28 overflow-y-auto space-y-0.5">
                {transcript.transcript_segments.map((seg: any) => (
                  <button
                    key={seg.id}
                    className={`flex items-start gap-2 text-[11px] w-full text-left px-1.5 py-0.5 rounded transition-colors ${
                      currentTime >= seg.start_time && currentTime < seg.end_time
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-accent/50 text-muted-foreground"
                    }`}
                    onClick={() => playerRef.current?.seekTo(seg.start_time)}
                  >
                    <span className="text-muted-foreground/50 tabular-nums w-8 shrink-0 text-[9px] font-mono">
                      {formatTime(seg.start_time)}
                    </span>
                    <span>{seg.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Chat Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-72 shrink-0 venus-card flex flex-col h-[calc(100vh-160px)] sticky top-20"
            >
              <div className="p-2.5 border-b border-border flex items-center gap-2">
                <Bot size={14} className="text-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Assistente IA</span>
                <Sparkles size={10} className="text-muted-foreground ml-auto" />
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <Bot size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground mb-3">Peça qualquer edição em linguagem natural</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {QUICK_SUGGESTIONS.map(s => (
                        <button key={s.label} onClick={() => sendMessage(s.msg)} className="text-[9px] px-2 py-0.5 rounded-full bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-1.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Bot size={10} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[11px] ${msg.role === "user" ? "bg-foreground text-background" : "bg-accent"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:my-0.5 [&>ul]:my-0.5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                        <User size={10} className="text-background" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <Bot size={10} className="text-muted-foreground" />
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-accent">
                      <Loader2 size={12} className="animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-2.5 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }} className="flex gap-1">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ex: corte os 3 primeiros segundos..."
                    className="h-7 text-[11px]"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="sm" className="h-7 w-7 p-0 shrink-0" disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
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
