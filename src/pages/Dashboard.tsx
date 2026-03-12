import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Video, Scissors, Clock, CreditCard, ArrowRight } from "lucide-react";

const stats = [
  { icon: Video, label: "Vídeos enviados", value: "12" },
  { icon: Scissors, label: "Clips gerados", value: "47" },
  { icon: CreditCard, label: "Créditos disponíveis", value: "850" },
  { icon: Clock, label: "Minutos processados", value: "234" },
];

const recentActivity = [
  { title: "video_podcast_ep42.mp4", status: "Processando", time: "2 min atrás" },
  { title: "entrevista_ceo.mp4", status: "Pronto", time: "1h atrás", clips: 8 },
  { title: "tutorial_react.mp4", status: "Pronto", time: "3h atrás", clips: 5 },
  { title: "webinar_marketing.mp4", status: "Pronto", time: "1 dia atrás", clips: 12 },
];

const Dashboard = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Bem-vindo de volta ao VenusClip</p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="p-4 rounded-xl venus-border bg-background">
          <div className="flex items-center gap-2 mb-2">
            <s.icon size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
          <div className="text-2xl font-bold font-display">{s.value}</div>
        </div>
      ))}
    </div>

    {/* Quick actions */}
    <div className="flex gap-3 mb-8">
      <Button variant="default" asChild>
        <Link to="/dashboard/upload">
          <Upload size={16} className="mr-2" />
          Upload de vídeo
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/dashboard/clips">
          <Scissors size={16} className="mr-2" />
          Ver clips
        </Link>
      </Button>
    </div>

    {/* Recent activity */}
    <div>
      <h2 className="font-semibold mb-4">Atividade recente</h2>
      <div className="space-y-2">
        {recentActivity.map((a) => (
          <div key={a.title} className="flex items-center justify-between p-4 rounded-xl venus-border bg-background hover:bg-surface transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                <Video size={14} />
              </div>
              <div>
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {a.clips && <span className="text-xs text-muted-foreground">{a.clips} clips</span>}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.status === "Processando"
                  ? "bg-muted text-muted-foreground animate-pulse-subtle"
                  : "bg-foreground text-background"
              }`}>
                {a.status}
              </span>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default Dashboard;
