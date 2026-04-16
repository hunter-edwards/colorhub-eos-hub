import { getVTO } from '@/server/vto';
import { listCoreValues } from '@/server/core-values';
import { listRocks } from '@/server/rocks';
import { listIssues } from '@/server/issues';
import { currentQuarter } from '@/lib/quarters';
import { VTOForm } from './vto-form';

export default async function VTOPage() {
  const quarter = currentQuarter();
  const [vtoData, coreValuesList, rocksList, issuesList] = await Promise.all([
    getVTO(),
    listCoreValues(),
    listRocks(quarter),
    listIssues(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Vision/Traction Organizer</h1>
      <VTOForm
        vto={vtoData}
        coreValues={coreValuesList}
        rocks={rocksList}
        issues={issuesList}
        quarter={quarter}
      />
    </div>
  );
}
