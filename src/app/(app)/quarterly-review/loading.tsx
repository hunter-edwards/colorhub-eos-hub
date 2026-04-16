import { PageSkeleton, CardSkeleton } from '@/components/skeleton-page';

export default function QuarterlyReviewLoading() {
  return (
    <PageSkeleton title="Quarterly Review">
      <div className="flex justify-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full animate-pulse bg-muted" />
            {i < 3 && <div className="hidden sm:block h-px w-12 bg-muted" />}
          </div>
        ))}
      </div>
      <CardSkeleton lines={8} />
    </PageSkeleton>
  );
}
