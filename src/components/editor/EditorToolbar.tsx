import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Subtitles, Type, Trash2, Move, ChevronDown } from "lucide-react";
import type { EditorState, CaptionEntry, TextOverlay, CaptionStyle } from "./types";
import { generateId, DEFAULT_CAPTION_STYLE, CAPTION_PRESETS } from "./types";

interface EditorToolbarProps {
  editorState: EditorState;
  onUpdateState: (state: EditorState) => void;
  currentTime: number;
  totalDuration: number;
  transcriptSegments?: any[];
}

export default function EditorToolbar({
  editorState,
  onUpdateState,
  currentTime,
  totalDuration,
  transcriptSegments,
}: EditorToolbarProps) {
  const [activePanel, setActivePanel] = useState<"captions" | "text" | null>(null);

  const selectedCaption = editorState.captions.find(c => c.id === editorState.selectedElementId);
  const selectedOverlay = editorState.textOverlays.find(o => o.id === editorState.selectedElementId);

  // Toggle caption panel
  const toggleCaptions = () => {
    setActivePanel(activePanel === "captions" ? null : "captions");
  };

  // Toggle text panel
  const toggleText = () => {
    setActivePanel(activePanel === "text" ? null : "text");
  };

  // Enable captions and auto-generate from transcript segments
  const enableAutoCaption = () => {
    if (!transcriptSegments?.length) {
      // Add a single caption for the whole clip range
      const cap: CaptionEntry = {
        id: generateId(),
        text: "Legenda aqui...",
        startTime: editorState.startTime,
        endTime: editorState.endTime,
        style: { ...editorState.captionStyle },
      };
      onUpdateState({
        ...editorState,
        captionsEnabled: true,
        captions: [cap],
        selectedElementId: cap.id,
        selectedTrack: "captions",
      });
      return;
    }

    // Generate captions from transcript segments within the clip range
    const relevantSegments = transcriptSegments.filter(
      (seg: any) => seg.start_time < editorState.endTime && seg.end_time > editorState.startTime
    );

    const captions: CaptionEntry[] = relevantSegments.map((seg: any) => ({
      id: generateId(),
      text: seg.text,
      startTime: Math.max(seg.start_time, editorState.startTime),
      endTime: Math.min(seg.end_time, editorState.endTime),
      style: { ...editorState.captionStyle },
    }));

    onUpdateState({
      ...editorState,
      captionsEnabled: true,
      captions: captions.length > 0 ? captions : [{
        id: generateId(),
        text: "Legenda aqui...",
        startTime: editorState.startTime,
        endTime: editorState.endTime,
        style: { ...editorState.captionStyle },
      }],
      selectedTrack: "captions",
    });
  };

  // Add manual caption
  const addCaption = () => {
    const cap: CaptionEntry = {
      id: generateId(),
      text: "Nova legenda",
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration),
      style: { ...editorState.captionStyle },
    };
    onUpdateState({
      ...editorState,
      captionsEnabled: true,
      captions: [...editorState.captions, cap],
      selectedElementId: cap.id,
      selectedTrack: "captions",
    });
  };

  // Add text overlay
  const addTextOverlay = () => {
    const overlay: TextOverlay = {
      id: generateId(),
      text: "Seu texto aqui",
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, totalDuration),
      x: 50,
      y: 30,
      fontSize: 32,
      fontFamily: "Inter",
      color: "#FFFFFF",
      backgroundColor: "transparent",
      alignment: "center",
      bold: true,
      italic: false,
    };
    onUpdateState({
      ...editorState,
      textOverlays: [...editorState.textOverlays, overlay],
      selectedElementId: overlay.id,
      selectedTrack: "text",
    });
    setActivePanel("text");
  };

  // Update selected caption
  const updateCaption = (updates: Partial<CaptionEntry>) => {
    if (!selectedCaption) return;
    onUpdateState({
      ...editorState,
      captions: editorState.captions.map(c =>
        c.id === selectedCaption.id ? { ...c, ...updates } : c
      ),
    });
  };

  // Update selected text overlay
  const updateOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlay) return;
    onUpdateState({
      ...editorState,
      textOverlays: editorState.textOverlays.map(o =>
        o.id === selectedOverlay.id ? { ...o, ...updates } : o
      ),
    });
  };

  // Delete selected element
  const deleteSelected = () => {
    if (selectedCaption) {
      onUpdateState({
        ...editorState,
        captions: editorState.captions.filter(c => c.id !== selectedCaption.id),
        selectedElementId: null,
      });
    } else if (selectedOverlay) {
      onUpdateState({
        ...editorState,
        textOverlays: editorState.textOverlays.filter(o => o.id !== selectedOverlay.id),
        selectedElementId: null,
      });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      {/* Tool buttons row */}
      <div className="flex gap-1.5">
        <Button
          variant={editorState.captionsEnabled ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={toggleCaptions}
        >
          <Subtitles size={14} />
          Legenda
        </Button>
        <Button
          variant={editorState.textOverlays.length > 0 ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={toggleText}
        >
          <Type size={14} />
          Texto
        </Button>
        {(selectedCaption || selectedOverlay) && (
          <Button variant="destructive" size="sm" className="h-8 text-xs gap-1 ml-auto" onClick={deleteSelected}>
            <Trash2 size={12} />
            Excluir
          </Button>
        )}
      </div>

      {/* Caption panel */}
      {activePanel === "captions" && (
        <div className="venus-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Legendas</h4>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={enableAutoCaption}>
                Auto (da transcrição)
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addCaption}>
                + Manual
              </Button>
            </div>
          </div>

          {/* Caption style */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Estilo</label>
              <select
                value={editorState.captionStyle.preset}
                onChange={(e) => {
                  const preset = CAPTION_PRESETS[e.target.value];
                  const newStyle = { ...editorState.captionStyle, ...preset, preset: e.target.value };
                  onUpdateState({ ...editorState, captionStyle: newStyle });
                }}
                className="mt-0.5 w-full h-7 text-xs rounded-md border border-border bg-background px-2"
              >
                {Object.keys(CAPTION_PRESETS).map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Posição</label>
              <select
                value={editorState.captionStyle.position}
                onChange={(e) => onUpdateState({
                  ...editorState,
                  captionStyle: { ...editorState.captionStyle, position: e.target.value as any },
                })}
                className="mt-0.5 w-full h-7 text-xs rounded-md border border-border bg-background px-2"
              >
                <option value="top">Topo</option>
                <option value="center">Centro</option>
                <option value="bottom">Base</option>
              </select>
            </div>
          </div>

          {/* Color swatches */}
          <div>
            <label className="text-[10px] text-muted-foreground">Cor</label>
            <div className="flex gap-1 mt-0.5">
              {["#FFFFFF", "#FFD700", "#00FF88", "#FF4444", "#4488FF", "#FF69B4"].map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateState({
                    ...editorState,
                    captionStyle: { ...editorState.captionStyle, color: c },
                  })}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    editorState.captionStyle.color === c ? "border-foreground scale-110" : "border-border"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={editorState.captionsEnabled}
              onChange={(e) => onUpdateState({ ...editorState, captionsEnabled: e.target.checked })}
              className="rounded"
            />
            Legendas ativas
          </label>

          {/* Selected caption editor */}
          {selectedCaption && (
            <div className="border-t border-border pt-2 space-y-2">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Editando legenda</h5>
              <Textarea
                value={selectedCaption.text}
                onChange={(e) => updateCaption({ text: e.target.value })}
                className="h-16 text-xs"
                placeholder="Texto da legenda..."
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Início</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedCaption.startTime}
                    onChange={(e) => updateCaption({ startTime: Number(e.target.value) })}
                    className="h-6 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fim</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedCaption.endTime}
                    onChange={(e) => updateCaption({ endTime: Number(e.target.value) })}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Caption list */}
          {editorState.captions.length > 0 && (
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {editorState.captions.map(cap => (
                <button
                  key={cap.id}
                  className={`w-full text-left text-[10px] px-2 py-1 rounded transition-colors ${
                    editorState.selectedElementId === cap.id
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                  onClick={() => onUpdateState({ ...editorState, selectedElementId: cap.id, selectedTrack: "captions" })}
                >
                  <span className="font-mono text-muted-foreground/60">{formatTime(cap.startTime)}</span>
                  {" "}{cap.text.slice(0, 40)}{cap.text.length > 40 ? "..." : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Text overlay panel */}
      {activePanel === "text" && (
        <div className="venus-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Textos</h4>
            <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addTextOverlay}>
              + Adicionar texto
            </Button>
          </div>

          {/* Selected text overlay editor */}
          {selectedOverlay && (
            <div className="space-y-2">
              <Textarea
                value={selectedOverlay.text}
                onChange={(e) => updateOverlay({ text: e.target.value })}
                className="h-16 text-xs"
                placeholder="Seu texto..."
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Tamanho</label>
                  <Input
                    type="number"
                    value={selectedOverlay.fontSize}
                    onChange={(e) => updateOverlay({ fontSize: Number(e.target.value) })}
                    className="h-6 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Início</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedOverlay.startTime}
                    onChange={(e) => updateOverlay({ startTime: Number(e.target.value) })}
                    className="h-6 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fim</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedOverlay.endTime}
                    onChange={(e) => updateOverlay({ endTime: Number(e.target.value) })}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Cor do texto</label>
                  <div className="flex gap-1 mt-0.5">
                    {["#FFFFFF", "#000000", "#FFD700", "#FF4444", "#00FF88"].map(c => (
                      <button
                        key={c}
                        onClick={() => updateOverlay({ color: c })}
                        className={`w-5 h-5 rounded-full border-2 ${
                          selectedOverlay.color === c ? "border-foreground scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Alinhamento</label>
                  <div className="flex gap-1 mt-0.5">
                    {(["left", "center", "right"] as const).map(a => (
                      <button
                        key={a}
                        onClick={() => updateOverlay({ alignment: a })}
                        className={`px-2 py-0.5 text-[10px] rounded ${
                          selectedOverlay.alignment === a ? "bg-foreground text-background" : "bg-accent text-muted-foreground"
                        }`}
                      >
                        {a === "left" ? "←" : a === "right" ? "→" : "↔"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                  <input type="checkbox" checked={selectedOverlay.bold} onChange={(e) => updateOverlay({ bold: e.target.checked })} />
                  Negrito
                </label>
                <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                  <input type="checkbox" checked={selectedOverlay.italic} onChange={(e) => updateOverlay({ italic: e.target.checked })} />
                  Itálico
                </label>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Posição (%)</label>
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={selectedOverlay.x}
                    onChange={(e) => updateOverlay({ x: Number(e.target.value) })}
                    className="h-6 text-xs"
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    value={selectedOverlay.y}
                    onChange={(e) => updateOverlay({ y: Number(e.target.value) })}
                    className="h-6 text-xs"
                    placeholder="Y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overlay list */}
          {editorState.textOverlays.length > 0 && !selectedOverlay && (
            <div className="space-y-0.5">
              {editorState.textOverlays.map(o => (
                <button
                  key={o.id}
                  className="w-full text-left text-[10px] px-2 py-1 rounded text-muted-foreground hover:bg-accent"
                  onClick={() => onUpdateState({ ...editorState, selectedElementId: o.id, selectedTrack: "text" })}
                >
                  <span className="font-mono text-muted-foreground/60">{formatTime(o.startTime)}</span>
                  {" "}{o.text.slice(0, 30)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
