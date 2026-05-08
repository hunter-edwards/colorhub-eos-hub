export type StationId = string;

export type FloorJob = {
  id: string;            // knack record id (or mock id)
  jobNumber: string;
  customer: string;
  lineItem: string;
  sheetsNeeded: number;
  sheetsCompleted: number;
  sheetsReceived: number;
  wasteSheets: number;
  routingComplete: boolean;
  dueDate: string | null;
  issueNotes: string[];
};

export type FloorStationView = {
  stationId: StationId;
  status: 'running' | 'setup' | 'down' | 'idle';
  current: FloorJob | null;
  queue: FloorJob[];
};
