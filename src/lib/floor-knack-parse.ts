export const STATION_KEYS = [
  'press_1', 'press_2', 'cad', 'rotary',
  'gluer_tape', 'handwork', 'shipping',
] as const;

export type StationKey = typeof STATION_KEYS[number];

const STATION_MAP: Record<string, StationKey> = {
  'PRINT - BRN':          'press_1',
  'COAT ONLY PASS - BRN': 'press_1',
  'PRINT - Durst':        'press_2',
  'CAD':                  'cad',
  'DIE':                  'rotary',
  'GLUE':                 'gluer_tape',
  'TAPE':                 'gluer_tape',
  'HAND FULFILLMENT':     'handwork',
  'SHIP PREP':            'shipping',
  'SHIP READY':           'shipping',
  'SHIPPED':              'shipping',
};

export function mapRoutingStepToStation(routingStep: string): StationKey | null {
  return STATION_MAP[routingStep] ?? null;
}
