import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { EditorState, CaptionEntry, TextOverlay } from "./types";
import { generateId, DEFAULT_CAPTION_STYLE, CAPTION_PRESETS } from "./types";

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

  return (
    <div className="w-64 shrink-0 bg-card border-l border-border flex flex-col overflow-y-auto">
      {/* CAPTIONS PANEL */}
      {activePanel === "captions" && (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legendas</h4>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={enableAutoCaption}>
              Auto
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={addCaption}>
              + Manual
            </Button>
          </div>

          {/* Style preset */}
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

          {/* Position */}
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

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={editorState.captionsEnabled}
              onChange={(e) => onUpdateState({ ...editorState, captionsEnabled: e.target.checked })}
              className="rounded"
            />
            Legendas ativas
          </label>

          {/* Selected caption */}
          {selectedCaption && (
            <div className="border-t border-border pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Editando</h5>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={deleteSelected}>
                  <Trash2 size={10} />
                </Button>
              </div>
              <Textarea value={selectedCaption.text} onChange={(e) => updateCaption({ text: e.target.value })} className="h-14 text-xs" />
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[9px] text-muted-foreground">Início</label>
                  <Input type="number" step="0.1" value={selectedCaption.startTime} onChange={(e) => updateCaption({ startTime: Number(e.target.value) })} className="h-6 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">Fim</label>
                  <Input type="number" step="0.1" value={selectedCaption.endTime} onChange={(e) => updateCaption({ endTime: Number(e.target.value) })} className="h-6 text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Caption list */}
          {editorState.captions.length > 0 && (
            <div className="border-t border-border pt-2 space-y-0.5 max-h-32 overflow-y-auto">
              {editorState.captions.map(cap => (
                <button
                  key={cap.id}
                  className={`w-full text-left text-[10px] px-2 py-1 rounded transition-colors ${
                    editorState.selectedElementId === cap.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-accent"
                  }`}
                  onClick={() => onUpdateState({ ...editorState, selectedElementId: cap.id, selectedTrack: "captions" })}
                >
                  <span className="font-mono text-muted-foreground/60">{fmt(cap.startTime)}</span>{" "}
                  {cap.text.slice(0, 30)}{cap.text.length > 30 ? "…" : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEXT PANEL */}
      {activePanel === "text" && (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Texto</h4>
            <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addTextOverlay}>
              + Novo
            </Button>
          </div>

          {selectedOverlay && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase">Editando</h5>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={deleteSelected}>
                  <Trash2 size={10} />
                </Button>
              </div>
              <Textarea value={selectedOverlay.text} onChange={(e) => updateOverlay({ text: e.target.value })} className="h-14 text-xs" />

              <div className="grid grid-cols-3 gap-1">
                <div>
                  <label className="text-[9px] text-muted-foreground">Tam.</label>
                  <Input type="number" value={selectedOverlay.fontSize} onChange={(e) => updateOverlay({ fontSize: Number(e.target.value) })} className="h-6 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">Início</label>
                  <Input type="number" step="0.1" value={selectedOverlay.startTime} onChange={(e) => updateOverlay({ startTime: Number(e.target.value) })} className="h-6 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] text-muted-foreground">Fim</label>
                  <Input type="number" step="0.1" value={selectedOverlay.endTime} onChange={(e) => updateOverlay({ endTime: Number(e.target.value) })} className="h-6 text-xs" />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-[9px] text-muted-foreground">Cor</label>
                <div className="flex gap-1 mt-0.5">
                  {["#FFFFFF", "#000000", "#FFD700", "#FF4444", "#00FF88"].map(c => (
                    <button
                      key={c}
                      onClick={() => updateOverlay({ color: c })}
                      className={`w-5 h-5 rounded-full border-2 ${selectedOverlay.color === c ? "border-foreground scale-110" : "border-border"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div>
                <label className="text-[9px] text-muted-foreground">Alinhamento</label>
                <div className="flex gap-1 mt-0.5">
                  {(["left", "center", "right"] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => updateOverlay({ alignment: a })}
                      className={`px-2 py-0.5 text-[10px] rounded ${selectedOverlay.alignment === a ? "bg-foreground text-background" : "bg-accent text-muted-foreground"}`}
                    >
                      {a === "left" ? "←" : a === "right" ? "→" : "↔"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bold / Italic */}
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

              {/* Position */}
              <div>
                <label className="text-[9px] text-muted-foreground">Posição X / Y (%)</label>
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  <Input type="number" value={selectedOverlay.x} onChange={(e) => updateOverlay({ x: Number(e.target.value) })} className="h-6 text-xs" placeholder="X" />
                  <Input type="number" value={selectedOverlay.y} onChange={(e) => updateOverlay({ y: Number(e.target.value) })} className="h-6 text-xs" placeholder="Y" />
                </div>
              </div>
            </div>
          )}

          {editorState.textOverlays.length > 0 && !selectedOverlay && (
            <div className="space-y-0.5">
              {editorState.textOverlays.map(o => (
                <button
                  key={o.id}
                  className="w-full text-left text-[10px] px-2 py-1 rounded text-muted-foreground hover:bg-accent"
                  onClick={() => onUpdateState({ ...editorState, selectedElementId: o.id, selectedTrack: "text" })}
                >
                  {o.text.slice(0, 30)}{o.text.length > 30 ? "…" : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROPERTIES PANEL (default / select tool) */}
      {(activePanel === "select" || activePanel === "cut" || (!["captions", "text"].includes(activePanel))) && (
        <div className="p-3 space-y-4">
          <Section title="Propriedades">
            <PropRow label="Posição X">
              <Slider defaultValue={[50]} max={100} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Posição Y">
              <Slider defaultValue={[50]} max={100} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Escala">
              <Slider defaultValue={[100]} max={200} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Rotação">
              <Slider defaultValue={[0]} min={-180} max={180} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Opacidade">
              <Slider defaultValue={[100]} max={100} step={1} className="flex-1" disabled />
            </PropRow>
          </Section>

          <Section title="Correção de Cor">
            <PropRow label="Brilho">
              <Slider defaultValue={[0]} min={-100} max={100} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Contraste">
              <Slider defaultValue={[0]} min={-100} max={100} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Saturação">
              <Slider defaultValue={[0]} min={-100} max={100} step={1} className="flex-1" disabled />
            </PropRow>
            <PropRow label="Temperatura">
              <Slider defaultValue={[0]} min={-100} max={100} step={1} className="flex-1" disabled />
            </PropRow>
          </Section>

          <p className="text-[9px] text-muted-foreground/50 text-center italic">
            Propriedades e correção de cor disponíveis em breve
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{label}</span>
      {children}
    </div>
  );
}
