'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type RockStatus = {
  status: 'on_track' | 'off_track' | 'done';
  count: number;
};

const STATUS_COLORS: Record<string, string> = {
  on_track: '#16a34a', // green-600
  off_track: '#dc2626', // red-600
  done: '#2563eb', // blue-600
};

const STATUS_LABELS: Record<string, string> = {
  on_track: 'On Track',
  off_track: 'Off Track',
  done: 'Done',
};

export function RockChart({ rocks }: { rocks: RockStatus[] }) {
  const total = rocks.reduce((sum, r) => sum + r.count, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">No rocks to display.</p>
    );
  }

  const data = rocks
    .filter((r) => r.count > 0)
    .map((r) => ({
      name: STATUS_LABELS[r.status],
      value: r.count,
      color: STATUS_COLORS[r.status],
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) =>
            `${name}: ${value} (${Math.round((value / total) * 100)}%)`
          }
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${value} (${Math.round((Number(value) / total) * 100)}%)`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
