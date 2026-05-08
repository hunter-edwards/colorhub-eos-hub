import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StationsTab } from './stations-tab';
import { TasksTab } from './tasks-tab';
import { ShiftTab } from './shift-tab';

export default function FloorSetupPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Floor Setup</h1>
        <p className="text-sm text-muted-foreground">Stations, default operators, PM, task pool, and shift settings.</p>
      </header>
      <Tabs defaultValue="stations">
        <TabsList>
          <TabsTrigger value="stations">Stations</TabsTrigger>
          <TabsTrigger value="tasks">Task Pool</TabsTrigger>
          <TabsTrigger value="shift">Shift Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="stations" className="mt-6"><StationsTab /></TabsContent>
        <TabsContent value="tasks" className="mt-6"><TasksTab /></TabsContent>
        <TabsContent value="shift" className="mt-6"><ShiftTab /></TabsContent>
      </Tabs>
    </div>
  );
}
