'use server';

import { db } from '@/db';
import { scorecardMetrics, scorecardEntries, knackSyncLog } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { desc } from 'drizzle-orm';
import {
  fetchCompletedRuns,
  fetchRunsForParentJobs,
  computeWeeklyKPIs,
  type KnackConfig,
} from '@/lib/knack';
import { getWeekStarts } from '@/lib/scorecard-utils';

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

function getKnackConfig(): KnackConfig | null {
  const appId = process.env.KNACK_APP_ID;
  const apiKey = process.env.KNACK_API_KEY;
  if (!appId || !apiKey) return null;
  return { appId, apiKey };
}

/** Map of KPI name → scorecard metric name (must match what's in the DB). */
const KPI_METRIC_MAP = {
  runsCompleted: 'Runs Completed',
  jobsCompleted: 'Jobs Completed',
  parentJobsInvoiced: 'Parent Jobs Invoiced',
  avgDaysOrderToComplete: 'Avg Days Order→Complete',
  onTimeDeliveryPct: 'On-Time Delivery %',
  weeklyRevenue: 'Weekly Revenue',
} as const;

type KPIKey = keyof typeof KPI_METRIC_MAP;

/**
 * Sync Knack data into the EOS scorecard for the last N weeks.
 * Creates metrics if they don't exist, then upserts weekly entries.
 *
 * A "completion" is when field_2292 (dateSentToInvoicing) on a run is
 * populated. Parent jobs count as completed when every run for that
 * parent job has field_2292 set.
 */
