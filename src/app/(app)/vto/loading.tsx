import { CardSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function VTOLoading() {
  return (
    <PageSkeleton title="Vision/Traction Organizer">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={6} />
        </div>
        <div className="space-y-6">
          <CardSkeleton lines={5} />
          <CardSkeleton lines={5} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    </PageSkeleton>
  );
}
