import type { Person, FamilyTreeNode } from "../../core/models/types";

/**
 * Compare two people by birthDate ascending (older first) for sibling ordering.
 * People without a birth year sort last; within the same year, an unknown
 * month/day sorts after a known one.
 */
function compareByBirth(a: Person, b: Person): number {
  const da = a.birthDate;
  const db = b.birthDate;
  if (da && db) {
    if (da.year !== db.year) return da.year - db.year;
    const ma = da.month ?? 13;
    const mb = db.month ?? 13;
    if (ma !== mb) return ma - mb;
    return (da.day ?? 32) - (db.day ?? 32);
  }
  if (da && !db) return -1;
  if (!da && db) return 1;
  return 0;
}

/**
 * Build a hierarchical family tree from a flat Person[] list.
 *
 * - A person whose parentId is null — or points at a non-existent person
 *   (dangling) — becomes a root.
 * - Children are attached under their parent node.
 * - depth is assigned via DFS from each root.
 * - Children and roots are sorted by birthDate ascending (unknown last).
 * - Cycles in the data (A.parent=B, B.parent=A) are broken using a visited
 *   set so traversal always terminates.
 */
export function buildFamilyTree(allPeople: Person[]): FamilyTreeNode[] {
  // Only blood-line people form the structural tree; married-in spouses are
  // rendered attached to their partner, never as roots/children.
  const people = allPeople.filter((p) => !p.isMarriedIn);

  const nodeMap = new Map<string, FamilyTreeNode>();
  for (const person of people) {
    nodeMap.set(person.id, { person, children: [], depth: 0 });
  }

  const roots: FamilyTreeNode[] = [];
  for (const person of people) {
    const node = nodeMap.get(person.id)!;
    const parentNode =
      person.parentId != null ? nodeMap.get(person.parentId) : undefined;
    if (parentNode && parentNode.person.id !== person.id) {
      parentNode.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Assign depth + break cycles via DFS from roots.
  const visited = new Set<string>();
  const assignDepth = (node: FamilyTreeNode, depth: number): void => {
    if (visited.has(node.person.id)) {
      // Cycle detected — cut this branch to avoid infinite recursion.
      node.children = [];
      return;
    }
    visited.add(node.person.id);
    node.depth = depth;
    node.children.sort((a, b) => compareByBirth(a.person, b.person));
    for (const child of node.children) {
      assignDepth(child, depth + 1);
    }
  };

  roots.sort((a, b) => compareByBirth(a.person, b.person));
  for (const root of roots) {
    assignDepth(root, 0);
  }

  // Any node never reached (part of a pure cycle with no root) is promoted to
  // a root so no person silently disappears from the tree.
  for (const person of people) {
    if (!visited.has(person.id)) {
      const node = nodeMap.get(person.id)!;
      node.children = [];
      node.depth = 0;
      roots.push(node);
      visited.add(person.id);
    }
  }

  return roots;
}

/**
 * Returns the set of ids that are descendants of `id` (children, grandchildren,
 * ...), NOT including `id` itself. Used by the form to prevent choosing a
 * descendant as a person's parent (which would create a cycle).
 */
export function getDescendantIds(people: Person[], id: string): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const p of people) {
    if (p.parentId != null) {
      const list = childrenByParent.get(p.parentId) ?? [];
      list.push(p.id);
      childrenByParent.set(p.parentId, list);
    }
  }

  const result = new Set<string>();
  const stack = [...(childrenByParent.get(id) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) continue;
    result.add(current);
    for (const child of childrenByParent.get(current) ?? []) {
      stack.push(child);
    }
  }
  return result;
}

/** Count all descendants (children, grandchildren, ...) under a tree node. */
export function countDescendants(node: FamilyTreeNode): number {
  let total = 0;
  for (const child of node.children) {
    total += 1 + countDescendants(child);
  }
  return total;
}

/**
 * Collect ids of nodes that have children and sit at depth >= minDepth.
 * Used to drive expand/collapse (auto-collapse deep generations; collapse-all).
 */
export function collectCollapsibleIds(
  roots: FamilyTreeNode[],
  minDepth: number,
): string[] {
  const ids: string[] = [];
  const visit = (node: FamilyTreeNode): void => {
    if (node.children.length > 0 && node.depth >= minDepth) {
      ids.push(node.person.id);
    }
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return ids;
}
