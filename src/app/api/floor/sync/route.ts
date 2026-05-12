import { NextResponse } from 'next/server';
import { syncFloorRoutings } from '@/server/floor-knack-sync';

async function handle(req: Request): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }
  // If CRON_SECRET is unset (e.g. local dev), allow through — no other entry
  // point hits this route in Phase 2, so this is acceptable.
  try {
    const result = await syncFloorRoutings();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
