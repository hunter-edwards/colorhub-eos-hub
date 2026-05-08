'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentTeamId } from '@/server/team-helpers';
import * as floorStations from '@/server/floor-stations';
import type { StationKind } from '@/server/floor-stations';

export async function createStationAction(input: {
  name: string;
  kind: StationKind;
  groupLabel?: string;
}) {
  const teamId = await getCurrentTeamId();
  await floorStations.createStation({ ...input, teamId });
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function updateStationAction(
  id: string,
  patch: {
    name?: string;
    kind?: StationKind;
    groupLabel?: string | null;
    displayOrder?: number;
    knackMachineCenterId?: string | null;
  },
) {
  await floorStations.updateStation(id, patch);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function archiveStationAction(id: string) {
  await floorStations.archiveStation(id);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function reorderStationAction(id: string, displayOrder: number) {
  await floorStations.updateStation(id, { displayOrder });
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function setDefaultOperatorsAction(stationId: string, userIds: string[]) {
  await floorStations.setDefaultOperators(stationId, userIds);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}

export async function seedDefaultStationsAction() {
  const teamId = await getCurrentTeamId();
  await floorStations.seedDefaultStations(teamId);
  revalidatePath('/floor/setup');
  revalidatePath('/floor');
}
