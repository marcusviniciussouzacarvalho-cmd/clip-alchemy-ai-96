import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Video, Scissors, CreditCard, TrendingUp, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [profilesRes, videosRes, clipsRes, jobsRes, creditsRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at"),
        supabase.from("videos").select("id, created_at, status"),
        supabase.from("clips").select("id, created_at"),
        supabase.from("processing_jobs").select("id, status, created_at"),
        supabase.from("credits").select("balance, total_used"),
      ]);

      const profiles = profilesRes.data || [];
      const videos = videosRes.data || [];
      const clips = clipsRes.data || [];
      const jobs = jobsRes.data || [];
      const credits = creditsRes.data || [];

      const today = new Date().toISOString().slice(0, 10);
      const videosToday = videos.filter((v) => v.created_at.startsWith(today)).length;
      const usersToday = profiles.filter((p) => p.created_at.startsWith(today)).length;
      const totalCreditsUsed = credits.reduce((sum, c) => sum + (c.total_used || 0), 0);

      // Last 7 days chart
      const days: Record<string, { videos: number; clips: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { videos: 0, clips: 0 };
      }
      videos.forEach((v) => { const k = v.created_at.slice(0, 10); if (days[k]) days[k].videos++; });
      clips.forEach((c) => { const k = c.created_at.slice(0, 10); if (days[k]) days[k].clips++; });

      const chartData = Object.entries(days).map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        ...counts,
      }));

      return {
        totalUsers: profiles.length,
        totalVideos: videos.length,
        totalClips: clips.length,
        totalJobs: jobs.length,
        failedJobs: jobs.filter((j) => j.status === "failed").length,
        videosToday,
        usersToday,
        totalCreditsUsed,
        chartData,
      };
    },
  });
}

const AdminAnalytics = () => {
  const { data: stats, isLoading } = useAdminAnalytics();

  const cards = [
    { icon: Users, label: "Total usuários", value: stats?.totalUsers ?? 0 },
    { icon: Video, label: "Total vídeos", value: stats?.totalVideos ?? 0 },
    { icon: Scissors, label: "Total clips", value: stats?.totalClips ?? 0 },
    { icon: Activity, label: "Jobs com erro", value: stats?.failedJobs ?? 0 },
    { icon: Video, label: "Vídeos hoje", value: stats?.videosToday ?? 0 },
    { icon: Users, label: "Usuários hoje", value: stats?.usersToday ?? 0 },
    { icon: CreditCard, label: "Créditos usados", value: stats?.totalCreditsUsed ?? 0 },
    { icon: Activity, label: "Total jobs", value: stats?.totalJobs ?? 0 },
  ];

  return (
    <DashboardLayout>
      <AdminLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="venus-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <c.icon size={14} className="text-muted-foreground" />
                <TrendingUp size={10} className="text-muted-foreground/30" />
              </div>
              <div className="text-xl font-extrabold tabular-nums">
                {isLoading ? <Skeleton className="h-6 w-10" /> : String(c.value)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{c.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="venus-card p-5">
          <h3 className="font-bold text-sm mb-4">Atividade dos últimos 7 dias</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="videos" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} name="Vídeos" />
                <Bar dataKey="clips" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Clips" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
