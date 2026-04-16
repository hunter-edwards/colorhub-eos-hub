import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function ProcessesLoading() {
  return (
    <PageSkeleton title="Processes">
      <div className="space-y-4">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={5} />
        <CardSkeleton lines={3} />
      </div>
    </PageSkeleton>
  );
}
