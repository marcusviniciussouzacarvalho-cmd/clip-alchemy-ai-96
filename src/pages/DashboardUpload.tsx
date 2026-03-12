import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Film, Sparkles, Subtitles, Search } from "lucide-react";
import { useState } from "react";

const DashboardUpload = () => {
  const [dragging, setDragging] = useState(false);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Upload de Vídeo</h1>
        <p className="text-sm text-muted-foreground">Envie um vídeo para processar com IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload area */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
              dragging ? "border-foreground bg-accent" : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-accent border border-border flex items-center justify-center mx-auto mb-4">
              <Upload size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Arraste e solte seu vídeo aqui</h3>
            <p className="text-sm text-muted-foreground mb-4">MP4, MOV, AVI, MKV ou WebM • Máximo 5GB</p>
            <Button variant="outline">Selecionar arquivo</Button>
          </div>

          {/* Metadata */}
          <div className="venus-card p-6 space-y-4">
            <h3 className="font-bold">Metadados do vídeo</h3>
            <div>
              <Label>Título</Label>
              <Input placeholder="Nome do vídeo" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea placeholder="Descrição do conteúdo" className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Idioma</Label>
                <Input placeholder="Português" className="mt-1" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input placeholder="Podcast, Tutorial..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <Input placeholder="marketing, vendas, tecnologia" className="mt-1" />
            </div>
          </div>
        </div>

        {/* Processing options */}
        <div className="space-y-4">
          <div className="venus-card p-6">
            <h3 className="font-bold mb-4">Opções de processamento</h3>
            <div className="space-y-3">
              {[
                { icon: Sparkles, label: "Gerar clips", desc: "AI detecta melhores momentos" },
                { icon: Film, label: "Gerar transcrição", desc: "Texto completo do áudio" },
                { icon: Subtitles, label: "Gerar legendas", desc: "Legendas automáticas" },
                { icon: Search, label: "Detectar momentos", desc: "Análise de viralidade" },
              ].map((opt) => (
                <label key={opt.label} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-1 accent-foreground" />
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
            <p className="text-sm text-muted-foreground mb-4">Baseado na duração do vídeo</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold">~50</span>
              <span className="text-sm text-muted-foreground">créditos</span>
            </div>
          </div>

          <Button className="w-full" size="lg">
            <Upload size={18} className="mr-2" />
            Iniciar processamento
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardUpload;
