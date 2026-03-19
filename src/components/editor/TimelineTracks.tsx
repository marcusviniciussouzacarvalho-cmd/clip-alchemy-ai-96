import { useRef, useCallback, useMemo } from "react";
import type { EditorState, CaptionEntry, TextOverlay, CaptionStyle } from "./types";
import { generateId, DEFAULT_CAPTION_STYLE } from "./types";

interface TimelineTrackProps {
  editorState: EditorState;
  totalDuration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateState: (state: EditorState) => void;
  clips?: any[];
}

export default function TimelineTracks({
  editorState,
  totalDuration,
  currentTime,
  onSeek,
  onUpdateState,
  clips,
}: TimelineTrackProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const pctOf = useCallback((time: number) => {
    if (!totalDuration) return 0;
    return (time / totalDuration) * 100;
  }, [totalDuration]);

  const timeFromPct = useCallback((pct: number) => {
    return Math.max(0, Math.min(totalDuration, pct * totalDuration));
  }, [totalDuration]);

  const handleTrackClick = (e: React.MouseEvent, trackElement: HTMLDivElement | null) => {
    if (!trackElement || !totalDuration) return;
    const rect = trackElement.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(timeFromPct(pct));
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Time ruler ticks
  const ticks = useMemo(() => {
    if (!totalDuration) return [];
    const interval = totalDuration > 300 ? 60 : totalDuration > 60 ? 15 : 5;
    const result = [];
    for (let t = 0; t <= totalDuration; t += interval) {
      result.push(t);
    }
    return result;
  }, [totalDuration]);

  const playheadPct = pctOf(currentTime);

  return (
    <div className="venus-card p-0 overflow-hidden">
      {/* Time ruler */}
      <div className="h-6 bg-muted/30 border-b border-border relative flex items-end px-0">
        <div className="w-20 shrink-0 border-r border-border h-full flex items-center px-2">
          <span className="text-[9px] text-muted-foreground font-mono">{formatTime(currentTime)}</span>
        </div>
        <div className="flex-1 relative h-full">
          {ticks.map(t => (
            <div
              key={t}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${pctOf(t)}%` }}
            >
              <span className="text-[8px] text-muted-foreground/60 font-mono mb-0.5">{formatTime(t)}</span>
              <div className="w-px h-2 bg-border" />
            </div>
          ))}
          {/* Playhead on ruler */}
          <div
            className="absolute top-0 bottom-0 z-40 pointer-events-none"
            style={{ left: `${playheadPct}%` }}
          >
            <div className="w-px h-full bg-destructive" />
          </div>
        </div>
      </div>

      {/* VIDEO TRACK */}
      <TrackRow
        label="🎬 Vídeo"
        trackType="video"
        isSelected={editorState.selectedTrack === "video"}
        onSelect={() => onUpdateState({ ...editorState, selectedTrack: "video", selectedElementId: null })}
      >
        <div
          ref={timelineRef}
          className="flex-1 h-full relative cursor-pointer"
          onClick={(e) => handleTrackClick(e, timelineRef.current)}
        >
          {/* Waveform background */}
          <div className="absolute inset-0 flex items-center px-0.5">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 mx-px bg-muted-foreground/15 rounded-sm"
                style={{ height: `${20 + Math.sin(i * 0.4) * 25 + Math.random() * 20}%` }}
              />
            ))}
          </div>

          {/* Clip selection range */}
          {totalDuration > 0 && (
            <div
              className="absolute inset-y-0 bg-primary/20 border-x-2 border-primary z-10"
              style={{
                left: `${pctOf(editorState.startTime)}%`,
                width: `${pctOf(editorState.endTime - editorState.startTime)}%`,
              }}
            >
              <DragHandle side="left" onDrag={(delta) => {
                const newStart = Math.max(0, Math.min(editorState.endTime - 1, editorState.startTime + delta * totalDuration));
                onUpdateState({ ...editorState, startTime: Math.round(newStart * 10) / 10 });
              }} />
              <DragHandle side="right" onDrag={(delta) => {
                const newEnd = Math.max(editorState.startTime + 1, Math.min(totalDuration, editorState.endTime + delta * totalDuration));
                onUpdateState({ ...editorState, endTime: Math.round(newEnd * 10) / 10 });
              }} />
            </div>
          )}

          {/* Existing clip markers */}
          {clips?.map(clip => (
            <div
              key={clip.id}
              className="absolute top-0 h-1 bg-accent-foreground/40 rounded-full cursor-pointer hover:bg-accent-foreground/60 z-5"
              style={{
                left: `${pctOf(Number(clip.start_time))}%`,
                width: `${pctOf(Number(clip.end_time) - Number(clip.start_time))}%`,
              }}
              title={clip.title}
              onClick={(e) => {
                e.stopPropagation();
                onUpdateState({ ...editorState, startTime: Number(clip.start_time), endTime: Number(clip.end_time) });
                onSeek(Number(clip.start_time));
              }}
            />
          ))}

          {/* Playhead */}
          <Playhead pct={playheadPct} />
        </div>
      </TrackRow>

      {/* CAPTION TRACK */}
      {editorState.captionsEnabled && (
        <TrackRow
          label="💬 Legenda"
          trackType="captions"
          isSelected={editorState.selectedTrack === "captions"}
          onSelect={() => onUpdateState({ ...editorState, selectedTrack: "captions", selectedElementId: null })}
        >
          <div className="flex-1 h-full relative">
            {editorState.captions.map(cap => (
              <div
                key={cap.id}
                className={`absolute inset-y-1 rounded cursor-pointer text-[8px] flex items-center px-1 overflow-hidden transition-colors ${
                  editorState.selectedElementId === cap.id
                    ? "bg-primary text-primary-foreground ring-1 ring-primary"
                    : "bg-primary/30 text-foreground hover:bg-primary/50"
                }`}
                style={{
                  left: `${pctOf(cap.startTime)}%`,
                  width: `${Math.max(1, pctOf(cap.endTime - cap.startTime))}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateState({ ...editorState, selectedElementId: cap.id, selectedTrack: "captions" });
                }}
              >
                <span className="truncate">{cap.text}</span>
              </div>
            ))}
            <Playhead pct={playheadPct} />
          </div>
        </TrackRow>
      )}

      {/* TEXT OVERLAY TRACK */}
      {editorState.textOverlays.length > 0 && (
        <TrackRow
          label="✏️ Texto"
          trackType="text"
          isSelected={editorState.selectedTrack === "text"}
          onSelect={() => onUpdateState({ ...editorState, selectedTrack: "text", selectedElementId: null })}
        >
          <div className="flex-1 h-full relative">
            {editorState.textOverlays.map(overlay => (
              <div
                key={overlay.id}
                className={`absolute inset-y-1 rounded cursor-pointer text-[8px] flex items-center px-1 overflow-hidden transition-colors ${
                  editorState.selectedElementId === overlay.id
                    ? "bg-accent-foreground text-background ring-1 ring-accent-foreground"
                    : "bg-accent-foreground/30 text-foreground hover:bg-accent-foreground/50"
                }`}
                style={{
                  left: `${pctOf(overlay.startTime)}%`,
                  width: `${Math.max(1, pctOf(overlay.endTime - overlay.startTime))}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateState({ ...editorState, selectedElementId: overlay.id, selectedTrack: "text" });
                }}
              >
                <span className="truncate">{overlay.text}</span>
              </div>
            ))}
            <Playhead pct={playheadPct} />
          </div>
        </TrackRow>
      )}

      {/* Bottom info */}
      <div className="h-5 bg-muted/20 border-t border-border flex items-center justify-between px-3">
        <span className="text-[9px] text-muted-foreground font-mono">
          Seleção: {formatTime(editorState.startTime)} → {formatTime(editorState.endTime)} ({formatTime(editorState.endTime - editorState.startTime)})
        </span>
        <span className="text-[9px] text-muted-foreground font-mono">
          Total: {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
}

function TrackRow({ label, trackType, isSelected, onSelect, children }: {
  label: string;
  trackType: string;
  isSelected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex h-10 border-b border-border transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/20"}`}>
      <button
        className={`w-20 shrink-0 border-r border-border flex items-center px-2 text-[10px] font-medium transition-colors ${
          isSelected ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={onSelect}
      >
        {label}
      </button>
      {children}
    </div>
  );
}

function Playhead({ pct }: { pct: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 z-30 pointer-events-none"
      style={{ left: `${pct}%` }}
    >
      <div className="w-px h-full bg-destructive" />
    </div>
  );
}

function DragHandle({ side, onDrag }: { side: "left" | "right"; onDrag: (delta: number) => void }) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const parent = (e.target as HTMLElement).closest(".relative");
    const parentWidth = parent?.getBoundingClientRect().width || 1;

    const handleMove = (me: MouseEvent) => {
      const delta = (me.clientX - startX) / parentWidth;
      onDrag(delta);
    };

    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  return (
    <div
      className={`absolute ${side === "left" ? "left-0" : "right-0"} top-0 bottom-0 w-2.5 bg-primary cursor-col-resize flex items-center justify-center hover:bg-primary/80 z-20 ${side === "left" ? "rounded-l" : "rounded-r"}`}
      onMouseDown={handleMouseDown}
    >
      <div className="w-0.5 h-4 bg-primary-foreground rounded" />
    </div>
  );
}
