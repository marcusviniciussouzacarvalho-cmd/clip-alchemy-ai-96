import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import type { EditorState, CaptionEntry, TextOverlay, VideoTransform, ColorCorrection } from "./types";
import { generateId, DEFAULT_CAPTION_STYLE, CAPTION_PRESETS, DEFAULT_TRANSFORM, DEFAULT_COLOR } from "./types";

interface EditorRightSidebarProps {
  editorState: EditorState;
  onUpdateState: (state: EditorState) => void;
  activePanel: string;
  currentTime: number;
  totalDuration: number;
  transcriptSegments?: any[];
}

export default function EditorRightSidebar({
  editorState,
  onUpdateState,
  activePanel,
  currentTime,
  totalDuration,
  transcriptSegments,
}: EditorRightSidebarProps) {
  const selectedCaption = editorState.captions.find(c => c.id === editorState.selectedElementId);
  const selectedOverlay = editorState.textOverlays.find(o => o.id === editorState.selectedElementId);

  const updateCaption = (updates: Partial<CaptionEntry>) => {
    if (!selectedCaption) return;
    onUpdateState({
      ...editorState,
      captions: editorState.captions.map(c =>
        c.id === selectedCaption.id ? { ...c, ...updates } : c
      ),
    });
  };

  const updateOverlay = (updates: Partial<TextOverlay>) => {
    if (!selectedOverlay) return;
    onUpdateState({
      ...editorState,
      textOverlays: editorState.textOverlays.map(o =>
        o.id === selectedOverlay.id ? { ...o, ...updates } : o
      ),
    });
  };

  const updateTransform = (updates: Partial<VideoTransform>) => {
    onUpdateState({
      ...editorState,
      videoTransform: { ...editorState.videoTransform, ...updates },
    });
  };

  const updateColor = (updates: Partial<ColorCorrection>) => {
    onUpdateState({
      ...editorState,
      colorCorrection: { ...editorState.colorCorrection, ...updates },
    });
  };

  const resetTransform = () => onUpdateState({ ...editorState, videoTransform: { ...DEFAULT_TRANSFORM } });
  const resetColor = () => onUpdateState({ ...editorState, colorCorrection: { ...DEFAULT_COLOR } });

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

  const enableAutoCaption = () => {
    const relevantSegments = transcriptSegments?.filter(
      (seg: any) => seg.start_time < editorState.endTime && seg.end_time > editorState.startTime
    ) || [];

    const captions: CaptionEntry[] = relevantSegments.length > 0
      ? relevantSegments.map((seg: any) => ({
          id: generateId(),
          text: seg.text,
          startTime: Math.max(seg.start_time, editorState.startTime),
          endTime: Math.min(seg.end_time, editorState.endTime),
          style: { ...editorState.captionStyle },
        }))
      : [{
          id: generateId(),
          text: "Legenda aqui...",
          startTime: editorState.startTime,
          endTime: editorState.endTime,
          style: { ...editorState.captionStyle },
        }];

    onUpdateState({
      ...editorState,
      captionsEnabled: true,
      captions,
      selectedTrack: "captions",
    });
  };

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

  const addTextOverlay = () => {
    const overlay: TextOverlay = {
      id: generateId(),
      text: "Seu texto aqui",
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, totalDuration),
      x: 50, y: 30,
      fontSize: 32, fontFamily: "Inter",
      color: "#FFFFFF", backgroundColor: "transparent",
      alignment: "center", bold: true, italic: false,
    };
    onUpdateState({
      ...editorState,
      textOverlays: [...editorState.textOverlays, overlay],
      selectedElementId: overlay.id,
      selectedTrack: "text",
    });
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const t = editorState.videoTransform;
  const cc = editorState.colorCorrection;

  return (
    <div className="w-64 shrink-0 bg-card border-l border-border flex flex-col overflow-y-auto">
      {/* CAPTIONS PANEL */}
      {activePanel === "captions" && (
        <CaptionsPanel
          editorState={editorState}
          onUpdateState={onUpdateState}
          selectedCaption={selectedCaption}
          updateCaption={updateCaption}
          deleteSelected={deleteSelected}
          enableAutoCaption={enableAutoCaption}
          addCaption={addCaption}
          fmt={fmt}
        />
      )}

      {/* TEXT PANEL */}
      {activePanel === "text" && (
        <TextPanel
          editorState={editorState}
          onUpdateState={onUpdateState}
          selectedOverlay={selectedOverlay}
          updateOverlay={updateOverlay}
          deleteSelected={deleteSelected}
          addTextOverlay={addTextOverlay}
        />
      )}

      {/* PROPERTIES PANEL (default / select / cut tool) */}
      {(activePanel === "select" || activePanel === "cut" || (!["captions", "text"].includes(activePanel))) && (
        <div className="p-3 space-y-4">
          <Section title="Propriedades" onReset={resetTransform}>
            <PropSlider label="Posição X" value={t.x} min={-100} max={100} onChange={v => updateTransform({ x: v })} />
            <PropSlider label="Posição Y" value={t.y} min={-100} max={100} onChange={v => updateTransform({ y: v })} />
            <PropSlider label="Escala" value={t.scale} min={10} max={200} onChange={v => updateTransform({ scale: v })} suffix="%" />
            <PropSlider label="Rotação" value={t.rotation} min={-180} max={180} onChange={v => updateTransform({ rotation: v })} suffix="°" />
            <PropSlider label="Opacidade" value={t.opacity} min={0} max={100} onChange={v => updateTransform({ opacity: v })} suffix="%" />
          </Section>

          <Section title="Correção de Cor" onReset={resetColor}>
            <PropSlider label="Brilho" value={cc.brightness} min={-100} max={100} onChange={v => updateColor({ brightness: v })} />
            <PropSlider label="Contraste" value={cc.contrast} min={-100} max={100} onChange={v => updateColor({ contrast: v })} />
            <PropSlider label="Saturação" value={cc.saturation} min={-100} max={100} onChange={v => updateColor({ saturation: v })} />
            <PropSlider label="Temperatura" value={cc.temperature} min={-100} max={100} onChange={v => updateColor({ temperature: v })} />
          </Section>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────── */

function Section({ title, children, onReset }: { title: string; children: React.ReactNode; onReset?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
        {onReset && (
          <button onClick={onReset} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5" title="Resetar">
            <RotateCcw size={9} /> Reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function PropSlider({ label, value, min, max, onChange, suffix }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{label}</span>
      <Slider value={[value]} min={min} max={max} step={1} className="flex-1" onValueChange={([v]) => onChange(v)} />
      <span className="text-[10px] text-muted-foreground w-10 text-right font-mono">{value}{suffix || ""}</span>
    </div>
  );
}

/* ─── Captions Panel ──────────────────────── */

function CaptionsPanel({ editorState, onUpdateState, selectedCaption, updateCaption, deleteSelected, enableAutoCaption, addCaption, fmt }: any) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legendas</h4>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={enableAutoCaption}>Auto</Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={addCaption}>+ Manual</Button>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Estilo</label>
        <select
          value={editorState.captionStyle.preset}
          onChange={(e) => {
            const preset = CAPTION_PRESETS[e.target.value];
            onUpdateState({ ...editorState, captionStyle: { ...editorState.captionStyle, ...preset, preset: e.target.value } });
          }}
          className="mt-0.5 w-full h-7 text-xs rounded-md border border-border bg-background px-2"
        >
          {Object.keys(CAPTION_PRESETS).map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Posição</label>
        <select
          value={editorState.captionStyle.position}
          onChange={(e) => onUpdateState({ ...editorState, captionStyle: { ...editorState.captionStyle, position: e.target.value as any } })}
          className="mt-0.5 w-full h-7 text-xs rounded-md border border-border bg-background px-2"
        >
          <option value="top">Topo</option>
          <option value="center">Centro</option>
          <option value="bottom">Base</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] text-muted-foreground">Cor</label>
        <div className="flex gap-1 mt-0.5">
          {["#FFFFFF", "#FFD700", "#00FF88", "#FF4444", "#4488FF", "#FF69B4"].map(c => (
            <button
              key={c}
              onClick={() => onUpdateState({ ...editorState, captionStyle: { ...editorState.captionStyle, color: c } })}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${editorState.captionStyle.color === c ? "border-foreground scale-110" : "border-border"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input type="checkbox" checked={editorState.captionsEnabled} onChange={(e) => onUpdateState({ ...editorState, captionsEnabled: e.target.checked })} className="rounded" />
        Legendas ativas
      </label>

      {selectedCaption && (
        <div className="border-t border-border pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Editando</h5>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={deleteSelected}><Trash2 size={10} /></Button>
          </div>
          <Textarea value={selectedCaption.text} onChange={(e: any) => updateCaption({ text: e.target.value })} className="h-14 text-xs" />
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="text-[9px] text-muted-foreground">Início</label>
              <Input type="number" step="0.1" value={selectedCaption.startTime} onChange={(e: any) => updateCaption({ startTime: Number(e.target.value) })} className="h-6 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Fim</label>
              <Input type="number" step="0.1" value={selectedCaption.endTime} onChange={(e: any) => updateCaption({ endTime: Number(e.target.value) })} className="h-6 text-xs" />
            </div>
          </div>
        </div>
      )}

      {editorState.captions.length > 0 && (
        <div className="border-t border-border pt-2 space-y-0.5 max-h-32 overflow-y-auto">
          {editorState.captions.map((cap: any) => (
            <button
              key={cap.id}
              className={`w-full text-left text-[10px] px-2 py-1 rounded transition-colors ${editorState.selectedElementId === cap.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-accent"}`}
              onClick={() => onUpdateState({ ...editorState, selectedElementId: cap.id, selectedTrack: "captions" })}
            >
              <span className="font-mono text-muted-foreground/60">{fmt(cap.startTime)}</span>{" "}
              {cap.text.slice(0, 30)}{cap.text.length > 30 ? "…" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Text Panel ──────────────────────── */

function TextPanel({ editorState, onUpdateState, selectedOverlay, updateOverlay, deleteSelected, addTextOverlay }: any) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Texto</h4>
        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addTextOverlay}>+ Novo</Button>
      </div>

      {selectedOverlay && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Editando</h5>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={deleteSelected}><Trash2 size={10} /></Button>
          </div>
          <Textarea value={selectedOverlay.text} onChange={(e: any) => updateOverlay({ text: e.target.value })} className="h-14 text-xs" />
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[9px] text-muted-foreground">Tam.</label>
              <Input type="number" value={selectedOverlay.fontSize} onChange={(e: any) => updateOverlay({ fontSize: Number(e.target.value) })} className="h-6 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Início</label>
              <Input type="number" step="0.1" value={selectedOverlay.startTime} onChange={(e: any) => updateOverlay({ startTime: Number(e.target.value) })} className="h-6 text-xs" />
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground">Fim</label>
              <Input type="number" step="0.1" value={selectedOverlay.endTime} onChange={(e: any) => updateOverlay({ endTime: Number(e.target.value) })} className="h-6 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground">Cor</label>
            <div className="flex gap-1 mt-0.5">
              {["#FFFFFF", "#000000", "#FFD700", "#FF4444", "#00FF88"].map(c => (
                <button key={c} onClick={() => updateOverlay({ color: c })} className={`w-5 h-5 rounded-full border-2 ${selectedOverlay.color === c ? "border-foreground scale-110" : "border-border"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground">Alinhamento</label>
            <div className="flex gap-1 mt-0.5">
              {(["left", "center", "right"] as const).map(a => (
                <button key={a} onClick={() => updateOverlay({ alignment: a })} className={`px-2 py-0.5 text-[10px] rounded ${selectedOverlay.alignment === a ? "bg-foreground text-background" : "bg-accent text-muted-foreground"}`}>
                  {a === "left" ? "←" : a === "right" ? "→" : "↔"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-[10px] cursor-pointer">
              <input type="checkbox" checked={selectedOverlay.bold} onChange={(e: any) => updateOverlay({ bold: e.target.checked })} /> Negrito
            </label>
            <label className="flex items-center gap-1 text-[10px] cursor-pointer">
              <input type="checkbox" checked={selectedOverlay.italic} onChange={(e: any) => updateOverlay({ italic: e.target.checked })} /> Itálico
            </label>
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground">Posição X / Y (%)</label>
            <div className="grid grid-cols-2 gap-1 mt-0.5">
              <Input type="number" value={selectedOverlay.x} onChange={(e: any) => updateOverlay({ x: Number(e.target.value) })} className="h-6 text-xs" placeholder="X" />
              <Input type="number" value={selectedOverlay.y} onChange={(e: any) => updateOverlay({ y: Number(e.target.value) })} className="h-6 text-xs" placeholder="Y" />
            </div>
          </div>
        </div>
      )}

      {editorState.textOverlays.length > 0 && !selectedOverlay && (
        <div className="space-y-0.5">
          {editorState.textOverlays.map((o: any) => (
            <button key={o.id} className="w-full text-left text-[10px] px-2 py-1 rounded text-muted-foreground hover:bg-accent" onClick={() => onUpdateState({ ...editorState, selectedElementId: o.id, selectedTrack: "text" })}>
              {o.text.slice(0, 30)}{o.text.length > 30 ? "…" : ""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
