import { describe, it, expect } from 'vitest';
import { atLeast } from './auth';

describe('atLeast', () => {
  it('admin satisfies leader', () => { expect(atLeast('admin', 'leader')).toBe(true); });
  it('leader satisfies member', () => { expect(atLeast('leader', 'member')).toBe(true); });
  it('member does NOT satisfy leader', () => { expect(atLeast('member', 'leader')).toBe(false); });
  it('leader does NOT satisfy admin', () => { expect(atLeast('leader', 'admin')).toBe(false); });
  it('member satisfies member', () => { expect(atLeast('member', 'member')).toBe(true); });
  it('admin satisfies admin', () => { expect(atLeast('admin', 'admin')).toBe(true); });
});
