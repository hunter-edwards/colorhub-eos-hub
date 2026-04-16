import { GridSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function PeopleLoading() {
  return (
    <PageSkeleton title="People Analyzer">
      <GridSkeleton cols={7} rows={5} />
    </PageSkeleton>
  );
}
