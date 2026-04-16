import { ListSkeleton, PageSkeleton } from '@/components/skeleton-page';

export default function TodosLoading() {
  return (
    <PageSkeleton title="To-Dos">
      <ListSkeleton rows={8} />
    </PageSkeleton>
  );
}
