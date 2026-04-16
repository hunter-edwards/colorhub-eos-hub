import { listPeopleRatings, listTeamMembersWithDetails, listTeamCoreValues } from '@/server/people-analyzer';
import { currentQuarter } from '@/lib/quarters';
import { PeopleMatrix } from './people-matrix';

export default async function PeoplePage() {
  const quarter = currentQuarter();
  const [members, coreValues, ratings] = await Promise.all([
    listTeamMembersWithDetails(),
    listTeamCoreValues(),
    listPeopleRatings(quarter),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">People Analyzer</h1>
      <PeopleMatrix
        members={members}
        coreValues={coreValues}
        initialRatings={ratings}
        currentQuarter={quarter}
      />
    </div>
  );
}
