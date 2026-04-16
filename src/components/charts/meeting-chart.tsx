'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Meeting = {
  date: string;
  rating: number;
};

function ratingColor(rating: number): string {
  if (rating >= 8) return '#16a34a'; // green-600
  if (rating >= 6) return '#ca8a04'; // yellow-600
  return '#dc2626'; // red-600
}

export function MeetingChart({ meetings }: { meetings: Meeting[] }) {
  const data = meetings
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({
      date: formatDate(m.date),
      rating: m.rating,
      fill: ratingColor(m.rating),
    }));

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No meeting ratings to display.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`${value}/10`, 'Rating']}
          labelFormatter={(label) => `Meeting: ${label}`}
        />
        <Bar dataKey="rating" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
