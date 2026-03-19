import type { EditorState, CaptionEntry, TextOverlay } from "./types";

interface VideoPreviewOverlayProps {
  editorState: EditorState;
  currentTime: number;
  containerWidth: number;
  containerHeight: number;
}

export default function VideoPreviewOverlay({
  editorState,
  currentTime,
  containerWidth,
  containerHeight,
}: VideoPreviewOverlayProps) {
  if (!containerWidth || !containerHeight) return null;

  // Find active captions at current time
  const activeCaptions = editorState.captionsEnabled
    ? editorState.captions.filter(c => currentTime >= c.startTime && currentTime < c.endTime)
    : [];

  // Find active text overlays at current time
  const activeOverlays = editorState.textOverlays.filter(
    o => currentTime >= o.startTime && currentTime < o.endTime
  );

  if (activeCaptions.length === 0 && activeOverlays.length === 0) return null;

  const scale = Math.min(containerWidth / 1080, containerHeight / 1920);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Captions */}
      {activeCaptions.map(cap => {
        const posY = cap.style.position === "top" ? "8%" : cap.style.position === "center" ? "45%" : "85%";
        return (
          <div
            key={cap.id}
            className={`absolute left-1/2 -translate-x-1/2 max-w-[90%] text-center transition-all ${
              editorState.selectedElementId === cap.id ? "ring-2 ring-primary pointer-events-auto" : ""
            }`}
            style={{
              top: posY,
              color: cap.style.color || editorState.captionStyle.color,
              backgroundColor: cap.style.backgroundColor || editorState.captionStyle.backgroundColor,
              fontSize: `${Math.max(12, (cap.style.fontSize || 24) * Math.min(1, scale * 2))}px`,
              fontFamily: cap.style.fontFamily || "Inter",
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 700,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              letterSpacing: "0.02em",
            }}
          >
            {cap.text}
          </div>
        );
      })}

      {/* Text overlays */}
      {activeOverlays.map(overlay => (
        <div
          key={overlay.id}
          className={`absolute transition-all ${
            editorState.selectedElementId === overlay.id ? "ring-2 ring-accent-foreground pointer-events-auto" : ""
          }`}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            transform: "translate(-50%, -50%)",
            color: overlay.color,
            backgroundColor: overlay.backgroundColor !== "transparent" ? overlay.backgroundColor : undefined,
            fontSize: `${Math.max(10, overlay.fontSize * Math.min(1, scale * 2))}px`,
            fontFamily: overlay.fontFamily,
            fontWeight: overlay.bold ? 700 : 400,
            fontStyle: overlay.italic ? "italic" : "normal",
            textAlign: overlay.alignment,
            padding: overlay.backgroundColor !== "transparent" ? "4px 10px" : undefined,
            borderRadius: "4px",
            textShadow: overlay.backgroundColor === "transparent" ? "0 2px 8px rgba(0,0,0,0.8)" : undefined,
            whiteSpace: "pre-wrap",
            maxWidth: "80%",
          }}
        >
          {overlay.text}
        </div>
      ))}
    </div>
  );
}
