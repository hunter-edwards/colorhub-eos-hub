import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function DashboardLoading() {
  return (
    <PageSkeleton title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
      <CardSkeleton lines={5} />
    </PageSkeleton>
  );
}
