import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function AccountabilityLoading() {
  return (
    <PageSkeleton title="Accountability Chart">
      <div className="flex flex-col items-center gap-6">
        <CardSkeleton lines={3} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </PageSkeleton>
  );
}
