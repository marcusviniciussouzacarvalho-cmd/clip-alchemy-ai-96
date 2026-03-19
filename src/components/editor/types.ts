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
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}
