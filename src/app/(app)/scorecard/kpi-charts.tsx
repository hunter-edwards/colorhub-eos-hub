'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChevronDown, TrendingUp, TrendingDown, Minus, ExternalLink, Info } from 'lucide-react';
import { getCompletedRunsForWeek, type DrilldownRun } from '@/server/knack-sync';
import { evaluateEntry } from '@/lib/scorecard-utils';

type Metric = {
  id: string;
  name: string;
  goal: string | null;
  comparator: 'gte' | 'lte' | 'eq' | 'range';
  unit: string | null;
};

type Entry = {
  metricId: string;
  weekStart: string;
  value: string | null;
};

/** KPI definitions with Knack field references and formulas. */
const KPI_DEFINITIONS: Record<string, {
  description: string;
  fields: string;
  formula: string;
  color: string;
  chartType: 'bar' | 'line';
  drilldown: boolean; // Whether clicking a bar/point shows individual runs
}> = {
  'Runs Completed': {
    description: 'Count of individual runs completed this week.',
    fields: 'field_2292 (dateSentToInvoicing)',
    formula: 'A run is "completed" when field_2292 has a valid date. Week = that date\'s ISO week (Mon–Sun). Result = count of runs completed in the week.',
    color: '#2563eb',
    chartType: 'bar',
    drilldown: true,
  },
  'Jobs Completed': {
    description: 'Count of parent jobs fully completed this week.',
    fields: 'field_2292 (dateSentToInvoicing), field_534 (parent job #), field_1589 (customer #), field_535 (part #)',
    formula: 'Group runs by customer + parent job. A job counts as completed when EVERY run (across every part) has field_2292 set. Week = MAX(field_2292) across the job\'s runs.',
    color: '#16a34a',
    chartType: 'bar',
    drilldown: true,
  },
  'Parent Jobs Invoiced': {
    description: 'Count of parent jobs fully invoiced this week.',
    fields: 'field_798 (invoiced flag), field_534 (parent job #), field_1589 (customer #), field_2292 (dateSentToInvoicing)',
    formula: 'Group runs by customer + parent job. A job counts as invoiced when ALL its runs have field_798 = "Yes". Week = MAX(field_2292) across the job\'s runs.',
    color: '#0d9488',
    chartType: 'bar',
    drilldown: true,
  },
  'Avg Days Order\u2192Complete': {
    description: 'Average calendar days from order to completion.',
    fields: 'field_969 (order received date), field_2292 (dateSentToInvoicing)',
    formula: 'For each run completed this week: days = field_2292 - field_969. Result = average across all runs. Lower is better.',
    color: '#d97706',
    chartType: 'line',
    drilldown: true,
  },
  'On-Time Delivery %': {
    description: 'Percentage of runs completed on or before the due date.',
    fields: 'field_972 (due/promise date), field_2292 (dateSentToInvoicing)',
    formula: 'For runs with a due date: on-time if field_2292 <= field_972. Result = (onTimeCount / totalWithDueDate) * 100.',
    color: '#9333ea',
    chartType: 'line',
    drilldown: true,
  },
  'Weekly Revenue': {
    description: 'Total revenue from runs completed this week.',
    fields: 'field_961 (revenue $), field_2292 (dateSentToInvoicing)',
    formula: 'Sum of field_961 (parsed from "$X,XXX.XX" format) for all runs with field_2292 in the week. ~70% fill rate on this field.',
    color: '#0891b2',
    chartType: 'bar',
    drilldown: true,
  },
};

const KPI_ORDER = [
  'Runs Completed',
  'Jobs Completed',
  'Parent Jobs Invoiced',
  'Weekly Revenue',
  'Avg Days Order\u2192Complete',
  'On-Time Delivery %',
];

