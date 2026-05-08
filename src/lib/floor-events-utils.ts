export type FloorEvent = {
  id: string;
  stationId: string | null;
  kind:
    | 'job_started'
    | 'job_paused'
    | 'job_resumed'
    | 'job_completed'
    | 'pm_performed'
    | 'issue_noted'
    | 'waste_logged'
    | 'task_completed'
    | 'operator_moved'
    | 'note';
  occurredAt: Date;
  payload: Record<string, unknown>;
};

export type StationLiveStatus = 'running' | 'setup' | 'down' | 'idle';

/**
 * Derive a station's live status from its event history.
 *
 * - `job_started` / `job_resumed` → `running`
 * - `job_paused` → `setup` (we don't yet have a 'paused' enum value;
 *   operators in a paused state are typically performing setup/material work)
 * - `job_completed` → `idle`
 * - no events → `idle`
 *
 * Looks at the latest event for the given stationId by `occurredAt`.
 */
export function deriveStationStatus(
  events: FloorEvent[],
  stationId: string,
): StationLiveStatus {
  let latest: FloorEvent | null = null;
  for (const e of events) {
    if (e.stationId !== stationId) continue;
    if (!latest) {
      latest = e;
      continue;
    }
    const ta = new Date(latest.occurredAt as unknown as string).getTime();
    const tb = new Date(e.occurredAt as unknown as string).getTime();
    if (tb > ta) latest = e;
  }
  if (!latest) return 'idle';
  switch (latest.kind) {
    case 'job_started':
    case 'job_resumed':
      return 'running';
    case 'job_paused':
      return 'setup';
    case 'job_completed':
      return 'idle';
    default:
      return 'idle';
  }
}

export function groupEventsByStation(events: FloorEvent[]): Map<string, FloorEvent[]> {
  const out = new Map<string, FloorEvent[]>();
  for (const ev of events) {
    if (ev.stationId === null) continue;
    const arr = out.get(ev.stationId);
    if (arr) arr.push(ev);
    else out.set(ev.stationId, [ev]);
  }
  return out;
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export function summarizeEvent(event: FloorEvent): string {
  const p = event.payload ?? {};
  switch (event.kind) {
    case 'job_started': {
      const jobNumber = p.jobNumber;
      return jobNumber ? `Started — ${jobNumber}` : 'Started';
    }
    case 'job_paused': {
      const reason = p.reason;
      const note = p.note;
      if (!reason) return 'Paused';
      if (note) return `Paused — ${reason} (${note})`;
      return `Paused — ${reason}`;
    }
    case 'job_resumed':
      return 'Resumed';
    case 'job_completed': {
      const sheets = typeof p.sheets === 'number' ? p.sheets : null;
      if (sheets === null) return 'Completed';
      return `Completed — ${sheets.toLocaleString('en-US')} sheets`;
    }
    case 'pm_performed': {
      const label = p.label;
      return label ? `PM done — ${label}` : 'PM done';
    }
    case 'issue_noted': {
      const text = p.text ?? '';
      return `Issue: ${truncate(String(text))}`;
    }
    case 'waste_logged': {
      const sheets = p.sheets;
      const reason = p.reason;
      const sheetsStr = typeof sheets === 'number' ? sheets : (sheets ?? '');
      if (reason) return `Waste — ${sheetsStr} sheets (${reason})`;
      return `Waste — ${sheetsStr} sheets`;
    }
    case 'task_completed': {
      const title = p.title ?? '';
      return `Task done — ${title}`;
    }
    case 'operator_moved': {
      const userName = p.userName;
      const stationName = p.stationName;
      if (userName && stationName) return `Moved ${userName} → ${stationName}`;
      return 'Moved operator';
    }
    case 'note': {
      const text = p.text ?? '';
      return `Note: ${truncate(String(text))}`;
    }
    default:
      return '';
  }
}
