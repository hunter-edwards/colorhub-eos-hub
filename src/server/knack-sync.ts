'use server';

import { db } from '@/db';
import { scorecardMetrics, scorecardEntries, teamSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { fetchShippedRuns, computeWeeklyKPIs, type KnackConfig } from '@/lib/knack';
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
  parentJobsShipped: 'Parent Jobs Shipped',
  parentJobsInvoiced: 'Parent Jobs Invoiced',
  avgDaysOrderToShip: 'Avg Days Order→Ship',
  onTimeDeliveryPct: 'On-Time Delivery %',
  weeklyRevenue: 'Weekly Revenue',
} as const;

type KPIKey = keyof typeof KPI_METRIC_MAP;

/**
 * Sync Knack data into the EOS scorecard for the last N weeks.
 * Creates metrics if they don't exist, then upserts weekly entries.
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

    // Fetch all shipped runs in the date range
    const runs = await fetchShippedRuns(config, startDate, endDate);

    // Compute weekly KPIs
    const weeklyKPIs = computeWeeklyKPIs(runs, weeks);

    // Ensure scorecard metrics exist, get their IDs
    const metricIds = await ensureMetrics(user.id);

    // Upsert entries
    let updated = 0;
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
        updated++;
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
 * Ensure the 5 Knack-sourced metrics exist in the scorecard.
 * Returns a map of KPI key → metric UUID.
 */
async function ensureMetrics(ownerId: string): Promise<Record<KPIKey, string>> {
  const existing = await db.select().from(scorecardMetrics);
  const result: Partial<Record<KPIKey, string>> = {};

  const kpiConfigs: Record<KPIKey, { goal: string; comparator: 'gte' | 'lte'; unit: string }> = {
    parentJobsShipped: { goal: '10', comparator: 'gte', unit: 'jobs' },
    parentJobsInvoiced: { goal: '10', comparator: 'gte', unit: 'jobs' },
    avgDaysOrderToShip: { goal: '14', comparator: 'lte', unit: 'days' },
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
