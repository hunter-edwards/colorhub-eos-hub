'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type TrendPoint = { weekStart: string; value: number | null };
type IssuesPoint = { weekStart: string; opened: number; solved: number };

function formatWeek(w: string): string {
  const d = new Date(w + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatMoneyShort(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

const tooltipStyle = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 11,
  padding: '6px 10px',
  backgroundColor: 'var(--popover)',
};

const commonAxis = {
  tick: { fontSize: 10, fill: 'var(--muted-foreground)' },
  axisLine: false as const,
  tickLine: false as const,
};

// ── Revenue trend ────────────────────────────────────────────

function RevenueTrend({ data, goal }: { data: TrendPoint[]; goal: number | null }) {
  const chart = data.map((d) => ({ week: formatWeek(d.weekStart), value: d.value }));
  return (
    <TrendCard
      title="Weekly Revenue"
      subtitle="Last 13 weeks · Knack-derived"
      accent="cyan"
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="week" {...commonAxis} />
          <YAxis
            {...commonAxis}
            width={40}
            tickFormatter={(v) => formatMoneyShort(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={tooltipStyle}
            formatter={(v) => [formatMoneyShort(Number(v)), 'Revenue']}
            labelFormatter={(l) => `Week of ${l}`}
          />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{ value: `Goal: ${formatMoneyShort(goal)}`, position: 'right', fontSize: 9, fill: 'var(--muted-foreground)' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0891b2"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#0891b2', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#0891b2', strokeWidth: 2, stroke: 'var(--background)' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </TrendCard>
  );
}

// ── On-Time Delivery % trend ────────────────────────────────

function OnTimeTrend({ data, goal }: { data: TrendPoint[]; goal: number | null }) {
  const chart = data.map((d) => ({ week: formatWeek(d.weekStart), value: d.value }));
  return (
    <TrendCard
      title="On-Time Delivery %"
      subtitle="Last 13 weeks · green band = goal met"
      accent="violet"
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="week" {...commonAxis} />
          <YAxis
            {...commonAxis}
            domain={[0, 100]}
            width={32}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={tooltipStyle}
            formatter={(v) => [`${Number(v)}%`, 'On-time']}
            labelFormatter={(l) => `Week of ${l}`}
          />
          {goal != null && (
            <>
              <ReferenceArea
                y1={goal}
                y2={100}
                fill="#10b981"
                fillOpacity={0.06}
              />
              <ReferenceLine
                y={goal}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeOpacity={0.7}
                label={{ value: `${goal}%`, position: 'right', fontSize: 9, fill: '#10b981' }}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#9333ea"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#9333ea', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#9333ea', strokeWidth: 2, stroke: 'var(--background)' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </TrendCard>
  );
}

// ── Jobs Completed per week ──────────────────────────────────

function JobsCompletedTrend({ data, goal }: { data: TrendPoint[]; goal: number | null }) {
  const chart = data.map((d) => ({ week: formatWeek(d.weekStart), value: d.value ?? 0 }));
  return (
    <TrendCard
      title="Jobs Completed / week"
      subtitle="Last 13 weeks · throughput"
      accent="emerald"
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="week" {...commonAxis} />
          <YAxis {...commonAxis} width={28} />
          <Tooltip
            cursor={{ fill: 'var(--accent)', opacity: 0.3 }}
            contentStyle={tooltipStyle}
            formatter={(v) => [Number(v), 'Jobs']}
            labelFormatter={(l) => `Week of ${l}`}
          />
          {goal != null && (
            <ReferenceLine
              y={goal}
              stroke="var(--muted-foreground)"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{ value: `Goal: ${goal}`, position: 'right', fontSize: 9, fill: 'var(--muted-foreground)' }}
            />
          )}
          <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </TrendCard>
  );
}

// ── Issues: opened vs solved ─────────────────────────────────

function IssuesTrend({ data }: { data: IssuesPoint[] }) {
  const chart = data.map((d) => ({
    week: formatWeek(d.weekStart),
    opened: d.opened,
    solved: d.solved,
  }));
  const totalOpened = data.reduce((s, d) => s + d.opened, 0);
  const totalSolved = data.reduce((s, d) => s + d.solved, 0);
  const netDelta = totalSolved - totalOpened;

  return (
    <TrendCard
      title="Issues: opened vs solved"
      subtitle={`Last 13 weeks · net ${netDelta >= 0 ? '+' : ''}${netDelta}`}
      accent="amber"
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chart} margin={{ top: 8, right: 12, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="week" {...commonAxis} />
          <YAxis {...commonAxis} width={28} />
          <Tooltip
            cursor={{ fill: 'var(--accent)', opacity: 0.3 }}
            contentStyle={tooltipStyle}
            labelFormatter={(l) => `Week of ${l}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="opened" name="Opened" fill="#f97316" radius={[3, 3, 0, 0]} />
          <Bar dataKey="solved" name="Solved" fill="#10b981" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </TrendCard>
  );
}

// ── Trend card wrapper ───────────────────────────────────────

function TrendCard({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: 'cyan' | 'violet' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const accentDot =
    accent === 'cyan'
      ? 'bg-cyan-500'
      : accent === 'violet'
        ? 'bg-violet-500'
        : accent === 'emerald'
          ? 'bg-emerald-500'
          : 'bg-amber-500';
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2.5">
        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${accentDot}`} />
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="-mx-2">{children}</div>
    </div>
  );
}

// ── Public component ─────────────────────────────────────────

export type DashboardTrendsProps = {
  revenueTrend: TrendPoint[];
  revenueGoal: number | null;
  onTimeTrend: TrendPoint[];
  onTimeGoal: number | null;
  jobsTrend: TrendPoint[];
  jobsGoal: number | null;
  issuesTrend: IssuesPoint[];
};

export function DashboardTrends(props: DashboardTrendsProps) {
  return (
    <>
      <RevenueTrend data={props.revenueTrend} goal={props.revenueGoal} />
      <OnTimeTrend data={props.onTimeTrend} goal={props.onTimeGoal} />
      <JobsCompletedTrend data={props.jobsTrend} goal={props.jobsGoal} />
      <IssuesTrend data={props.issuesTrend} />
    </>
  );
}
