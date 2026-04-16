import { listSeats, listTeamMembers } from '@/server/accountability';
import { AccountabilityChart } from './chart';

export default async function AccountabilityPage() {
  const [seatsList, members] = await Promise.all([
    listSeats(),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Accountability Chart</h1>
      <AccountabilityChart seats={seatsList} members={members} />
    </div>
  );
}
