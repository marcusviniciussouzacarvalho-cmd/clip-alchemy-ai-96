import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Film, Sparkles, Subtitles, Search, Loader2, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { useUploadVideo, useProcessVideo } from "@/hooks/use-pipeline";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { validateVideoFile, sanitizeFilename } from "@/lib/upload-validation";

const DashboardUpload = () => {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("pt");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [options, setOptions] = useState({
    generate_clips: true,
    generate_transcript: true,
    generate_captions: true,
    detect_moments: true,
  });

  const uploadVideo = useUploadVideo();
  const processVideo = useProcessVideo();
  const navigate = useNavigate();

  const handleFile = useCallback((f: File) => {
    const validation = validateVideoFile(f);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    setFile(f);
    if (!title) setTitle(sanitizeFilename(f.name.replace(/\.[^/.]+$/, "")));
  }, [title]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Selecione um arquivo de vídeo");
      return;
    }
    if (!title.trim()) {
      toast.error("Informe um título");
      return;
    }

    try {
      const video = await uploadVideo.mutateAsync({
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        language,
        category: category.trim() || undefined,
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      });

      toast.success("Vídeo enviado! Iniciando processamento...");

      await processVideo.mutateAsync({ videoId: video.id, options });

      toast.success("Processamento iniciado!");
      navigate(`/dashboard/videos/${video.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar vídeo");
    }
  };

  const isLoading = uploadVideo.isPending || processVideo.isPending;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Upload de Vídeo</h1>
        <p className="text-sm text-muted-foreground">Envie um vídeo para processar com IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-foreground bg-accent" : file ? "border-foreground/40 bg-accent/50" : "border-border hover:border-muted-foreground"
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="w-16 h-16 rounded-2xl bg-accent border border-border flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-muted-foreground" />
            </div>
            {file ? (
              <>
                <h3 className="font-bold text-lg mb-1">{file.name}</h3>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-2">Arraste e solte seu vídeo aqui</h3>
                <p className="text-sm text-muted-foreground mb-4">MP4, MOV, AVI, MKV ou WebM • Máximo 5GB</p>
                <Button variant="outline" type="button">Selecionar arquivo</Button>
              </>
            )}
          </div>

          {/* Metadata */}
          <div className="venus-card p-6 space-y-4">
            <h3 className="font-bold">Metadados do vídeo</h3>
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do vídeo" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do conteúdo" className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Idioma</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="pt" className="mt-1" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Podcast, Tutorial..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, vendas, tecnologia" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Processing options */}
        <div className="space-y-4">
          <div className="venus-card p-6">
            <h3 className="font-bold mb-4">Opções de processamento</h3>
            <div className="space-y-3">
              {[
                { key: "generate_clips" as const, icon: Sparkles, label: "Gerar clips", desc: "AI detecta melhores momentos" },
                { key: "generate_transcript" as const, icon: Film, label: "Gerar transcrição", desc: "Texto completo do áudio" },
                { key: "generate_captions" as const, icon: Subtitles, label: "Gerar legendas", desc: "Legendas automáticas" },
                { key: "detect_moments" as const, icon: Search, label: "Detectar momentos", desc: "Análise de viralidade" },
              ].map((opt) => (
                <label key={opt.key} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options[opt.key]}
                    onChange={(e) => setOptions({ ...options, [opt.key]: e.target.checked })}
                    className="mt-1 accent-foreground"
                  />
                  <div>
                    <div className="text-sm font-medium flex items-center gap-2">
                      <opt.icon size={14} /> {opt.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="venus-card p-6">
            <h3 className="font-bold mb-2">Custo estimado</h3>
            <p className="text-sm text-muted-foreground mb-4">Baseado nas opções selecionadas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">~{Object.values(options).filter(Boolean).length * 12}</span>
              <span className="text-sm text-muted-foreground">créditos</span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <><Loader2 size={18} className="mr-2 animate-spin" /> Processando...</>
            ) : (
              <><Upload size={18} className="mr-2" /> Iniciar processamento</>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardUpload;
