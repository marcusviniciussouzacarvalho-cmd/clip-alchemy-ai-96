import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Palette, Type } from "lucide-react";

const DashboardBrandKit = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="text-2xl font-extrabold mb-1">Brand Kit</h1>
      <p className="text-sm text-muted-foreground">Defina sua identidade visual para os clips</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Logo */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Upload size={16} /> Logo</h3>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent border border-border mx-auto mb-4 flex items-center justify-center">
            <Upload size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Faça upload do seu logo</p>
          <Button variant="outline" size="sm">Selecionar arquivo</Button>
        </div>
      </div>

      {/* Colors */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Palette size={16} /> Cores</h3>
        <div className="space-y-4">
          <div>
            <Label>Cor primária</Label>
            <div className="flex gap-2 mt-1">
              <div className="w-10 h-10 rounded-lg bg-foreground border border-border" />
              <Input defaultValue="#FFFFFF" className="flex-1" />
            </div>
          </div>
          <div>
            <Label>Cor secundária</Label>
            <div className="flex gap-2 mt-1">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border" />
              <Input defaultValue="#555555" className="flex-1" />
            </div>
          </div>
          <div>
            <Label>Cor de destaque</Label>
            <div className="flex gap-2 mt-1">
              <div className="w-10 h-10 rounded-lg bg-accent border border-border" />
              <Input defaultValue="#1A1A1A" className="flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Type size={16} /> Tipografia</h3>
        <div className="space-y-4">
          <div>
            <Label>Fonte de legendas</Label>
            <Input defaultValue="Inter" className="mt-1" />
          </div>
          <div>
            <Label>Peso da fonte</Label>
            <Input defaultValue="Bold" className="mt-1" />
          </div>
          <div>
            <Label>Tamanho</Label>
            <Input defaultValue="24px" className="mt-1" />
          </div>
        </div>
      </div>

      {/* Caption style */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4">Estilo de legenda</h3>
        <div className="grid grid-cols-2 gap-3">
          {["Clássico", "Bold", "Outline", "Sombra"].map((style) => (
            <button
              key={style}
              className="p-4 rounded-lg border border-border hover:bg-accent transition-colors text-center"
            >
              <div className="text-lg font-bold mb-1">Aa</div>
              <div className="text-xs text-muted-foreground">{style}</div>
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-6">
      <Button size="lg">Salvar Brand Kit</Button>
    </div>
  </DashboardLayout>
);

export default DashboardBrandKit;
