import { describe, it, expect } from 'vitest';
import { mapRoutingStepToStation, STATION_KEYS } from './floor-knack-parse';

describe('mapRoutingStepToStation', () => {
  it('maps PRINT - BRN and COAT ONLY PASS - BRN to press_1', () => {
    expect(mapRoutingStepToStation('PRINT - BRN')).toBe('press_1');
    expect(mapRoutingStepToStation('COAT ONLY PASS - BRN')).toBe('press_1');
  });
  it('maps PRINT - Durst to press_2', () => {
    expect(mapRoutingStepToStation('PRINT - Durst')).toBe('press_2');
  });
  it('maps CAD to cad', () => {
    expect(mapRoutingStepToStation('CAD')).toBe('cad');
  });
  it('maps DIE to rotary', () => {
    expect(mapRoutingStepToStation('DIE')).toBe('rotary');
  });
  it('maps GLUE and TAPE to gluer_tape', () => {
    expect(mapRoutingStepToStation('GLUE')).toBe('gluer_tape');
    expect(mapRoutingStepToStation('TAPE')).toBe('gluer_tape');
  });
  it('maps HAND FULFILLMENT to handwork', () => {
    expect(mapRoutingStepToStation('HAND FULFILLMENT')).toBe('handwork');
  });
  it('maps all SHIP variants to shipping', () => {
    expect(mapRoutingStepToStation('SHIP PREP')).toBe('shipping');
    expect(mapRoutingStepToStation('SHIP READY')).toBe('shipping');
    expect(mapRoutingStepToStation('SHIPPED')).toBe('shipping');
  });
  it('returns null for hidden steps', () => {
    expect(mapRoutingStepToStation('SLIT')).toBeNull();
    expect(mapRoutingStepToStation('FIN')).toBeNull();
    expect(mapRoutingStepToStation('OUTSOURCE')).toBeNull();
    expect(mapRoutingStepToStation('QUALITY HOLD')).toBeNull();
    expect(mapRoutingStepToStation('MISTAKE WASTE')).toBeNull();
  });
  it('returns null for unknown / empty', () => {
    expect(mapRoutingStepToStation('NEW STEP THAT WE HAVE NOT SEEN')).toBeNull();
    expect(mapRoutingStepToStation('')).toBeNull();
  });
});

describe('STATION_KEYS', () => {
  it('exports the 7 station keys', () => {
    expect(STATION_KEYS).toEqual([
      'press_1', 'press_2', 'cad', 'rotary',
      'gluer_tape', 'handwork', 'shipping',
    ]);
  });
});
