import { currentQuarter } from '@/lib/quarters';
import { listRocks, listTeamMembers } from '@/server/rocks';
import { RocksBoard } from './rocks-board';

export default async function RocksPage() {
  const quarter = currentQuarter();
  const [rocks, members] = await Promise.all([
    listRocks(quarter),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rocks</h1>
          <p className="text-muted-foreground text-sm">{quarter}</p>
        </div>
      </div>
      <RocksBoard rocks={rocks} members={members} quarter={quarter} />
    </div>
  );
}
