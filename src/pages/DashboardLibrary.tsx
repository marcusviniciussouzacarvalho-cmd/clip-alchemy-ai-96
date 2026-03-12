import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Scissors, Search, Filter, Clock, Play } from "lucide-react";
import { useState } from "react";

const mockVideos = [
  { id: 1, title: "Podcast Ep. 42 - Marketing Digital", duration: "45:30", clips: 8, status: "Pronto", date: "12 Mar 2026", category: "Podcast" },
  { id: 2, title: "Entrevista com CEO da TechCo", duration: "32:15", clips: 5, status: "Pronto", date: "11 Mar 2026", category: "Entrevista" },
  { id: 3, title: "Tutorial React Avançado", duration: "1:12:00", clips: 12, status: "Processando", date: "10 Mar 2026", category: "Tutorial" },
  { id: 4, title: "Webinar de Vendas B2B", duration: "58:45", clips: 10, status: "Pronto", date: "9 Mar 2026", category: "Webinar" },
  { id: 5, title: "Live de Q&A - Março", duration: "1:30:00", clips: 0, status: "Na fila", date: "8 Mar 2026", category: "Live" },
];

const DashboardLibrary = () => {
  const [tab, setTab] = useState<"videos" | "clips">("videos");

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Biblioteca</h1>
          <p className="text-sm text-muted-foreground">Seus vídeos e clips</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-accent rounded-lg w-fit">
        <button
          onClick={() => setTab("videos")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "videos" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Video size={14} className="inline mr-1.5" /> Vídeos
        </button>
        <button
          onClick={() => setTab("clips")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "clips" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Scissors size={14} className="inline mr-1.5" /> Clips
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter size={14} className="mr-1" /> Filtros
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {mockVideos.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-4 venus-card hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-20 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Play size={16} className="text-muted-foreground" />
              </div>
              <div>
                <div className="text-sm font-bold">{v.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span><Clock size={10} className="inline mr-0.5" /> {v.duration}</span>
                  <span>{v.category}</span>
                  <span>{v.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{v.clips} clips</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                v.status === "Pronto" ? "bg-foreground text-background" :
                v.status === "Processando" ? "bg-accent text-muted-foreground animate-pulse-subtle" :
                "bg-accent text-muted-foreground"
              }`}>
                {v.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardLibrary;
