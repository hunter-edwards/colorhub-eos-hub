import { listProcesses, listTeamMembers } from '@/server/processes';
import { ProcessList } from './process-list';

export default async function ProcessesPage() {
  const [processList, members] = await Promise.all([
    listProcesses(),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Processes</h1>
      <ProcessList processes={processList} members={members} />
    </div>
  );
}
