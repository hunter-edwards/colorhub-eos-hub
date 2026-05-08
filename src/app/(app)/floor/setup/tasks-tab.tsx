import { listTasks } from '@/server/floor-tasks';
import { listStations } from '@/server/floor-stations';
import { TasksTable, type TaskRow, type StationOption } from './tasks-table';

export async function TasksTab() {
  const tasks = await listTasks({});
  const stations = await listStations({});

  const taskRows: TaskRow[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    estMinutes: t.estMinutes,
    suggestedStationId: t.suggestedStationId,
    source: t.source,
    status: t.status,
    createdAt: t.createdAt,
  }));

  const stationOptions: StationOption[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return <TasksTable tasks={taskRows} stations={stationOptions} />;
}
