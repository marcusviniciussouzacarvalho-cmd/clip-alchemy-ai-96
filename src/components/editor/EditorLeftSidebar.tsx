import {
  Scissors, Timer, Crop, RotateCw, Layers, Sparkles, SlidersHorizontal,
  Eraser, Subtitles, Wand2, Type, Copy, Trash2, MousePointer,
} from "lucide-react";
import type { EditorState } from "./types";

interface Tool {
  id: string;
  label: string;
  icon: React.ElementType;
  available: boolean;
  action?: string;
}

const TOOLS: Tool[] = [
  { id: "select", label: "Selecionar", icon: MousePointer, available: true },
  { id: "cut", label: "Cortar", icon: Scissors, available: true, action: "cut" },
  { id: "speed", label: "Velocidade", icon: Timer, available: false },
  { id: "crop", label: "Crop", icon: Crop, available: false },
  { id: "rotate", label: "Rotação", icon: RotateCw, available: false },
  { id: "transitions", label: "Transições", icon: Layers, available: false },
  { id: "effects", label: "Efeitos", icon: Sparkles, available: false },
  { id: "lut", label: "Filtros LUT", icon: SlidersHorizontal, available: false },
  { id: "removebg", label: "Remove Fundo", icon: Eraser, available: false },
  { id: "captions", label: "Legendas", icon: Subtitles, available: true, action: "captions" },
  { id: "text", label: "Texto", icon: Type, available: true, action: "text" },
  { id: "upscale", label: "Upscale IA", icon: Wand2, available: false },
];

interface EditorLeftSidebarProps {
  activeTool: string;
  onSelectTool: (toolId: string) => void;
  onAction: (action: string) => void;
}

export default function EditorLeftSidebar({ activeTool, onSelectTool, onAction }: EditorLeftSidebarProps) {
  return (
    <div className="w-14 shrink-0 bg-card border-r border-border flex flex-col items-center py-2 gap-0.5 overflow-y-auto">
      {TOOLS.map(tool => {
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => {
              if (tool.action) onAction(tool.action);
              onSelectTool(tool.id);
            }}
            disabled={!tool.available}
            title={tool.label + (!tool.available ? " (em breve)" : "")}
            className={`
              relative w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-all text-[8px] gap-0.5
              ${isActive
                ? "bg-foreground text-background"
                : tool.available
                  ? "text-muted-foreground hover:bg-accent hover:text-foreground"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }
            `}
          >
            <tool.icon size={16} />
            <span className="leading-none truncate w-full text-center">{tool.label}</span>
            {!tool.available && (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-warning/60" />
            )}
          </button>
        );
      })}
    </div>
  );
}
