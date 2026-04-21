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
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

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
}> = {
  'Runs Completed': {
    description: 'Production KPI — count of individual runs completed this week.',
    fields: 'field_2292 (dateSentToInvoicing)',
    formula: 'A run is "completed" when field_2292 has a valid date. Week = that date\'s ISO week (Mon–Sun). Result = count of runs completed in the week.',
    color: '#2563eb',
    chartType: 'bar',
  },
  'Jobs Completed': {
    description: 'Production KPI — count of parent jobs fully completed this week.',
    fields: 'field_2292 (dateSentToInvoicing), field_534 (parent job #), field_1589 (customer #), field_535 (part #)',
    formula: 'Group runs by customer + parent job. A job counts as completed when EVERY run (across every part) has field_2292 set. Week = MAX(field_2292) across the job\'s runs.',
    color: '#16a34a',
    chartType: 'bar',
  },
  'Parent Jobs Invoiced': {
    description: 'Financial KPI — count of parent jobs fully invoiced this week.',
    fields: 'field_798 (invoiced flag), field_534 (parent job #), field_1589 (customer #), field_2292 (dateSentToInvoicing)',
    formula: 'Group runs by customer + parent job. A job counts as invoiced when ALL its runs have field_798 = "Yes". Week = MAX(field_2292) across the job\'s runs.',
    color: '#0d9488',
    chartType: 'bar',
  },
  'Avg Days Order\u2192Complete': {
    description: 'Lead time KPI — average calendar days from order to completion.',
    fields: 'field_969 (order received date), field_2292 (dateSentToInvoicing)',
    formula: 'For each run completed this week: days = field_2292 - field_969. Result = average across all runs. Lower is better.',
    color: '#d97706',
    chartType: 'line',
  },
  'On-Time Delivery %': {
    description: 'Service KPI — percentage of runs completed on or before the due date.',
    fields: 'field_972 (due/promise date), field_2292 (dateSentToInvoicing)',
    formula: 'For runs with a due date: on-time if field_2292 <= field_972. Result = (onTimeCount / totalWithDueDate) * 100.',
    color: '#9333ea',
    chartType: 'line',
  },
  'Weekly Revenue': {
    description: 'Revenue KPI — total revenue from runs completed this week.',
    fields: 'field_961 (revenue $), field_2292 (dateSentToInvoicing)',
    formula: 'Sum of field_961 (parsed from "$X,XXX.XX" format) for all runs with field_2292 in the week. ~70% fill rate on this field.',
    color: '#0891b2',
    chartType: 'bar',
  },
};

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

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
  if (!def) return null;

  const data = [...weeks].reverse().map((w) => {
    const entry = entries.find((e) => e.metricId === metric.id && e.weekStart === w);
    return {
      week: formatWeek(w),
      value: entry?.value != null ? Number(entry.value) : null,
    };
  });

  const goalValue = metric.goal != null ? Number(metric.goal) : null;
  const goalPrefix = metric.comparator === 'gte' ? '\u2265' : metric.comparator === 'lte' ? '\u2264' : '=';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{metric.name}</CardTitle>
        <CardDescription>{def.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          {def.chartType === 'bar' ? (
            <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => {
                  const n = Number(v);
                  return [
                    metric.unit === '$' ? `$${n.toLocaleString()}` : `${n}${metric.unit === '%' ? '%' : ''}`,
                    metric.name,
                  ];
                }}
                labelFormatter={(l) => `Week of ${l}`}
              />
              {goalValue != null && (
                <ReferenceLine
                  y={goalValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Goal: ${goalPrefix} ${goalValue}`, position: 'right', fontSize: 10, fill: '#ef4444' }}
                />
              )}
              <Bar dataKey="value" fill={def.color} radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => {
                  const n = Number(v);
                  return [
                    metric.unit === '%' ? `${n}%` : `${n} ${metric.unit ?? ''}`.trim(),
                    metric.name,
                  ];
                }}
                labelFormatter={(l) => `Week of ${l}`}
              />
              {goalValue != null && (
                <ReferenceLine
                  y={goalValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: `Goal: ${goalPrefix} ${goalValue}`, position: 'right', fontSize: 10, fill: '#ef4444' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={def.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
      <CardFooter>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p><span className="font-medium text-foreground">Knack fields:</span> {def.fields}</p>
          <p><span className="font-medium text-foreground">Formula:</span> {def.formula}</p>
        </div>
      </CardFooter>
    </Card>
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
  const knackMetrics = metrics.filter((m) => m.name in KPI_DEFINITIONS);
  if (knackMetrics.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {knackMetrics.map((m) => (
        <KPICard key={m.id} metric={m} entries={entries} weeks={weeks} />
      ))}
    </div>
  );
}
