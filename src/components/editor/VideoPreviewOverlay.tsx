import type { EditorState, CropValues } from "./types";

interface VideoPreviewOverlayProps {
  editorState: EditorState;
  currentTime: number;
  containerWidth: number;
  containerHeight: number;
}

/** Builds a CSS filter string from the color correction values */
function buildFilterStyle(cc: EditorState["colorCorrection"]): string {
  const parts: string[] = [];
  // brightness: 0 = 100% (no change), -100 = 0%, +100 = 200%
  if (cc.brightness !== 0) parts.push(`brightness(${1 + cc.brightness / 100})`);
  // contrast
  if (cc.contrast !== 0) parts.push(`contrast(${1 + cc.contrast / 100})`);
  // saturation
  if (cc.saturation !== 0) parts.push(`saturate(${1 + cc.saturation / 100})`);
  // temperature → hue-rotate approximation: -100 = -30deg (cool), +100 = +30deg (warm)
  if (cc.temperature !== 0) parts.push(`hue-rotate(${(cc.temperature / 100) * 30}deg)`);
  return parts.join(" ") || "none";
}

/** Builds CSS transform from videoTransform values */
function buildTransformStyle(vt: EditorState["videoTransform"]): string {
  const parts: string[] = [];
  if (vt.x !== 0 || vt.y !== 0) parts.push(`translate(${vt.x}%, ${vt.y}%)`);
  if (vt.scale !== 100) parts.push(`scale(${vt.scale / 100})`);
  if (vt.rotation !== 0) parts.push(`rotate(${vt.rotation}deg)`);
  return parts.join(" ") || "none";
}

export default function VideoPreviewOverlay({
  editorState,
  currentTime,
  containerWidth,
  containerHeight,
}: VideoPreviewOverlayProps) {
  if (!containerWidth || !containerHeight) return null;

  const activeCaptions = editorState.captionsEnabled
    ? editorState.captions.filter(c => currentTime >= c.startTime && currentTime < c.endTime)
    : [];

  const activeOverlays = editorState.textOverlays.filter(
    o => currentTime >= o.startTime && currentTime < o.endTime
  );

  const scale = Math.min(containerWidth / 1080, containerHeight / 1920);

  // Video transform layer — sits behind captions/text but applies to the video via an overlay
  const vt = editorState.videoTransform;
  const cc = editorState.colorCorrection;
  const crop = editorState.crop;
  const hasCrop = crop && (crop.left > 0 || crop.right > 0 || crop.top > 0 || crop.bottom > 0);
  const hasTransform = vt.x !== 0 || vt.y !== 0 || vt.scale !== 100 || vt.rotation !== 0 || vt.opacity !== 100;
  const hasColor = cc.brightness !== 0 || cc.contrast !== 0 || cc.saturation !== 0 || cc.temperature !== 0;
  const hasEffect = editorState.effect && editorState.effect !== "none";

  // Apply transforms to the parent video element via a transparent overlay that controls CSS
  // We use a useEffect approach via style injection on the sibling video element
  const videoStyle: React.CSSProperties = {};
  if (hasTransform) {
    videoStyle.transform = buildTransformStyle(vt);
  }
  if (vt.opacity !== 100) {
    videoStyle.opacity = vt.opacity / 100;
  }
  if (hasColor) {
    videoStyle.filter = buildFilterStyle(cc);
  }

  // Build effect filter additions
  let effectFilter = "";
  if (hasEffect) {
    const intensity = (editorState.effectIntensity ?? 50) / 100;
    switch (editorState.effect) {
      case "blur": effectFilter = ` blur(${intensity * 8}px)`; break;
      case "vignette": effectFilter = ""; break; // handled via overlay
      case "grain": effectFilter = ""; break; // handled via overlay
      case "glitch": effectFilter = ` hue-rotate(${intensity * 90}deg)`; break;
      case "zoom-pulse": effectFilter = ""; break;
    }
  }

  const cropClip = hasCrop ? `inset(${crop!.top}% ${crop!.right}% ${crop!.bottom}% ${crop!.left}%)` : "none";

  if (activeCaptions.length === 0 && activeOverlays.length === 0 && !hasTransform && !hasColor && !hasCrop && !hasEffect) return null;

  return (
    <>
      {/* Transform/filter overlay applied to video container */}
      {(hasTransform || hasColor) && (
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            mixBlendMode: "normal",
          }}
        >
          {/* We inject a style tag to target the sibling video */}
          <style>{`
            .editor-video-transform video,
            .editor-video-transform iframe {
              transform: ${hasTransform ? buildTransformStyle(vt) : "none"} !important;
              opacity: ${vt.opacity / 100} !important;
              filter: ${hasColor ? buildFilterStyle(cc) : "none"} !important;
              transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
            }
          `}</style>
        </div>
      )}

      {/* Captions + text overlays */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
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
    </>
  );
}
