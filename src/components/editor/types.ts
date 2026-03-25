// Editor types for the multi-track timeline editor

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  alignment: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
}

export interface CaptionEntry {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: CaptionStyle;
}

export interface CaptionStyle {
  preset: string;
  color: string;
  backgroundColor: string;
  fontSize: number;
  position: "top" | "center" | "bottom";
  fontFamily: string;
}

export interface VideoTransform {
  x: number;       // -100 to 100
  y: number;       // -100 to 100
  scale: number;   // 10 to 200 (percentage)
  rotation: number; // -180 to 180
  opacity: number;  // 0 to 100
}

export interface ColorCorrection {
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  temperature: number;  // -100 to 100
}

export interface CropValues {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const DEFAULT_TRANSFORM: VideoTransform = {
  x: 0, y: 0, scale: 100, rotation: 0, opacity: 100,
};

export const DEFAULT_COLOR: ColorCorrection = {
  brightness: 0, contrast: 0, saturation: 0, temperature: 0,
};

export interface EditorState {
  startTime: number;
  endTime: number;
  format: string;
  title: string;
  captions: CaptionEntry[];
  captionsEnabled: boolean;
  captionStyle: CaptionStyle;
  textOverlays: TextOverlay[];
  selectedElementId: string | null;
  selectedTrack: "video" | "captions" | "text" | null;
  videoTransform: VideoTransform;
  colorCorrection: ColorCorrection;
  // Speed
  speed?: number; // percentage, 100 = normal
  // Crop
  crop?: CropValues;
  // Transition
  transition?: string;
  transitionDuration?: number;
  // Effects
  effect?: string;
  effectIntensity?: number;
  // LUT preset name
  lutPreset?: string;
  // Remove background
  removeBg?: boolean;
  bgReplacementColor?: string;
  // Upscale
  upscale?: string;
  upscaleDenoise?: boolean;
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  preset: "Bold Centered",
  color: "#FFFFFF",
  backgroundColor: "rgba(0,0,0,0.7)",
  fontSize: 24,
  position: "bottom",
  fontFamily: "Inter",
};

export const CAPTION_PRESETS: Record<string, Partial<CaptionStyle>> = {
  "Bold Centered": { color: "#FFFFFF", backgroundColor: "rgba(0,0,0,0.7)", fontSize: 24, position: "bottom" },
  "Karaoke": { color: "#FFD700", backgroundColor: "transparent", fontSize: 28, position: "center" },
  "Minimal": { color: "#FFFFFF", backgroundColor: "transparent", fontSize: 18, position: "bottom" },
  "Pop": { color: "#FF4444", backgroundColor: "#000000", fontSize: 26, position: "bottom" },
  "Neon": { color: "#00FF88", backgroundColor: "rgba(0,0,0,0.5)", fontSize: 22, position: "center" },
};

export function createDefaultEditorState(videoTitle: string, duration: number): EditorState {
  return {
    startTime: 0,
    endTime: Math.min(30, duration || 30),
    format: "9:16",
    title: videoTitle,
    captions: [],
    captionsEnabled: false,
    captionStyle: { ...DEFAULT_CAPTION_STYLE },
    textOverlays: [],
    selectedElementId: null,
    selectedTrack: null,
    videoTransform: { ...DEFAULT_TRANSFORM },
    colorCorrection: { ...DEFAULT_COLOR },
    speed: 100,
    crop: { left: 0, right: 0, top: 0, bottom: 0 },
    transition: "nenhuma",
    transitionDuration: 500,
    effect: "none",
    effectIntensity: 50,
    lutPreset: "none",
    removeBg: false,
    bgReplacementColor: "transparent",
    upscale: "none",
    upscaleDenoise: false,
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
