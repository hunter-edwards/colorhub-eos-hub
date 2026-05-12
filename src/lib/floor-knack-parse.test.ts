import { describe, it, expect } from 'vitest';
import { mapRoutingStepToStation, STATION_KEYS, parseQtyRollup, parseCustomerAndItem } from './floor-knack-parse';

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

describe('parseQtyRollup', () => {
  it('parses full rollup with all fields', () => {
    const input = '4820 / 5000 (+10%/-0%)\nRcvd = 4500\n#Jobs = 3';
    expect(parseQtyRollup(input)).toEqual({
      produced: 4820, needed: 5000, tolerancePlus: 10, toleranceMinus: 0,
      received: 4500, jobCount: 3,
    });
  });
  it('handles HTML <br /> separators', () => {
    const input = '0 / <br />(+10%/-0%)<br /><br />Rcvd = 0<br />#Jobs = 0';
    expect(parseQtyRollup(input)).toEqual({
      produced: 0, needed: null, tolerancePlus: 10, toleranceMinus: 0,
      received: 0, jobCount: 0,
    });
  });
  it('handles comma-formatted numbers', () => {
    const input = '12,400 / 50,000\nRcvd = 25,000\n#Jobs = 1';
    expect(parseQtyRollup(input).produced).toBe(12400);
    expect(parseQtyRollup(input).needed).toBe(50000);
    expect(parseQtyRollup(input).received).toBe(25000);
  });
  it('returns nulls for empty input', () => {
    expect(parseQtyRollup('')).toEqual({
      produced: null, needed: null, tolerancePlus: null,
      toleranceMinus: null, received: null, jobCount: null,
    });
  });
  it('handles sparse input (no Rcvd line)', () => {
    const input = '0 / 5000';
    const r = parseQtyRollup(input);
    expect(r.produced).toBe(0);
    expect(r.needed).toBe(5000);
    expect(r.received).toBeNull();
    expect(r.jobCount).toBeNull();
  });
  it('parses tolerance values', () => {
    const input = '0 / 100 (+5%/-2%)';
    expect(parseQtyRollup(input).tolerancePlus).toBe(5);
    expect(parseQtyRollup(input).toleranceMinus).toBe(2);
  });
});

describe('parseCustomerAndItem', () => {
  it('parses standard rollup', () => {
    const input = 'Shoreline Container<br /><br />100001732';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Shoreline Container',
      itemName: '100001732',
    });
  });
  it('joins multi-line item', () => {
    const input = 'Acme Corp<br /><br />Part A<br />Part B';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Acme Corp',
      itemName: 'Part A Part B',
    });
  });
  it('returns nulls for empty input', () => {
    expect(parseCustomerAndItem('')).toEqual({ customer: null, itemName: null });
  });
  it('single line yields customer only', () => {
    expect(parseCustomerAndItem('Solo Customer')).toEqual({
      customer: 'Solo Customer',
      itemName: null,
    });
  });
  it('strips HTML entities and trims', () => {
    const input = '  Customer &amp; Co<br /><br />   Item Name   ';
    expect(parseCustomerAndItem(input)).toEqual({
      customer: 'Customer & Co',
      itemName: 'Item Name',
    });
  });
});
