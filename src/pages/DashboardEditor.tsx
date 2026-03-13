import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, ZoomIn, Smile, Image, Copy, Layout, Type, Crop, Pause, SkipBack, SkipForward, Volume2, Send, Loader2, Sparkles, Bot, User, Scissors, RotateCcw, RotateCw } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(5);
  const [startTime, setStartTime] = useState("00:05");
  const [endTime, setEndTime] = useState("00:58");
  const totalDuration = 75;
  const [format, setFormat] = useState("9:16");
  const [captionColor, setCaptionColor] = useState("#FFFFFF");
  const [captionStyle, setCaptionStyle] = useState("Bold Centered");

  // AI Chat state
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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
          context: { format, currentTime, totalDuration, captionColor, captionStyle },
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
          } catch { /* partial JSON, wait for more */ }
        }
      }

      // Save to undo history
      setHistory(prev => [...prev.slice(0, historyIndex + 1), assistantSoFar]);
      setHistoryIndex(prev => prev + 1);
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar comando de IA");
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e.message || "Erro ao processar"}` }]);
    } finally {
      setChatLoading(false);
    }
  }, [messages, chatLoading, format, currentTime, totalDuration, captionColor, captionStyle, historyIndex]);

  return (
    <DashboardLayout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Editor de Clip</h1>
          <p className="text-sm text-muted-foreground">Edite e personalize seu clip</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7" disabled={historyIndex < 0} onClick={() => setHistoryIndex(i => Math.max(0, i - 1))}>
            <RotateCcw size={14} className="mr-1" /> Desfazer
          </Button>
          <Button variant="ghost" size="sm" className="h-7" disabled={historyIndex >= history.length - 1} onClick={() => setHistoryIndex(i => Math.min(history.length - 1, i + 1))}>
            <RotateCw size={14} className="mr-1" /> Refazer
          </Button>
          <Button size="sm" onClick={() => setChatOpen(!chatOpen)} variant={chatOpen ? "default" : "outline"}>
            <Bot size={14} className="mr-1" /> IA
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main editor area */}
        <div className={`flex-1 ${chatOpen ? "lg:flex-[3]" : ""} space-y-3`}>
          {/* Player */}
          <div className="venus-card overflow-hidden">
            <div className="aspect-video bg-accent flex items-center justify-center relative">
              <button onClick={() => setPlaying(!playing)} className="w-14 h-14 rounded-full bg-foreground/90 flex items-center justify-center hover:bg-foreground transition-colors hover:scale-105 active:scale-95">
                {playing ? <Pause size={20} className="text-background" /> : <Play size={20} className="text-background ml-0.5" />}
              </button>
              <span className="absolute top-3 right-3 text-[10px] bg-background/80 backdrop-blur px-2 py-0.5 rounded font-medium">{format}</span>
            </div>
            <div className="px-4 py-3 bg-card border-t border-border">
              <div className="flex items-center gap-3">
                <button className="text-muted-foreground hover:text-foreground"><SkipBack size={14} /></button>
                <button onClick={() => setPlaying(!playing)} className="text-foreground">{playing ? <Pause size={16} /> : <Play size={16} />}</button>
                <button className="text-muted-foreground hover:text-foreground"><SkipForward size={14} /></button>
                <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
                <div className="flex-1 h-1 rounded-full bg-accent overflow-hidden cursor-pointer group">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${(currentTime / totalDuration) * 100}%` }} />
                </div>
                <button className="text-muted-foreground hover:text-foreground"><Volume2 size={14} /></button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="venus-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">00:00</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Timeline</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(totalDuration)}</span>
            </div>
            <div className="h-12 bg-accent rounded-lg relative overflow-hidden mb-3">
              <div className="absolute inset-0 flex items-center px-1">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} className="flex-1 mx-px bg-muted-foreground/20 rounded-sm" style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }} />
                ))}
              </div>
              <div className="absolute inset-y-0 left-[10%] right-[20%] bg-foreground/10 border-x-2 border-foreground rounded">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-foreground rounded-l cursor-col-resize" />
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-foreground rounded-r cursor-col-resize" />
              </div>
              <motion.div className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Início</label>
                <Input value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 h-7 text-xs" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Fim</label>
                <Input value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1 h-7 text-xs" />
              </div>
            </div>
          </div>

          {/* Tools row */}
          <div className="flex gap-3">
            <div className="venus-card p-4 flex-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Ferramentas</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { icon: ZoomIn, label: "Zoom" },
                  { icon: Smile, label: "Emojis" },
                  { icon: Image, label: "Logo" },
                  { icon: Type, label: "Título" },
                  { icon: Copy, label: "Duplicar" },
                  { icon: Layout, label: "Template" },
                  { icon: Crop, label: "Reframe" },
                  { icon: Scissors, label: "Clip" },
                ].map((t) => (
                  <button key={t.label} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                    <t.icon size={14} strokeWidth={1.5} />
                    <span className="text-[9px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="venus-card p-4 w-44">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Formato</h3>
              <div className="space-y-1">
                {[{ label: "9:16 Vertical", ratio: "9:16" }, { label: "1:1 Quadrado", ratio: "1:1" }, { label: "16:9 Horizontal", ratio: "16:9" }].map((f) => (
                  <button key={f.ratio} onClick={() => setFormat(f.ratio)} className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg transition-colors ${format === f.ratio ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:bg-accent"}`}>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="venus-card p-4 w-44">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">Legenda</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Estilo</label>
                  <Input value={captionStyle} onChange={e => setCaptionStyle(e.target.value)} className="mt-1 h-7 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Cor</label>
                  <Input value={captionColor} onChange={e => setCaptionColor(e.target.value)} className="mt-1 h-7 text-xs" />
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full" size="sm" onClick={() => toast.success("Alterações salvas!")}>Salvar alterações</Button>
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

              {/* Messages */}
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

              {/* Quick suggestions when there are messages */}
              {messages.length > 0 && !chatLoading && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {QUICK_SUGGESTIONS.slice(0, 3).map(s => (
                    <button key={s.label} onClick={() => sendMessage(s.msg)} className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
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