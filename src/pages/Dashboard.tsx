import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, Video, Scissors, Clock, CreditCard, ArrowRight, TrendingUp, BarChart3 } from "lucide-react";

const stats = [
  { icon: Video, label: "Vídeos enviados", value: "12", change: "+3" },
  { icon: Scissors, label: "Clips gerados", value: "47", change: "+12" },
  { icon: CreditCard, label: "Créditos disponíveis", value: "850", change: "-150" },
  { icon: Clock, label: "Minutos processados", value: "234", change: "+45" },
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
      <h1 className="text-2xl font-extrabold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Bem-vindo de volta ao VenusClip</p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="p-5 rounded-xl venus-card">
          <div className="flex items-center justify-between mb-3">
            <s.icon size={18} className="text-muted-foreground" />
            <span className={`text-xs font-medium ${s.change.startsWith('+') ? 'text-emerald-400' : 'text-muted-foreground'}`}>{s.change}</span>
          </div>
          <div className="text-2xl font-extrabold font-display">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
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
      <Button variant="outline" asChild>
        <Link to="/dashboard/analytics">
          <BarChart3 size={16} className="mr-2" />
          Analytics
        </Link>
      </Button>
    </div>

    {/* Recent activity */}
    <div>
      <h2 className="font-bold mb-4">Atividade recente</h2>
      <div className="space-y-2">
        {recentActivity.map((a) => (
          <div key={a.title} className="flex items-center justify-between p-4 rounded-xl venus-card hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent border border-border flex items-center justify-center">
                <Video size={16} />
              </div>
              <div>
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {a.clips && <span className="text-xs text-muted-foreground">{a.clips} clips</span>}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                a.status === "Processando"
                  ? "bg-accent text-muted-foreground animate-pulse-subtle"
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
