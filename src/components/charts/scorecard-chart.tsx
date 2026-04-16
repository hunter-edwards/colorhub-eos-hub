'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600
  '#16a34a', // green-600
  '#d97706', // amber-600
  '#9333ea', // purple-600
  '#0891b2', // cyan-600
  '#e11d48', // rose-600
  '#4f46e5', // indigo-600
  '#ca8a04', // yellow-600
  '#0d9488', // teal-600
];

type Entry = {
  metricId: string;
  metricName: string;
  weekStart: string;
  value: number | null;
};

export function ScorecardChart({ entries }: { entries: Entry[] }) {
  // Get unique weeks sorted chronologically and unique metrics
  const weeks = [...new Set(entries.map((e) => e.weekStart))].sort();
  const metricIds = [...new Set(entries.map((e) => e.metricId))];
  const metricNames = new Map(
    entries.map((e) => [e.metricId, e.metricName])
  );

  // Build data points: one object per week with a key per metric
  const data = weeks.map((week) => {
    const point: Record<string, string | number | null> = {
      week,
      label: formatWeek(week),
    };
    for (const id of metricIds) {
      const entry = entries.find(
        (e) => e.weekStart === week && e.metricId === id
      );
      point[id] = entry?.value ?? null;
    }
    return point;
  });

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scorecard data to display.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => [
            value,
            metricNames.get(String(name)) ?? String(name),
          ]}
          labelFormatter={(label) => `Week of ${label}`}
        />
        <Legend
          formatter={(value: string) => metricNames.get(value) ?? value}
        />
        {metricIds.map((id, i) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
