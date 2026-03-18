import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, Play, Clock, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface VideoMeta {
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
}

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

const DashboardImport = () => {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<VideoMeta | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"input" | "preview" | "importing">("input");
  const navigate = useNavigate();

  const isValidUrl = YOUTUBE_REGEX.test(url.trim());

  const handleValidate = useCallback(async () => {
    if (!isValidUrl) {
      toast.error("Link do YouTube inválido");
      return;
    }
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-youtube", {
        body: { url: url.trim(), action: "validate" },
      });
      if (error) throw error;
      if (!data?.meta) throw new Error("Não foi possível obter metadados");
      setMeta(data.meta);
      setStep("preview");
    } catch (err: any) {
      toast.error(err.message || "Erro ao validar link");
    } finally {
      setValidating(false);
    }
  }, [url, isValidUrl]);

  const handleImport = useCallback(async () => {
    if (!meta) return;
    setImporting(true);
    setStep("importing");
    try {
      const { data, error } = await supabase.functions.invoke("import-youtube", {
        body: { url: url.trim(), action: "import" },
      });

      // Handle structured errors from the edge function
      if (data?.requires_config) {
        toast.error("Ingestão do YouTube indisponível", {
          description: data.help || "Configure YOUTUBE_INGEST_ENDPOINT nas secrets do projeto.",
          duration: 10000,
        });
        setStep("preview");
        return;
      }

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.internalized
        ? "Vídeo internalizado e processamento iniciado!"
        : "Vídeo importado! Processamento iniciado.");

      if (data?.video?.id) {
        navigate(`/dashboard/videos/${data.video.id}`);
      } else {
        navigate("/dashboard/library");
      }
    } catch (err: any) {
      const msg = err.message || "Erro ao importar";
      if (msg.includes("INGEST") || msg.includes("indisponível")) {
        toast.error("Serviço de ingestão não configurado", {
          description: "Configure YOUTUBE_INGEST_ENDPOINT para baixar vídeos do YouTube.",
          duration: 10000,
        });
      } else {
        toast.error(msg);
      }
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }, [url, meta, navigate]);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-primary/10 text-primary border border-primary/30 rounded px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider">IMPORT V3 — INTERNALIZAÇÃO REAL</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-1">Importar do YouTube</h1>
        <p className="text-sm text-muted-foreground">Cole o link de um vídeo do YouTube para importar</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* URL Input */}
        <div className="venus-card p-6">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link do vídeo</Label>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setStep("input"); setMeta(null); }}
                placeholder="https://youtube.com/watch?v=..."
                className="pl-9"
                disabled={importing}
              />
            </div>
            <Button
              onClick={handleValidate}
              disabled={!isValidUrl || validating || importing}
              variant="default"
              size="default"
            >
              {validating ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
              Validar
            </Button>
          </div>
          {url && !isValidUrl && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <AlertCircle size={12} /> Link inválido. Use um link do YouTube válido.
            </p>
          )}
        </div>

        {/* Preview */}
        <AnimatePresence>
          {meta && step !== "input" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="venus-card overflow-hidden"
            >
              <div className="aspect-video bg-accent relative">
                {meta.thumbnail && (
                  <img src={meta.thumbnail} alt={meta.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-sm line-clamp-2">{meta.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {meta.duration && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} /> {meta.duration}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {meta.description && (
                <div className="px-5 py-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    <FileText size={10} /> Descrição
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{meta.description}</p>
                </div>
              )}

              <div className="p-5 border-t border-border">
                {step === "importing" ? (
                  <div className="flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-foreground" />
                    <div>
                      <div className="text-sm font-medium">Importando vídeo...</div>
                      <div className="text-[10px] text-muted-foreground">O processamento iniciará automaticamente</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button onClick={handleImport} disabled={importing} className="flex-1">
                      <Play size={14} className="mr-1.5" /> Importar e processar
                    </Button>
                    <Button variant="outline" onClick={() => { setStep("input"); setMeta(null); setUrl(""); }}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Steps guide */}
        <div className="venus-card p-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-4">Como funciona</h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "Cole o link", desc: "Cole o link do vídeo do YouTube" },
              { step: "2", title: "Validação", desc: "Validamos o link e buscamos os metadados" },
              { step: "3", title: "Preview", desc: "Confira os detalhes antes de importar" },
              { step: "4", title: "Processamento", desc: "O vídeo entra no pipeline de IA automaticamente" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent border border-border flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <div className="text-sm font-medium">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardImport;
