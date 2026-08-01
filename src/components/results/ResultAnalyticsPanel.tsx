import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/shared/DataTable';
import type { ResultStats } from '@/lib/results/types';

const COLORS = ['hsl(var(--primary))', '#0ea5e9', '#6366f1', '#22c55e', '#f59e0b', '#f43f5e', '#a855f7', '#64748b'];

export function ResultAnalyticsPanel({ stats }: { stats: ResultStats }) {
  const subjectCols: Column<ResultStats['subjectPerformance'][number]>[] = useMemo(() => [
    { key: 'subject', header: 'Subject', cell: r => <span className="font-medium">{r.subject}</span> },
    { key: 'avg', header: 'Average %', cell: r => r.average.toFixed(2) },
    { key: 'high', header: 'Highest %', cell: r => r.highest.toFixed(2) },
    { key: 'low', header: 'Lowest %', cell: r => r.lowest.toFixed(2) },
    { key: 'pass', header: 'Pass %', cell: r => `${r.passPercent}%` },
  ], []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Grade Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="grade" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">GPA Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.gpaDistribution} dataKey="count" nameKey="band" outerRadius={80} label>
                  {stats.gpaDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Subject-wise Performance</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={subjectCols}
            rows={stats.subjectPerformance}
            rowKey={r => r.subject}
            emptyTitle="No subject data"
          />
        </CardContent>
      </Card>
    </div>
  );
}
