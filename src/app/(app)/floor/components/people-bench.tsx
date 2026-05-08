'use client';

import { useDraggable } from '@dnd-kit/core';

type Member = { id: string; name: string | null; email: string };

type Props = {
  members: Member[];
  assignments: Array<{ stationId: string; userId: string }>;
  defaultsByStation: Record<string, string[]>;
  stations: Array<{ id: string; name: string }>;
};

type ResolvedMember = {
  id: string;
  displayName: string;
  /** Station id for sorting; null if unassigned. */
  stationId: string | null;
  /** Sub-label shown under the name. */
  stationLabel: string;
  /** True when the station label comes from a default (no explicit assignment). */
  isDefault: boolean;
};

function displayName(m: Member): string {
  return m.name && m.name.trim().length > 0 ? m.name : m.email;
}

function resolveMember(
  member: Member,
  assignments: Array<{ stationId: string; userId: string }>,
  defaultsByStation: Record<string, string[]>,
  stationNameById: Map<string, string>,
): ResolvedMember {
  const assigned = assignments.find((a) => a.userId === member.id);
  if (assigned) {
    return {
      id: member.id,
      displayName: displayName(member),
      stationId: assigned.stationId,
      stationLabel: stationNameById.get(assigned.stationId) ?? 'Unknown',
      isDefault: false,
    };
  }

  // Fall back to defaults — pick the first station that lists this member.
  for (const [stationId, userIds] of Object.entries(defaultsByStation)) {
    if (userIds.includes(member.id)) {
      const stationName = stationNameById.get(stationId);
      if (!stationName) continue;
      return {
        id: member.id,
        displayName: displayName(member),
        stationId,
        stationLabel: `default: ${stationName}`,
        isDefault: true,
      };
    }
  }

  return {
    id: member.id,
    displayName: displayName(member),
    stationId: null,
    stationLabel: 'Unassigned',
    isDefault: false,
  };
}

function MemberChip({ member }: { member: ResolvedMember }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `member-${member.id}`,
  });
  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 50,
      }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`floor-chip flex flex-col items-start px-2 py-1 rounded-md bg-white/5 ring-1 ring-white/10 cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-70 ring-emerald-400/60' : ''
      }`}
    >
      <span className="font-semibold text-white">{member.displayName}</span>
      <span
        className={`text-[10px] uppercase tracking-wider ${
          member.stationId === null ? 'text-amber-300' : 'text-white/60'
        }`}
      >
        {member.stationLabel}
      </span>
    </div>
  );
}

export function PeopleBench({
  members,
  assignments,
  defaultsByStation,
  stations,
}: Props) {
  const stationNameById = new Map(stations.map((s) => [s.id, s.name] as const));
  // Use the order of the `stations` prop for displayOrder.
  const stationOrderById = new Map(stations.map((s, i) => [s.id, i] as const));

  const resolved = members.map((m) =>
    resolveMember(m, assignments, defaultsByStation, stationNameById),
  );

  resolved.sort((a, b) => {
    // Unassigned first.
    if (a.stationId === null && b.stationId !== null) return -1;
    if (a.stationId !== null && b.stationId === null) return 1;
    if (a.stationId !== null && b.stationId !== null) {
      const ao = stationOrderById.get(a.stationId) ?? Number.MAX_SAFE_INTEGER;
      const bo = stationOrderById.get(b.stationId) ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <div className="rounded-md border border-white/10 p-4 flex flex-col min-h-0">
      <div className="floor-title mb-2">On shift: {members.length}</div>
      <div className="flex flex-wrap gap-2 overflow-auto min-h-0">
        {resolved.map((r) => (
          <MemberChip key={r.id} member={r} />
        ))}
      </div>
    </div>
  );
}
