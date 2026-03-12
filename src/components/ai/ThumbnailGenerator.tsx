import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Download, Loader2, Palette, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STYLES = [
  { id: "minimalista", label: "Minimalista", desc: "Clean e elegante" },
  { id: "bold", label: "Bold", desc: "Impactante e vibrante" },
  { id: "moderno", label: "Moderno", desc: "Gradientes e neon" },
  { id: "criador", label: "Criador", desc: "Estilo YouTuber" },
] as const;

const COLORS = ["#FFFFFF", "#FFD700", "#FF4444", "#00FF88", "#00BFFF", "#FF69B4"];

interface Props {
  clipTitle: string;
  transcript?: string;
}

export function ThumbnailGenerator({ clipTitle, transcript }: Props) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState("bold");
  const [customText, setCustomText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [imageData, setImageData] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setImageData(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: { title: clipTitle, transcript, style, customText: customText || undefined, textColor },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setImageData(data.image_base64);
      setStorageUrl(data.storage_url || null);
      toast.success("Thumbnail gerada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar thumbnail");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (format: "png" | "jpg") => {
    if (!imageData) return;
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `thumbnail_${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="venus-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Image size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Thumbnail AI</span>
        </div>
        <Palette size={12} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3">
              {/* Style selection */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Estilo</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`px-2.5 py-2 rounded-lg text-left transition-all border ${
                        style === s.id
                          ? "border-foreground bg-foreground/10"
                          : "border-border hover:border-foreground/30 hover:bg-accent/50"
                      }`}
                    >
                      <span className="text-[11px] font-bold block">{s.label}</span>
                      <span className="text-[9px] text-muted-foreground">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Texto</label>
                <Input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={clipTitle.split(" ").slice(0, 4).join(" ").toUpperCase()}
                  className="h-7 text-xs"
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Cor do texto</label>
                <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        textColor === c ? "border-foreground scale-110" : "border-border"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Generate */}
              <Button onClick={generate} disabled={loading} size="sm" className="w-full h-8 text-xs">
                {loading ? (
                  <>
                    <Loader2 size={12} className="mr-1.5 animate-spin" />
                    Gerando...
                  </>
                ) : imageData ? (
                  <>
                    <RefreshCw size={12} className="mr-1.5" />
                    Regenerar
                  </>
                ) : (
                  <>
                    <Image size={12} className="mr-1.5" />
                    Gerar Thumbnail
                  </>
                )}
              </Button>

              {/* Preview */}
              {imageData && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img src={imageData} alt="Thumbnail gerada" className="w-full aspect-video object-cover" />
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => downloadImage("png")}>
                      <Download size={11} className="mr-1" /> PNG
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => downloadImage("jpg")}>
                      <Download size={11} className="mr-1" /> JPG
                    </Button>
                  </div>
                  {storageUrl && (
                    <p className="text-[9px] text-muted-foreground text-center truncate">
                      Salva automaticamente na nuvem
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
