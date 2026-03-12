import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Scissors, Search, Filter, Clock, Play, Loader2 } from "lucide-react";
import { useState } from "react";
import { useVideos, useClips } from "@/hooks/use-pipeline";

const DashboardLibrary = () => {
  const [tab, setTab] = useState<"videos" | "clips">("videos");
  const { data: videos, isLoading: videosLoading } = useVideos();
  const { data: clips, isLoading: clipsLoading } = useClips();
  const [search, setSearch] = useState("");

  const filteredVideos = videos?.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filteredClips = clips?.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const isLoading = tab === "videos" ? videosLoading : clipsLoading;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Biblioteca</h1>
          <p className="text-sm text-muted-foreground">Seus vídeos e clips</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-accent rounded-lg w-fit">
        <button
          onClick={() => setTab("videos")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "videos" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Video size={14} className="inline mr-1.5" /> Vídeos ({videos?.length || 0})
        </button>
        <button
          onClick={() => setTab("clips")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "clips" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Scissors size={14} className="inline mr-1.5" /> Clips ({clips?.length || 0})
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-muted-foreground" /></div>
      ) : tab === "videos" ? (
        filteredVideos.length === 0 ? (
          <div className="venus-card p-12 text-center">
            <Video size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-bold text-lg mb-2">Nenhum vídeo</h3>
            <p className="text-sm text-muted-foreground">Faça upload do seu primeiro vídeo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVideos.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 venus-card hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <Play size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{v.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      {v.category && <span>{v.category}</span>}
                      <span>{new Date(v.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  v.status === "ready" ? "bg-foreground text-background" :
                  v.status === "processing" ? "bg-accent text-muted-foreground animate-pulse-subtle" :
                  v.status === "error" ? "bg-destructive text-destructive-foreground" :
                  "bg-accent text-muted-foreground"
                }`}>
                  {v.status === "ready" ? "Pronto" : v.status === "processing" ? "Processando" : v.status === "error" ? "Erro" : "Enviado"}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredClips.length === 0 ? (
          <div className="venus-card p-12 text-center">
            <Scissors size={40} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-bold text-lg mb-2">Nenhum clip</h3>
            <p className="text-sm text-muted-foreground">Clips serão gerados após o processamento de vídeos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClips.map((clip) => (
              <div key={clip.id} className="venus-card overflow-hidden">
                <div className="aspect-video bg-accent flex items-center justify-center">
                  <Play size={24} className="text-muted-foreground" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold truncate">{clip.title}</h3>
                  <div className="text-xs text-muted-foreground mt-1">
                    Score: {clip.virality_score || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default DashboardLibrary;
