import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { progressFor } from '@/lib/results/api';

export function ProgressReport({ studentId }: { studentId: string }) {
  const points = useMemo(() => progressFor(studentId), [studentId]);
  if (!points.length) {
    return <EmptyState icon={TrendingUp} title="No published results yet" description="Progress charts appear once results are published." />;
  }
  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const subjects = Array.from(new Set(points.flatMap(p => p.subjects.map(s => s.subject))));
  const subjectTrend = subjects.map(sub => ({
    subject: sub,
    previous: previous?.subjects.find(s => s.subject === sub)?.percentage ?? 0,
    current: latest.subjects.find(s => s.subject === sub)?.percentage ?? 0,
  }));

  const Delta = ({ v }: { v: number }) => (
    <span className={`inline-flex items-center gap-1 text-xs ${v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-muted-foreground'}`}>
      {v > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : v < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
      {v > 0 ? '+' : ''}{v.toFixed(2)}%
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Previous Exam</p><p className="text-sm font-medium">{previous?.examName ?? '—'}</p><p className="text-lg tabular-nums">{previous ? `${previous.percentage.toFixed(2)}%` : '—'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Current Exam</p><p className="text-sm font-medium">{latest.examName}</p><p className="text-lg tabular-nums">{latest.percentage.toFixed(2)}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Change</p><p className="text-lg"><Delta v={latest.delta} /></p><Badge variant="outline" className="mt-1">{latest.delta >= 0 ? 'Improvement' : 'Decline'}</Badge></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Attendance</p><p className="text-lg tabular-nums">{latest.attendance}%</p><p className="text-[11px] text-muted-foreground">Grade {latest.grade} · GPA {latest.gpa.toFixed(2)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Performance Over Time</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="examName" fontSize={10} tickFormatter={v => String(v).slice(0, 14)} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="percentage" name="Percentage" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Subject Trend</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectTrend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="subject" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="previous" name="Previous" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="Current" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
