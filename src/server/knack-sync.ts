'use server';

import { db } from '@/db';
import { scorecardMetrics, scorecardEntries } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
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
export async function syncKnackToScorecard(weekCount = 13): Promise<{
  ok: boolean;
  weeksUpdated: number;
  error?: string;
}> {
  const user = await requireUser();
  const config = getKnackConfig();
  if (!config) {
    return { ok: false, weeksUpdated: 0, error: 'Knack credentials not configured (KNACK_APP_ID / KNACK_API_KEY)' };
  }

  try {
    const weeks = getWeekStarts(weekCount);
    const startDate = weeks[weeks.length - 1]; // earliest week
    const endDate = addDays(weeks[0], 7);       // end of current week

    // 1. Runs completed in the window (field_2292 date in range)
    const completedRuns = await fetchCompletedRuns(config, startDate, endDate);

    // 2. For parent jobs touched by those runs, pull every run (any date)
    //    so we can check if ALL runs across all parts are completed.
    const parentJobs = [...new Set(completedRuns.map((r) => r.parentJob).filter(Boolean))];
    const allJobRuns = await fetchRunsForParentJobs(config, parentJobs);

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

    revalidatePath('/scorecard');
    return { ok: true, weeksUpdated: weeklyKPIs.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, weeksUpdated: 0, error: message };
  }
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

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
