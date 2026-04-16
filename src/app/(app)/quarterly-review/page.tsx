import { currentQuarter } from '@/lib/quarters';
import { listRocks, listTeamMembers } from '@/server/rocks';
import { listCoreValues } from '@/server/core-values';
import { listPeopleRatings } from '@/server/people-analyzer';
import { getVTO } from '@/server/vto';
import { ReviewWizard } from './review-wizard';

export default async function QuarterlyReviewPage() {
  const quarter = currentQuarter();
  const [rocks, coreValues, ratings, members, vto] = await Promise.all([
    listRocks(quarter),
    listCoreValues(),
    listPeopleRatings(quarter),
    listTeamMembers(),
    getVTO(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quarterly Review</h1>
        <p className="text-muted-foreground text-sm">{quarter}</p>
      </div>
      <ReviewWizard
        rocks={rocks}
        coreValues={coreValues}
        ratings={ratings}
        members={members}
        vto={vto}
        quarter={quarter}
      />
    </div>
  );
}
