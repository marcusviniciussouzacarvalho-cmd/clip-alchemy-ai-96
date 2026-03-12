import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Users, Video, Scissors, Activity, AlertCircle, Clock } from "lucide-react";

const platformStats = [
  { icon: Users, label: "Usuários totais", value: "2.341" },
  { icon: Video, label: "Vídeos processados", value: "12.847" },
  { icon: Scissors, label: "Clips gerados", value: "58.392" },
  { icon: Activity, label: "Jobs ativos", value: "23" },
];

const recentLogs = [
  { level: "info", msg: "Job #4821 completed - 8 clips generated", time: "14:32:01" },
  { level: "info", msg: "User signup: ana.silva@email.com", time: "14:30:45" },
  { level: "warn", msg: "High memory usage on worker-3", time: "14:28:12" },
  { level: "info", msg: "Job #4820 started - video_podcast.mp4", time: "14:25:00" },
  { level: "error", msg: "Job #4819 failed - transcription timeout", time: "14:20:33" },
  { level: "info", msg: "Credits purchased: user_123 - 500 credits", time: "14:15:00" },
];

const activeJobs = [
  { id: "#4821", video: "podcast_ep42.mp4", stage: "Gerando clips", progress: 75 },
  { id: "#4822", video: "interview.mp4", stage: "Transcrição", progress: 40 },
  { id: "#4823", video: "webinar.mp4", stage: "Upload", progress: 10 },
];

const DashboardAdmin = () => (
  <DashboardLayout>
    <div className="mb-8">
      <h1 className="text-2xl font-extrabold mb-1">Painel Admin</h1>
      <p className="text-sm text-muted-foreground">Monitoramento da plataforma</p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {platformStats.map((s) => (
        <div key={s.label} className="venus-card p-5">
          <s.icon size={18} className="text-muted-foreground mb-3" />
          <div className="text-2xl font-extrabold font-display">{s.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active jobs */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Activity size={16} /> Jobs ativos
        </h3>
        <div className="space-y-4">
          {activeJobs.map((j) => (
            <div key={j.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{j.id} - {j.video}</span>
                <span className="text-xs text-muted-foreground">{j.stage}</span>
              </div>
              <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${j.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System logs */}
      <div className="venus-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Clock size={16} /> Logs do sistema
        </h3>
        <div className="space-y-2 font-mono text-xs">
          {recentLogs.map((l, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground w-16 shrink-0">{l.time}</span>
              <span className={`w-10 shrink-0 font-bold uppercase ${
                l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-amber-400" : "text-muted-foreground"
              }`}>{l.level}</span>
              <span className="text-muted-foreground">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </DashboardLayout>
);

export default DashboardAdmin;
