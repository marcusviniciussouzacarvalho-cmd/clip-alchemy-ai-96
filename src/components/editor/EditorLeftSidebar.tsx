import {
  Scissors, Timer, Crop, RotateCw, Layers, Sparkles, SlidersHorizontal,
  Eraser, Subtitles, Wand2, Type, MousePointer,
} from "lucide-react";

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
  { id: "speed", label: "Velocidade", icon: Timer, available: true, action: "speed" },
  { id: "crop", label: "Crop", icon: Crop, available: true, action: "crop" },
  { id: "rotate", label: "Rotação", icon: RotateCw, available: true, action: "rotate" },
  { id: "transitions", label: "Transições", icon: Layers, available: true, action: "transitions" },
  { id: "effects", label: "Efeitos", icon: Sparkles, available: true, action: "effects" },
  { id: "lut", label: "Filtros LUT", icon: SlidersHorizontal, available: true, action: "lut" },
  { id: "removebg", label: "Remove Fundo", icon: Eraser, available: true, action: "removebg" },
  { id: "captions", label: "Legendas", icon: Subtitles, available: true, action: "captions" },
  { id: "text", label: "Texto", icon: Type, available: true, action: "text" },
  { id: "upscale", label: "Upscale IA", icon: Wand2, available: true, action: "upscale" },
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
            title={tool.label}
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
          </button>
        );
      })}
    </div>
  );
}
