export type FlatSeat = {
  id: string;
  parentSeatId: string | null;
  [key: string]: unknown;
};

export type TreeNode = FlatSeat & {
  children: TreeNode[];
};

/**
 * Builds a tree structure from a flat array of seats.
 * Top-level nodes have parentSeatId === null.
 * Orphans (seats whose parent isn't in the array) become top-level.
 */
export function buildTree(seats: FlatSeat[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Create tree nodes
  for (const seat of seats) {
    map.set(seat.id, { ...seat, children: [] });
  }

  // Link children to parents
  for (const node of map.values()) {
    if (node.parentSeatId && map.has(node.parentSeatId)) {
      map.get(node.parentSeatId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Returns all descendant seat IDs (children, grandchildren, etc.)
 * for the given seatId. Does not include the seatId itself.
 * Returns empty array if seatId is not found.
 */
export function getDescendantIds(
  tree: TreeNode[],
  seatId: string
): string[] {
  // Find the node in the tree
  const target = findNode(tree, seatId);
  if (!target) return [];
  return collectIds(target.children);
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function collectIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectIds(node.children));
  }
  return ids;
}