// ── formatters ──────────────────────────────────────────────

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatValue(v: number | null, unit: string | null): string {
  if (v == null) return '—';
  if (unit === '$') {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${Math.round(v).toLocaleString()}`;
  }
  if (unit === '%') return `${v}%`;
  if (unit === 'days') return `${v}d`;
  return String(v);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}/${y.slice(2)}`;
}

function trendFromEntries(values: (number | null)[]): {
  delta: number | null;
  pctChange: number | null;
} {
  const nonNull = values.filter((v): v is number => v != null);
  if (nonNull.length < 2) return { delta: null, pctChange: null };
  const curr = nonNull[nonNull.length - 1];
  const prev = nonNull[nonNull.length - 2];
  const delta = curr - prev;
  const pctChange = prev !== 0 ? (delta / prev) * 100 : null;
  return { delta, pctChange };
}

// ── drill-down row ──────────────────────────────────────────

/**
 * Which columns to show in the drill-down for each KPI.
 * Every KPI gets the always-on trio (customer #, customer name, job #).
 * Then we add only the fields that actually feed into the metric's formula.
 */
type DrillColumn = 'completed' | 'ordered' | 'days' | 'due' | 'onTime' | 'revenue' | 'invoiced';

const METRIC_COLUMNS: Record<string, DrillColumn[]> = {
  'Runs Completed': ['completed'],
  'Jobs Completed': ['completed'],
  'Parent Jobs Invoiced': ['completed', 'invoiced'],
  'Avg Days Order\u2192Complete': ['ordered', 'completed', 'days'],
  'On-Time Delivery %': ['due', 'completed', 'onTime'],
  'Weekly Revenue': ['completed', 'revenue'],
};

function DrilldownTable({ runs, metricName }: { runs: DrilldownRun[]; metricName: string }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
        No runs completed in this week.
      </div>
    );
  }

  const cols = METRIC_COLUMNS[metricName] ?? ['completed'];
  const showRevenue = cols.includes('revenue');
  const totalRev = showRevenue ? runs.reduce((s, r) => s + r.revenue, 0) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{runs.length} runs</span>
        {showRevenue && (
          <span className="text-muted-foreground">
            Total revenue <span className="font-medium text-foreground">${totalRev.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </span>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Cust #</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Job #</th>
              {cols.includes('ordered') && <th className="px-3 py-2 font-medium">Ordered</th>}
              {cols.includes('completed') && <th className="px-3 py-2 font-medium">Completed</th>}
              {cols.includes('due') && <th className="px-3 py-2 font-medium">Due</th>}
              {cols.includes('days') && <th className="px-3 py-2 text-right font-medium">Days</th>}
              {cols.includes('onTime') && <th className="px-3 py-2 font-medium">On-time?</th>}
              {cols.includes('invoiced') && <th className="px-3 py-2 font-medium">Invoiced?</th>}
              {cols.includes('revenue') && <th className="px-3 py-2 text-right font-medium">Revenue</th>}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => {
              const jobLabel = r.parentJob && r.partNumber
                ? `${r.parentJob}-${r.partNumber}`
                : r.jobId || '—';
              return (
                <tr key={r.id} className="border-t border-border/40 hover:bg-accent/40">
                  <td className="px-3 py-2 font-mono text-[11px] tabular-nums">{r.customer || '—'}</td>
                  <td className="px-3 py-2 truncate max-w-[180px]" title={r.customerName}>
                    {r.customerName || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] tabular-nums">{jobLabel}</td>
                  {cols.includes('ordered') && (
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(r.orderDate)}</td>
                  )}
                  {cols.includes('completed') && (
                    <td className="px-3 py-2 tabular-nums">{formatDate(r.completionDate)}</td>
                  )}
                  {cols.includes('due') && (
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(r.dueDate)}</td>
                  )}
                  {cols.includes('days') && (
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {r.daysToComplete != null ? `${r.daysToComplete}d` : '—'}
                    </td>
                  )}
                  {cols.includes('onTime') && (
                    <td className="px-3 py-2">
                      {r.onTime === true && (
                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          On time
                        </span>
                      )}
                      {r.onTime === false && (
                        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                          Late
                        </span>
                      )}
                      {r.onTime == null && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  {cols.includes('invoiced') && (
                    <td className="px-3 py-2">
                      {r.invoiced ? (
                        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          No
                        </span>
                      )}
                    </td>
                  )}
                  {cols.includes('revenue') && (
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {r.revenue > 0 ? `$${r.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : <span className="text-muted-foreground">—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── KPI card ────────────────────────────────────────────────

function KPICard({
  metric,
  entries,
  weeks,
}: {
  metric: Metric;
  entries: Entry[];
  weeks: string[];
}) {
  const def = KPI_DEFINITIONS[metric.name];
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [runs, setRuns] = useState<DrilldownRun[] | null>(null);
  const [pending, startTransition] = useTransition();
  const [showDefinition, setShowDefinition] = useState(false);

  const chartData = useMemo(() => {
    return [...weeks].reverse().map((w) => {
      const entry = entries.find((e) => e.metricId === metric.id && e.weekStart === w);
      return {
        week: formatWeek(w),
        weekStart: w,
        value: entry?.value != null ? Number(entry.value) : null,
      };
    });
  }, [entries, metric.id, weeks]);

  if (!def) return null;

  const values = chartData.map((d) => d.value);
  const currentValue = values[values.length - 1];
  const { delta, pctChange } = trendFromEntries(values);

  const goalValue = metric.goal != null ? Number(metric.goal) : null;
  const goalPrefix = metric.comparator === 'gte' ? '\u2265' : metric.comparator === 'lte' ? '\u2264' : '=';

  // Evaluate current week vs goal → color status
  const currentStatus =
    currentValue != null
      ? evaluateEntry(metric, currentValue)
      : null;

  function handleWeekClick(weekStart: string | undefined) {
    if (!weekStart) return;
    if (selectedWeek === weekStart) {
      setSelectedWeek(null);
      setRuns(null);
      return;
    }
    setSelectedWeek(weekStart);
    setRuns(null);
    startTransition(async () => {
      const result = await getCompletedRunsForWeek(weekStart);
      setRuns(result);
    });
  }

  // Bar.onClick receives the data point directly (not wrapped in activePayload).
  function handleBarClick(data: unknown) {
    const d = data as { weekStart?: string } | undefined;
    handleWeekClick(d?.weekStart);
  }

  // Custom dot for LineChart — clickable and visibly interactive.
  type DotProps = { cx?: number; cy?: number; payload?: { weekStart?: string }; index?: number };
  function ClickableDot(props: DotProps) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || payload?.weekStart == null) return <g />;
    const isSelected = payload.weekStart === selectedWeek;
    return (
      <g style={{ cursor: 'pointer' }} onClick={() => handleWeekClick(payload.weekStart)}>
        {/* Large invisible hit area */}
        <circle cx={cx} cy={cy} r={14} fill="transparent" />
        {/* Visible dot */}
        <circle
          cx={cx}
          cy={cy}
          r={isSelected ? 5 : 3.5}
          fill={def.color}
          stroke={isSelected ? 'var(--background)' : 'none'}
          strokeWidth={isSelected ? 2 : 0}
        />
      </g>
    );
  }

  const deltaColor =
    delta == null
      ? 'text-muted-foreground'
      : (metric.comparator === 'lte' ? -delta : delta) > 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : (metric.comparator === 'lte' ? -delta : delta) < 0
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-muted-foreground';

  const DeltaIcon =
    delta == null || delta === 0
      ? Minus
      : (metric.comparator === 'lte' ? -delta : delta) > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight">{metric.name}</h3>
            <button
              type="button"
              onClick={() => setShowDefinition((v) => !v)}
              className="rounded p-0.5 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
              title="Show formula"
              aria-label="Show formula"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{def.description}</p>
        </div>
        {goalValue != null && (
          <div className="shrink-0 rounded-md border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Goal {goalPrefix} {formatValue(goalValue, metric.unit)}
          </div>
        )}
      </div>

      {/* Big number + delta */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className={`text-3xl font-semibold tabular-nums leading-none ${
            currentStatus === 'green'
              ? 'text-emerald-600 dark:text-emerald-400'
              : currentStatus === 'red'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-foreground'
          }`}>
            {formatValue(currentValue, metric.unit)}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            This week
          </div>
        </div>
        {delta != null && (
          <div className={`flex items-center gap-1 text-xs font-medium tabular-nums ${deltaColor}`}>
            <DeltaIcon className="h-3.5 w-3.5" />
            <span>
              {delta > 0 ? '+' : ''}
              {formatValue(delta, metric.unit)}
              {pctChange != null && Math.abs(pctChange) < 1000 && (
                <span className="ml-1 text-muted-foreground/70">
                  ({pctChange > 0 ? '+' : ''}
                  {Math.round(pctChange)}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="-mx-2">
        <ResponsiveContainer width="100%" height={140}>
          {def.chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => formatValue(Number(v), metric.unit)}
              />
              <Tooltip
                cursor={{ fill: 'var(--accent)', opacity: 0.3 }}
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 11,
                  padding: '6px 10px',
                  backgroundColor: 'var(--popover)',
                }}
                formatter={(v) => [formatValue(Number(v), metric.unit), metric.name]}
                labelFormatter={(l) => `Week of ${l}`}
              />
              {goalValue != null && (
                <ReferenceLine
                  y={goalValue}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              )}
              <Bar
                dataKey="value"
                fill={def.color}
                radius={[4, 4, 0, 0]}
                onClick={def.drilldown ? handleBarClick : undefined}
                style={{ cursor: def.drilldown ? 'pointer' : 'default' }}
              />
            </BarChart>
          ) : (
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v) => formatValue(Number(v), metric.unit)}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 11,
                  padding: '6px 10px',
                  backgroundColor: 'var(--popover)',
                }}
                formatter={(v) => [formatValue(Number(v), metric.unit), metric.name]}
                labelFormatter={(l) => `Week of ${l}`}
              />
              {goalValue != null && (
                <ReferenceLine
                  y={goalValue}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={def.color}
                strokeWidth={2.5}
                dot={def.drilldown ? <ClickableDot /> : { r: 3, fill: def.color, strokeWidth: 0 }}
                activeDot={{
                  r: 6,
                  fill: def.color,
                  strokeWidth: 2,
                  stroke: 'var(--background)',
                }}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Drill-down panel */}
      {selectedWeek && (
        <div className="space-y-3 rounded-xl bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">Runs for week of {formatWeek(selectedWeek)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedWeek(null);
                setRuns(null);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          {pending && (
            <div className="py-4 text-center text-xs text-muted-foreground">Loading…</div>
          )}
          {!pending && runs && <DrilldownTable runs={runs} metricName={metric.name} />}
        </div>
      )}

      {/* Definition popover */}
      {showDefinition && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed">
          <div>
            <span className="font-semibold text-foreground">Knack fields: </span>
            <span className="text-muted-foreground">{def.fields}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Formula: </span>
            <span className="text-muted-foreground">{def.formula}</span>
          </div>
        </div>
      )}

      {/* Week picker — always-works path to drill-down */}
      {def.drilldown && !selectedWeek && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <label className="text-[11px] text-muted-foreground shrink-0">Inspect week:</label>
          <select
            className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs tabular-nums text-foreground outline-none transition-colors hover:border-primary focus:border-primary"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleWeekClick(e.target.value);
            }}
          >
            <option value="" disabled>
              Select a week…
            </option>
            {[...weeks].reverse().map((w) => {
              const entry = entries.find((e) => e.metricId === metric.id && e.weekStart === w);
              const v = entry?.value != null ? Number(entry.value) : null;
              return (
                <option key={w} value={w}>
                  Week of {formatWeek(w)} — {formatValue(v, metric.unit)}
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}

export function KPICharts({
  metrics,
  entries,
  weeks,
}: {
  metrics: Metric[];
  entries: Entry[];
  weeks: string[];
}) {
  const knackMetrics = metrics
    .filter((m) => m.name in KPI_DEFINITIONS)
    .sort((a, b) => KPI_ORDER.indexOf(a.name) - KPI_ORDER.indexOf(b.name));
  if (knackMetrics.length === 0) return null;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {knackMetrics.map((m) => (
        <KPICard key={m.id} metric={m} entries={entries} weeks={weeks} />
      ))}
    </div>
  );
}
