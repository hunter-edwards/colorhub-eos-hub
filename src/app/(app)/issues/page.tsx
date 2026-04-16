import { listIssues } from '@/server/issues';
import { listTeamMembers } from '@/server/rocks';
import { IssuesBoard } from './issues-board';

export default async function IssuesPage() {
  const [shortTerm, longTerm, members] = await Promise.all([
    listIssues('short_term'),
    listIssues('long_term'),
    listTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Issues</h1>
      <IssuesBoard shortTerm={shortTerm} longTerm={longTerm} members={members} />
    </div>
  );
}
