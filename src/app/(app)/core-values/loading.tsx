import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function CoreValuesLoading() {
  return (
    <PageSkeleton title="Core Values">
      <div className="space-y-3">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </PageSkeleton>
  );
}
