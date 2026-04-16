import { describe, it, expect } from 'vitest';
import { buildTree, getDescendantIds } from './accountability-utils';
import type { FlatSeat } from './accountability-utils';

describe('buildTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('returns single root node with no children', () => {
    const seats: FlatSeat[] = [
      { id: 'a', parentSeatId: null },
    ];
    const tree = buildTree(seats);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('a');
    expect(tree[0].children).toEqual([]);
  });

  it('builds multi-level tree', () => {
    const seats: FlatSeat[] = [
      { id: 'root', parentSeatId: null },
      { id: 'child1', parentSeatId: 'root' },
      { id: 'child2', parentSeatId: 'root' },
      { id: 'grandchild', parentSeatId: 'child1' },
    ];
    const tree = buildTree(seats);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('root');
    expect(tree[0].children).toHaveLength(2);

    const child1 = tree[0].children.find((c) => c.id === 'child1');
    expect(child1).toBeDefined();
    expect(child1!.children).toHaveLength(1);
    expect(child1!.children[0].id).toBe('grandchild');
  });

  it('treats orphans as top-level nodes', () => {
    const seats: FlatSeat[] = [
      { id: 'a', parentSeatId: 'missing-parent' },
      { id: 'b', parentSeatId: null },
    ];
    const tree = buildTree(seats);
    expect(tree).toHaveLength(2);
    const ids = tree.map((n) => n.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });

  it('preserves extra properties on nodes', () => {
    const seats: FlatSeat[] = [
      { id: 'a', parentSeatId: null, title: 'CEO', roles: ['leadership'] },
    ];
    const tree = buildTree(seats);
    expect(tree[0].title).toBe('CEO');
    expect(tree[0].roles).toEqual(['leadership']);
  });
});

describe('getDescendantIds', () => {
  const seats: FlatSeat[] = [
    { id: 'root', parentSeatId: null },
    { id: 'child1', parentSeatId: 'root' },
    { id: 'child2', parentSeatId: 'root' },
    { id: 'grandchild1', parentSeatId: 'child1' },
    { id: 'grandchild2', parentSeatId: 'child1' },
    { id: 'greatgrand', parentSeatId: 'grandchild1' },
  ];
  const tree = buildTree(seats);

  it('returns all descendants of root', () => {
    const ids = getDescendantIds(tree, 'root');
    expect(ids.sort()).toEqual([
      'child1', 'child2', 'grandchild1', 'grandchild2', 'greatgrand',
    ].sort());
  });

  it('returns descendants of a middle node', () => {
    const ids = getDescendantIds(tree, 'child1');
    expect(ids.sort()).toEqual(['grandchild1', 'grandchild2', 'greatgrand'].sort());
  });

  it('returns empty array for a leaf node', () => {
    const ids = getDescendantIds(tree, 'greatgrand');
    expect(ids).toEqual([]);
  });

  it('returns empty array for missing id', () => {
    const ids = getDescendantIds(tree, 'nonexistent');
    expect(ids).toEqual([]);
  });
});