export async function syncKnackToScorecard(weekCount = 1): Promise<{
  ok: boolean;
  weeksUpdated: number;
  error?: string;
}> {
  const user = await requireUser();
  const config = getKnackConfig();
  if (!config) {
    return { ok: false, weeksUpdated: 0, error: 'Knack credentials not configured (KNACK_APP_ID / KNACK_API_KEY)' };
  }

  const totalStart = Date.now();
  try {
    const weeks = getWeekStarts(weekCount);
    const startDate = weeks[weeks.length - 1]; // earliest week
    const endDate = addDays(weeks[0], 7);       // end of current week

    // 1. Runs completed in the window (field_2292 date in range)
    const t1 = Date.now();
    const completedRuns = await fetchCompletedRuns(config, startDate, endDate);
    const t1Ms = Date.now() - t1;

    // 2. For parent jobs touched by those runs, pull every run (any date)
    //    so we can check if ALL runs across all parts are completed.
    const parentJobs = [...new Set(completedRuns.map((r) => r.parentJob).filter(Boolean))];
    const t2 = Date.now();
    const allJobRuns = await fetchRunsForParentJobs(config, parentJobs);
    const t2Ms = Date.now() - t2;

    const t3 = Date.now();
    const weeklyKPIs = computeWeeklyKPIs(completedRuns, allJobRuns, weeks);
    const metricIds = await ensureMetrics(user.id);

    for (const week of weeklyKPIs) {
      for (const [key, metricId] of Object.entries(metricIds)) {
        const kpiKey = key as KPIKey;
        const value = week[kpiKey];
        if (value === null || value === undefined) continue;

        await db
          .insert(scorecardEntries)
          .values({
            metricId,
            weekStart: week.weekStart,
            value: String(value),
          })
          .onConflictDoUpdate({
            target: [scorecardEntries.metricId, scorecardEntries.weekStart],
            set: { value: String(value) },
          });
      }
    }
    const t3Ms = Date.now() - t3;

    const totalMs = Date.now() - totalStart;
    console.log(
      `[knack-sync] weeks=${weekCount} completedRuns=${completedRuns.length} (${t1Ms}ms) · ` +
        `parentJobs=${parentJobs.length} allJobRuns=${allJobRuns.length} (${t2Ms}ms) · ` +
        `upsert=${weeklyKPIs.length * Object.keys(metricIds).length} (${t3Ms}ms) · ` +
        `total=${totalMs}ms`
    );

    await db.insert(knackSyncLog).values({
      weeksUpdated: weeklyKPIs.length,
      weeksRequested: weekCount,
      durationMs: totalMs,
      ok: true,
    });

    revalidatePath('/scorecard');
    return { ok: true, weeksUpdated: weeklyKPIs.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const totalMs = Date.now() - totalStart;
    console.error(`[knack-sync] FAILED after ${totalMs}ms: ${message}`);
    await db.insert(knackSyncLog).values({
      weeksUpdated: 0,
      weeksRequested: weekCount,
      durationMs: totalMs,
      ok: false,
    }).catch(() => {});
    return { ok: false, weeksUpdated: 0, error: message };
  }
}

export async function getLastKnackSync(): Promise<{
  syncedAt: Date;
  weeksUpdated: number;
  durationMs: number;
  ok: boolean;
} | null> {
  const [row] = await db
    .select()
    .from(knackSyncLog)
    .orderBy(desc(knackSyncLog.syncedAt))
    .limit(1);
  return row ?? null;
}

/**
 * Ensure the 6 Knack-sourced metrics exist in the scorecard.
 * Returns a map of KPI key → metric UUID.
 */
async function ensureMetrics(ownerId: string): Promise<Record<KPIKey, string>> {
  const existing = await db.select().from(scorecardMetrics);
  const result: Partial<Record<KPIKey, string>> = {};

  const kpiConfigs: Record<KPIKey, { goal: string; comparator: 'gte' | 'lte'; unit: string }> = {
    runsCompleted: { goal: '20', comparator: 'gte', unit: 'runs' },
    jobsCompleted: { goal: '10', comparator: 'gte', unit: 'jobs' },
    parentJobsInvoiced: { goal: '10', comparator: 'gte', unit: 'jobs' },
    avgDaysOrderToComplete: { goal: '14', comparator: 'lte', unit: 'days' },
    onTimeDeliveryPct: { goal: '90', comparator: 'gte', unit: '%' },
    weeklyRevenue: { goal: '50000', comparator: 'gte', unit: '$' },
  };

  for (const [key, metricName] of Object.entries(KPI_METRIC_MAP)) {
    const kpiKey = key as KPIKey;
    const found = existing.find((m) => m.name === metricName);
    if (found) {
      result[kpiKey] = found.id;
    } else {
      const conf = kpiConfigs[kpiKey];
      const [created] = await db
        .insert(scorecardMetrics)
        .values({
          name: metricName,
          ownerId,
          goal: conf.goal,
          comparator: conf.comparator,
          unit: conf.unit,
        })
        .returning();
      result[kpiKey] = created.id;
    }
  }

  return result as Record<KPIKey, string>;
}

/** Check if Knack is configured. */
export async function isKnackConfigured(): Promise<boolean> {
  return !!getKnackConfig();
}

export type DrilldownRun = {
  id: string;
  jobId: string;
  parentJob: string;
  partNumber: string;
  customer: string;        // customer number, e.g. "162"
  customerName: string;    // customer name, e.g. "Harbor 3D LLC"
  orderDate: string | null;
  completionDate: string | null;
  dueDate: string | null;
  daysToComplete: number | null; // completionDate - orderDate
  revenue: number;
  invoiced: boolean;
  onTime: boolean | null;
};

/**
 * Fetch the list of completed runs whose completion date falls within
 * the given week. Used for the per-KPI drill-down under each chart.
 */
export async function getCompletedRunsForWeek(weekStart: string): Promise<DrilldownRun[]> {
  await requireUser();
  const config = getKnackConfig();
  if (!config) return [];

  const weekEnd = addDays(weekStart, 7);
  const runs = await fetchCompletedRuns(config, weekStart, weekEnd);

  return runs.map((r) => {
    let daysToComplete: number | null = null;
    if (r.orderDate && r.dateSentToInvoicing) {
      const a = new Date(r.orderDate + 'T00:00:00').getTime();
      const b = new Date(r.dateSentToInvoicing + 'T00:00:00').getTime();
      daysToComplete = Math.round((b - a) / (1000 * 60 * 60 * 24));
    }
    return {
      id: r.id,
      jobId: r.jobId,
      parentJob: r.parentJob,
      partNumber: r.partNumber,
      customer: r.customer,
      customerName: r.customerName,
      orderDate: r.orderDate,
      completionDate: r.dateSentToInvoicing,
      dueDate: r.dueDate,
      daysToComplete,
      revenue: r.revenue,
      invoiced: r.invoiced,
      onTime: r.dueDate && r.dateSentToInvoicing ? r.dateSentToInvoicing <= r.dueDate : null,
    };
  });
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
