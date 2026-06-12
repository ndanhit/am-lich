import type { Person, FamilyTreeNode } from "../../lib/index";
import { countDescendants, collectCollapsibleIds } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const AUTO_COLLAPSE_THRESHOLD = 15; // blood-node count above which we auto-collapse
const AUTO_COLLAPSE_FROM_DEPTH = 2; // collapse generations at depth >= 2 (show ~3 levels)

// Session-only view state (persists across re-renders, not across reloads).
let zoomLevel = 1;
const collapsedIds = new Set<string>();
let collapseInitialized = false;

/** Render the family-tree (gia phả) view as a top-down genealogy chart. */
export function renderFamilyTree(
  container: HTMLElement,
  state: AppState,
  onSelect: (person: Person) => void,
  onCreate: () => void,
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "family-tree";

  const roots = state.getFamilyTree();

  if (roots.length === 0) {
    collapseInitialized = false;
    const h2 = document.createElement("h2");
    h2.textContent = "Gia phả";
    section.appendChild(h2);
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state-icon">
        <img src="assets/images/ico-events.svg" alt="" style="width: 48px; height: 48px; opacity: 0.25;">
      </div>
      <p>Chưa có thành viên nào trong gia phả</p>
      <button class="btn btn-primary" id="empty-add-person-btn">Thêm thành viên</button>
    `;
    section.appendChild(empty);
    container.appendChild(section);
    section
      .querySelector("#empty-add-person-btn")
      ?.addEventListener("click", () => onCreate());
    return;
  }

  // Auto-collapse deep generations once per session for large trees.
  if (!collapseInitialized) {
    collapseInitialized = true;
    const total = roots.reduce((n, r) => n + 1 + countDescendants(r), 0);
    if (total > AUTO_COLLAPSE_THRESHOLD) {
      for (const id of collectCollapsibleIds(roots, AUTO_COLLAPSE_FROM_DEPTH)) {
        collapsedIds.add(id);
      }
    }
  }

  const peopleById = new Map(state.getPeople().map((p) => [p.id, p]));
  const cb: NodeCallbacks = { onSelect, peopleById };

  // Header: title + controls (collapse all / expand all / zoom / fit).
  const header = document.createElement("div");
  header.className = "family-tree-header";
  header.innerHTML = `
    <h2>Gia phả</h2>
    <div class="tree-controls">
      <button class="tree-ctrl-btn" id="collapse-all" title="Thu gọn tất cả" aria-label="Thu gọn tất cả">⊟</button>
      <button class="tree-ctrl-btn" id="expand-all" title="Mở tất cả" aria-label="Mở tất cả">⊞</button>
      <span class="tree-ctrl-sep"></span>
      <button class="tree-ctrl-btn" id="zoom-out" title="Thu nhỏ" aria-label="Thu nhỏ">−</button>
      <button class="tree-ctrl-btn tree-zoom-label" id="zoom-fit" title="Vừa màn hình" aria-label="Vừa màn hình">100%</button>
      <button class="tree-ctrl-btn" id="zoom-in" title="Phóng to" aria-label="Phóng to">+</button>
    </div>
  `;
  section.appendChild(header);

  const scroll = document.createElement("div");
  scroll.className = "tree-scroll";
  section.appendChild(scroll);
  container.appendChild(section);

  const label = header.querySelector("#zoom-fit") as HTMLElement;

  const applyZoom = (): void => {
    const tree = scroll.querySelector(".tree") as HTMLElement | null;
    if (tree) tree.style.setProperty("zoom", String(zoomLevel));
    label.textContent = `${Math.round(zoomLevel * 100)}%`;
  };
  const setZoom = (next: number): void => {
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    applyZoom();
  };

  const buildTree = (): void => {
    scroll.innerHTML = "";
    const tree = document.createElement("ul");
    tree.className = "tree";
    for (const root of roots) tree.appendChild(renderNode(root, cb));
    scroll.appendChild(tree);
    applyZoom();
  };
  buildTree();

  // --- Collapse / expand all ---
  header.querySelector("#collapse-all")!.addEventListener("click", () => {
    collapsedIds.clear();
    for (const id of collectCollapsibleIds(roots, 0)) collapsedIds.add(id);
    buildTree();
  });
  header.querySelector("#expand-all")!.addEventListener("click", () => {
    collapsedIds.clear();
    buildTree();
  });

  // --- Zoom controls ---
  header
    .querySelector("#zoom-in")!
    .addEventListener("click", () => setZoom(zoomLevel + 0.1));
  header
    .querySelector("#zoom-out")!
    .addEventListener("click", () => setZoom(zoomLevel - 0.1));
  header.querySelector("#zoom-fit")!.addEventListener("click", () => {
    const tree = scroll.querySelector(".tree") as HTMLElement | null;
    if (!tree) return;
    tree.style.setProperty("zoom", "1");
    const natural = tree.scrollWidth;
    const avail = scroll.clientWidth;
    setZoom(natural > 0 ? Math.min(1, avail / natural) : 1);
  });

  // --- Pinch-to-zoom ---
  let pinchStartDist = 0;
  let pinchStartZoom = 1;
  scroll.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) {
        pinchStartDist = touchDistance(e.touches);
        pinchStartZoom = zoomLevel;
      }
    },
    { passive: true },
  );
  scroll.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        e.preventDefault();
        setZoom((pinchStartZoom * touchDistance(e.touches)) / pinchStartDist);
      }
    },
    { passive: false },
  );
  scroll.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinchStartDist = 0;
  });

  // --- Drag-to-pan (mouse / single pointer) ---
  enableDragPan(scroll);
}

type NodeCallbacks = {
  onSelect: (person: Person) => void;
  peopleById: Map<string, Person>;
};

function touchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

/** Click-and-drag to pan the scroll area (desktop). Suppresses click after a drag. */
function enableDragPan(scroll: HTMLElement): void {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  scroll.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // touch uses native scroll
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = scroll.scrollLeft;
    startTop = scroll.scrollTop;
  });
  scroll.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) > 4) {
      moved = true;
      scroll.classList.add("dragging");
    }
    if (moved) {
      scroll.scrollLeft = startLeft - dx;
      scroll.scrollTop = startTop - dy;
    }
  });
  const end = (e: PointerEvent) => {
    if (moved) {
      // Swallow the click that follows a drag so a node isn't opened.
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      scroll.addEventListener("click", swallow, { capture: true, once: true });
    }
    dragging = false;
    moved = false;
    scroll.classList.remove("dragging");
    void e;
  };
  scroll.addEventListener("pointerup", end);
  scroll.addEventListener("pointerleave", end);
}

function renderNode(node: FamilyTreeNode, cb: NodeCallbacks): HTMLElement {
  const { person } = node;
  const li = document.createElement("li");
  li.className = "tree-node";

  const couple = document.createElement("div");
  couple.className = "tree-couple";
  couple.appendChild(makeBox(person, cb));

  // Attach the married-in spouse to the right of this blood node.
  const spouse =
    person.spouseId != null ? cb.peopleById.get(person.spouseId) : undefined;
  if (spouse && spouse.isMarriedIn && spouse.id !== person.id) {
    const link = document.createElement("span");
    link.className = "tree-couple-link";
    link.textContent = "⚭";
    couple.appendChild(link);
    couple.appendChild(makeBox(spouse, cb));
  }

  li.appendChild(couple);

  if (node.children.length > 0) {
    const isCollapsed = collapsedIds.has(person.id);
    if (isCollapsed) li.classList.add("collapsed");

    const descendants = countDescendants(node);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "tree-toggle";
    toggle.textContent = isCollapsed ? `+${descendants}` : "−";
    toggle.setAttribute(
      "aria-label",
      isCollapsed ? "Mở rộng nhánh" : "Thu gọn nhánh",
    );
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const nowCollapsed = !li.classList.contains("collapsed");
      li.classList.toggle("collapsed", nowCollapsed);
      if (nowCollapsed) collapsedIds.add(person.id);
      else collapsedIds.delete(person.id);
      toggle.textContent = nowCollapsed ? `+${descendants}` : "−";
      toggle.setAttribute(
        "aria-label",
        nowCollapsed ? "Mở rộng nhánh" : "Thu gọn nhánh",
      );
    });
    li.appendChild(toggle);

    const childrenList = document.createElement("ul");
    for (const child of node.children) {
      childrenList.appendChild(renderNode(child, cb));
    }
    li.appendChild(childrenList);
  }

  return li;
}

/** A compact, clickable node box: name + gender icon (outline) after the name. */
function makeBox(person: Person, cb: NodeCallbacks): HTMLElement {
  const box = document.createElement("button");
  box.type = "button";
  box.className = `tree-node-box gender-${person.gender}`;
  box.setAttribute(
    "aria-label",
    `Chi tiết ${person.name} (${GENDER_LABELS[person.gender]})`,
  );
  box.innerHTML = `<span class="tree-name-text">${escapeHtml(person.name)}</span>`;
  box.addEventListener("click", () => cb.onSelect(person));
  return box;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
