import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function RocksLoading() {
  return (
    <PageSkeleton title="Rocks">
      <div className="grid gap-4 md:grid-cols-3">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    </PageSkeleton>
  );
}
