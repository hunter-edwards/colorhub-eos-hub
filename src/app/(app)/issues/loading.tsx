import { ListSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function IssuesLoading() {
  return (
    <PageSkeleton title="Issues">
      <div className="grid gap-4 md:grid-cols-2">
        <ListSkeleton rows={5} />
        <ListSkeleton rows={5} />
      </div>
    </PageSkeleton>
  );
}
