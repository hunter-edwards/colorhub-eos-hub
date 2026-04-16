import { listCoreValues } from '@/server/core-values';
import { CoreValuesList } from './core-values-list';

export default async function CoreValuesPage() {
  const values = await listCoreValues();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Core Values</h1>
        <p className="text-muted-foreground text-sm">
          Define your company&apos;s 3-7 core values
        </p>
      </div>
      <CoreValuesList initialValues={values} />
    </div>
  );
}
