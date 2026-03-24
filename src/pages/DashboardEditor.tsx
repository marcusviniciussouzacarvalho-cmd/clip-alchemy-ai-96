import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Scissors, Copy, RotateCcw, RotateCw, Video, ChevronLeft, Save, Check,
  Square, RectangleHorizontal, RectangleVertical, Download, Loader2,
  Bot, User, Send, Sparkles, Play, Pause, SkipBack, SkipForward,
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

import TimelineTracks from "@/components/editor/TimelineTracks";
import EditorLeftSidebar from "@/components/editor/EditorLeftSidebar";
import EditorRightSidebar from "@/components/editor/EditorRightSidebar";
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
  const [isPlaying, setIsPlaying] = useState(false);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>(createDefaultEditorState("", 30));
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Tool state
  const [activeTool, setActiveTool] = useState("select");

  // AI Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { exportSelection, exporting: exportingId } = useExportClip();
  const [creatingClip, setCreatingClip] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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

  useEffect(() => {
    if (totalDuration > 0 && editorState.endTime === 30 && totalDuration !== 30) {
      pushState({ ...editorState, endTime: Math.min(30, totalDuration) });
    }
  }, [totalDuration]);

  // Autosave
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

  const undo = () => { if (historyIndex <= 0) return; const i = historyIndex - 1; setHistoryIndex(i); setEditorState(history[i]); setIsDirty(true); };
  const redo = () => { if (historyIndex >= history.length - 1) return; const i = historyIndex + 1; setHistoryIndex(i); setEditorState(history[i]); setIsDirty(true); };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}:${ms.toString().padStart(2, "0")}`;
  };

  const handleSave = async (auto = false) => {
    if (!videoId || !isDirty) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Não autenticado");
      const { error } = await (supabase as any)
        .from("editor_sessions")
        .upsert({ user_id: auth.user.id, video_id: videoId, state: editorState as any }, { onConflict: "video_id,user_id" });
      if (error) throw error;
      setIsDirty(false);
      setLastSaved(new Date());
      if (!auto) toast.success("Salvo!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally { setSaving(false); }
  };

  const handleCreateClip = async () => {
    if (!videoId || !video) return;
    if (editorState.endTime <= editorState.startTime) { toast.error("Selecione um trecho válido"); return; }
    setCreatingClip(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const clipTitle = editorState.title
        ? `${editorState.title} (${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)})`
        : `Clip ${formatTime(editorState.startTime)}-${formatTime(editorState.endTime)}`;
      const { error } = await supabase.from("clips").insert({
        video_id: videoId, user_id: user.id, title: clipTitle,
        start_time: editorState.startTime, end_time: editorState.endTime,
        format: editorState.format, status: "manual", virality_score: 0,
      });
      if (error) throw error;
      toast.success("Clip criado!");
      refetchClips();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreatingClip(false); }
  };

  // Playback controls
  const togglePlay = () => {
    if (isPlaying) { playerRef.current?.pause(); } else { playerRef.current?.play(); }
    setIsPlaying(!isPlaying);
  };
  const skipBack = () => { const t = Math.max(0, currentTime - 5); playerRef.current?.seekTo(t); };
  const skipForward = () => { const t = Math.min(totalDuration, currentTime + 5); playerRef.current?.seekTo(t); };
  const goToStart = () => { playerRef.current?.seekTo(editorState.startTime); };

  // Tool actions
  const handleToolAction = (action: string) => {
    if (action === "captions") setActiveTool("captions");
    else if (action === "text") setActiveTool("text");
    else if (action === "cut") setActiveTool("cut");
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })), context: { format: editorState.format, currentTime, totalDuration, videoTitle: video?.title } }),
      });
      if (!resp.ok || !resp.body) { const err = await resp.json().catch(() => ({ error: "Erro" })); throw new Error(err.error || "Erro"); }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl); textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try { const p = JSON.parse(jsonStr); const c = p.choices?.[0]?.delta?.content; if (c) upsertAssistant(c); } catch {}
        }
      }
    } catch (e: any) {
      toast.error(e.message);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e.message}` }]);
    } finally { setChatLoading(false); }
  }, [messages, chatLoading, editorState, currentTime, totalDuration, video?.title]);

  // Loading states
  if (!sessionLoaded && video) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto mb-3 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando editor...</p>
        </div>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="venus-card p-12 text-center">
          <Video size={36} className="mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-bold text-lg mb-1">Nenhum vídeo selecionado</h3>
          <p className="text-sm text-muted-foreground mb-4">Abra um vídeo na biblioteca para editá-lo</p>
          <Button variant="outline" size="sm" asChild><Link to="/dashboard/library">Ir para a biblioteca</Link></Button>
        </div>
      </div>
    );
  }

  if (videoLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      {/* TOP BAR */}
      <div className="h-10 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Link to={`/dashboard/videos/${videoId}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs">
          <ChevronLeft size={14} /> Voltar
        </Link>
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-xs font-semibold truncate max-w-xs">{video?.title}</span>
        {clips && clips.length > 0 && (
          <Badge variant="outline" className="text-[9px] ml-1">{clips.length} clips</Badge>
        )}

        <div className="flex-1" />

        {/* Save status */}
        <div className="text-[10px] text-muted-foreground mr-1">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Salvando…</span>
          ) : isDirty ? (
            <span className="text-destructive">● Não salvo</span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-primary"><Check size={10} /> Salvo</span>
          ) : null}
        </div>

        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={historyIndex <= 0} onClick={undo}><RotateCcw size={13} /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={historyIndex >= history.length - 1} onClick={redo}><RotateCw size={13} /></Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSave(false)} disabled={!isDirty || saving}>
          <Save size={12} className="mr-1" /> Salvar
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={handleCreateClip} disabled={creatingClip}>
          {creatingClip ? <Loader2 size={12} className="animate-spin mr-1" /> : <Scissors size={12} className="mr-1" />}
          Clip
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs"
          onClick={() => videoId && exportSelection(videoId, editorState.startTime, editorState.endTime, editorState.format)}
          disabled={!!exportingId}
        >
          {exportingId ? <Loader2 size={12} className="animate-spin mr-1" /> : <Download size={12} className="mr-1" />}
          Exportar
        </Button>
        <Button size="sm" className="h-7 text-xs" onClick={() => setChatOpen(!chatOpen)} variant={chatOpen ? "default" : "outline"}>
          <Bot size={12} className="mr-1" /> IA
        </Button>
      </div>

      {/* MAIN AREA: Left sidebar + Center + Right sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT SIDEBAR - Tools */}
        <EditorLeftSidebar activeTool={activeTool} onSelectTool={setActiveTool} onAction={handleToolAction} />

        {/* CENTER: Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview area */}
          <div className="flex-1 bg-[hsl(0_0%_4%)] flex items-center justify-center p-4 min-h-0 relative">
            <div ref={previewContainerRef} className="relative max-w-full max-h-full" style={{
              aspectRatio: editorState.format === "9:16" ? "9/16" : editorState.format === "1:1" ? "1/1" : "16/9",
              maxHeight: "100%",
              width: "auto",
            }}>
              {video && (
                <>
                  <VideoPlayer
                    ref={playerRef}
                    video={video}
                    onTimeUpdate={setCurrentTime}
                    onDurationChange={setTotalDuration}
                    startTime={editorState.startTime}
                    endTime={editorState.endTime}
                    className="w-full h-full rounded-lg overflow-hidden"
                  />
                  <VideoPreviewOverlay
                    editorState={editorState}
                    currentTime={currentTime}
                    containerWidth={previewSize.w}
                    containerHeight={previewSize.h}
                  />
                </>
              )}
            </div>
          </div>

          {/* Playback controls bar */}
          <div className="h-10 bg-card border-t border-border flex items-center justify-center gap-2 px-4 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground w-20 text-right">{formatTime(currentTime)}</span>

            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={goToStart}>
              <SkipBack size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={skipBack}>
              <RotateCcw size={12} />
            </Button>
            <Button variant="default" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={togglePlay}>
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={skipForward}>
              <RotateCw size={12} />
            </Button>

            <span className="text-[10px] font-mono text-muted-foreground w-20">{formatTime(totalDuration)}</span>

            <div className="w-px h-5 bg-border mx-2" />

            {/* Format selector */}
            {[
              { label: "9:16", ratio: "9:16", icon: RectangleVertical },
              { label: "1:1", ratio: "1:1", icon: Square },
              { label: "16:9", ratio: "16:9", icon: RectangleHorizontal },
            ].map(f => (
              <button
                key={f.ratio}
                onClick={() => pushState({ ...editorState, format: f.ratio })}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  editorState.format === f.ratio ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <f.icon size={10} />
                {f.label}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="h-36 shrink-0 border-t border-border">
            <TimelineTracks
              editorState={editorState}
              totalDuration={totalDuration}
              currentTime={currentTime}
              onSeek={(t) => playerRef.current?.seekTo(t)}
              onUpdateState={pushState}
              clips={clips}
            />
          </div>
        </div>

        {/* RIGHT SIDEBAR - Properties / Panels */}
        <EditorRightSidebar
          editorState={editorState}
          onUpdateState={pushState}
          activePanel={activeTool}
          currentTime={currentTime}
          totalDuration={totalDuration}
          transcriptSegments={transcript?.transcript_segments}
        />

        {/* AI Chat Panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 272 }}
              exit={{ opacity: 0, width: 0 }}
              className="shrink-0 bg-card border-l border-border flex flex-col overflow-hidden"
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
                    <p className="text-[10px] text-muted-foreground mb-3">Peça qualquer edição</p>
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
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0"><Bot size={10} className="text-muted-foreground" /></div>
                    )}
                    <div className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-[11px] ${msg.role === "user" ? "bg-foreground text-background" : "bg-accent"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&>p]:my-0.5"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      ) : msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0"><User size={10} className="text-background" /></div>
                    )}
                  </div>
                ))}
                {chatLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0"><Bot size={10} className="text-muted-foreground" /></div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-accent"><Loader2 size={12} className="animate-spin text-muted-foreground" /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-2.5 border-t border-border">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }} className="flex gap-1">
                  <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ex: corte os 3 primeiros segundos..." className="h-7 text-[11px]" disabled={chatLoading} />
                  <Button type="submit" size="sm" className="h-7 w-7 p-0 shrink-0" disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardEditor;
