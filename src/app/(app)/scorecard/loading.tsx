import { GridSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function ScorecardLoading() {
  return (
    <PageSkeleton title="Scorecard">
      <GridSkeleton cols={5} rows={6} />
    </PageSkeleton>
  );
}
