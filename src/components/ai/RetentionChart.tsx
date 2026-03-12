import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRetentionCurve } from "@/hooks/use-ai-content";
import { TrendingDown, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface RetentionChartProps {
  transcript: string;
  durationSeconds: number;
}

export const RetentionChart = ({ transcript, durationSeconds }: RetentionChartProps) => {
  const [data, setData] = useState<any>(null);
  const mutation = useRetentionCurve();

  const generate = () => {
    mutation.mutate({ transcript, duration_seconds: durationSeconds }, {
      onSuccess: (d) => setData(d),
      onError: (err: any) => toast.error(err.message),
    });
  };

  const maxRetention = data?.points ? Math.max(...data.points.map((p: any) => p.retention)) : 100;

  return (
    <div className="venus-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingDown size={12} /> Retenção Estimada
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={generate} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
          Analisar
        </Button>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Chart */}
          <div className="relative h-32 bg-accent rounded-lg overflow-hidden p-3">
            <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line key={y} x1="0" y1={50 - (y / 100) * 50} x2="100" y2={50 - (y / 100) * 50} stroke="currentColor" className="text-border" strokeWidth="0.3" />
              ))}
              {/* Retention curve */}
              {data.points && data.points.length > 1 && (
                <>
                  <defs>
                    <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" className="text-foreground" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="currentColor" className="text-foreground" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M ${data.points.map((p: any) => `${p.time_percent} ${50 - (p.retention / maxRetention) * 48}`).join(' L ')} L ${data.points[data.points.length - 1].time_percent} 50 L 0 50 Z`}
                    fill="url(#retentionGrad)"
                  />
                  <path
                    d={`M ${data.points.map((p: any) => `${p.time_percent} ${50 - (p.retention / maxRetention) * 48}`).join(' L ')}`}
                    fill="none"
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="0.8"
                  />
                  {/* Points */}
                  {data.points.map((p: any, i: number) => (
                    <circle key={i} cx={p.time_percent} cy={50 - (p.retention / maxRetention) * 48} r="1" fill="currentColor" className="text-foreground" />
                  ))}
                </>
              )}
              {/* Drop markers */}
              {data.drop_points?.map((dp: any, i: number) => (
                <line key={`d${i}`} x1={dp.time_percent} y1="0" x2={dp.time_percent} y2="50" stroke="currentColor" className="text-destructive" strokeWidth="0.4" strokeDasharray="1,1" />
              ))}
              {/* Peak markers */}
              {data.peak_points?.map((pp: any, i: number) => (
                <line key={`p${i}`} x1={pp.time_percent} y1="0" x2={pp.time_percent} y2="50" stroke="currentColor" className="text-emerald-400" strokeWidth="0.4" strokeDasharray="1,1" />
              ))}
            </svg>

            {/* Labels */}
            <div className="absolute bottom-1 left-3 text-[9px] text-muted-foreground">0:00</div>
            <div className="absolute bottom-1 right-3 text-[9px] text-muted-foreground">{Math.floor(durationSeconds / 60)}:{String(Math.floor(durationSeconds % 60)).padStart(2, '0')}</div>
          </div>

          {/* Average */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] text-muted-foreground">Retenção média</span>
            <span className="text-sm font-bold tabular-nums">{data.average_retention}%</span>
          </div>

          {/* Drop & Peak points */}
          {data.drop_points?.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1">
                <TrendingDown size={10} /> Pontos de queda
              </span>
              <ul className="mt-1 space-y-0.5">
                {data.drop_points.map((dp: any, i: number) => (
                  <li key={i} className="text-[11px] text-muted-foreground">· {dp.time_percent}% — {dp.reason}</li>
                ))}
              </ul>
            </div>
          )}
          {data.peak_points?.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <TrendingUp size={10} /> Picos de interesse
              </span>
              <ul className="mt-1 space-y-0.5">
                {data.peak_points.map((pp: any, i: number) => (
                  <li key={i} className="text-[11px] text-muted-foreground">· {pp.time_percent}% — {pp.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {!data && !mutation.isPending && (
        <p className="text-xs text-muted-foreground text-center py-2">Analise a curva de retenção estimada</p>
      )}
    </div>
  );
};
