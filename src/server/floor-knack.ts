// PHASE 1: returns deterministic mocks. PHASE 2: replace with real Knack queries
// against the mapping layer; do not change the return shape.
//
// TODO(phase-2) — Knack fields to find and map:
//   - Job queue per machine center (current + upcoming)
//   - Sheets needed / completed / received per line-item run
//   - Waste sheets per line-item run / per station
//   - Routing completion status
//   - Issue notes per line-item run
//   - Customer / job metadata (name, due date, line-item description)
//   - Operator/user mapping to hub user accounts

import type {
  FloorJob,
  FloorStationView,
  StationId,
} from '@/lib/floor-types';

const STATUSES: FloorStationView['status'][] = ['running', 'setup', 'down', 'idle'];

const CUSTOMERS = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Hooli',
  'Soylent Industries',
  'Umbrella Co',
  'Stark Holdings',
  'Wayne Enterprises',
];

const LINE_ITEMS = [
  '12pt C2S Postcard',
  '14pt Cover Brochure',
  '100lb Gloss Flyer',
  '80lb Matte Booklet',
  'Synthetic Tag',
  '24pt Rigid Box Wrap',
];

const ISSUE_NOTE_POOL = [
  'Color drift on press',
  'Plate mismatch — flagged for QC',
  'Awaiting stock from receiving',
  'Routing slip incomplete',
  'Substrate curl observed',
];

// djb2 string hash — stable across runs.
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length] as T;
}

function buildJob(stationId: StationId, slot: string, seed: number): FloorJob {
  const jobNumDigits = 1000 + (seed % 9000);
  const sheetsNeeded = 4000 + (seed % 21) * 100; // 4000..6000 in 100s
  const completionRatio = (seed % 11) / 10; // 0.0..1.0
  const overrun = (seed % 7) === 0; // sometimes over needed
  const sheetsCompleted = overrun
    ? sheetsNeeded + ((seed % 5) + 1) * 50
    : Math.round(sheetsNeeded * completionRatio);
  const sheetsReceived = sheetsNeeded + ((seed % 3) * 100); // some overage received
  const wasteSheets = (seed % 13) * 5; // 0..60
  const routingComplete = (seed % 4) !== 0;
  const dueOffsetDays = (seed % 14) - 3; // -3..10
  const dueDate = formatDueDate(dueOffsetDays, stationId, slot);
  const issueNotes = buildIssueNotes(seed);

  return {
    id: `mock-${stationId}-${slot}`,
    jobNumber: `J-${jobNumDigits}`,
    customer: pick(CUSTOMERS, seed),
    lineItem: pick(LINE_ITEMS, seed >> 3),
    sheetsNeeded,
    sheetsCompleted,
    sheetsReceived,
    wasteSheets,
    routingComplete,
    dueDate,
    issueNotes,
  };
}

// Deterministic ymd offset from a fixed epoch — independent of "now" so the
// output stays stable test-to-test.
function formatDueDate(offsetDays: number, stationId: StationId, slot: string): string | null {
  const seed = hash(`${stationId}|${slot}|due`);
  if (seed % 11 === 0) return null;
  const epoch = Date.UTC(2026, 0, 1); // 2026-01-01
  const ms = epoch + offsetDays * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildIssueNotes(seed: number): string[] {
  const count = seed % 5; // 0..4 → bias toward 0/1/2
  if (count === 0 || count >= 3) return [];
  const notes: string[] = [];
  for (let i = 0; i < count; i++) {
    notes.push(pick(ISSUE_NOTE_POOL, (seed >> (i + 1)) + i));
  }
  return notes;
}

function buildStationView(stationId: StationId): FloorStationView {
  const baseSeed = hash(stationId);
  const status = STATUSES[baseSeed % STATUSES.length] as FloorStationView['status'];

  const current: FloorJob | null =
    status === 'running' || status === 'setup'
      ? buildJob(stationId, 'current', hash(`${stationId}|current`))
      : null;

  const queueLen = hash(`${stationId}|queue-len`) % 4; // 0..3
  const queue: FloorJob[] = [];
  for (let i = 0; i < queueLen; i++) {
    queue.push(buildJob(stationId, `queue-${i}`, hash(`${stationId}|queue-${i}`)));
  }

  return { stationId, status, current, queue };
}

export async function getFloorView(stationIds: StationId[]): Promise<FloorStationView[]> {
  return stationIds.map(buildStationView);
}
