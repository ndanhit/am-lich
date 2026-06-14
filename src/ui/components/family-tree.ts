import type { Person, FamilyTreeNode, FamilyTree } from "../../lib/index";
import { countDescendants, collectCollapsibleIds } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
// Read-only viewers open at a legible zoom rather than the full-tree overview.
const MIN_READABLE_ZOOM = 0.6;
const AUTO_COLLAPSE_THRESHOLD = 15; // blood-node count above which we auto-collapse
const AUTO_COLLAPSE_FROM_DEPTH = 2; // collapse generations at depth >= 2 (show ~3 levels)

// Session-only view state (persists across re-renders, not across reloads).
let zoomLevel = 1;
let collapsedIds = new Set<string>();
let collapseInitialized = false;
let lastTreeId: string | null = null;
// Auto fit-to-width once when a tree first opens (esp. wide trees on desktop).
let autoFitPending = false;
// View orientation is a user preference, kept across trees within a session.
let orientation: "vertical" | "horizontal" = "vertical";

/** Render the family-tree (gia phả) view as a top-down genealogy chart. */
export function renderFamilyTree(
  container: HTMLElement,
  state: AppState,
  family: FamilyTree,
  onSelect: (person: Person) => void,
  onCreate: () => void,
  onBack: () => void,
  onSearch: () => void,
  onGio: () => void,
  opts: { onPhaKy?: () => void; readOnly?: boolean } = {},
): void {
  const { onPhaKy, readOnly = false } = opts;
  container.innerHTML = "";

  // Reset view state when switching to a different tree.
  if (family.id !== lastTreeId) {
    lastTreeId = family.id;
    zoomLevel = 1;
    collapsedIds = new Set<string>();
    collapseInitialized = false;
    autoFitPending = true;
  }

  const section = document.createElement("div");
  section.className = "family-tree";

  const roots = state.getFamilyTree();

  if (roots.length === 0) {
    collapseInitialized = false;
    const backHeader = document.createElement("div");
    backHeader.className = "family-tree-header";
    backHeader.innerHTML = readOnly
      ? ""
      : `<button class="tree-back-btn" id="tree-back">← ${escapeHtml(family.name)}</button>`;
    backHeader
      .querySelector("#tree-back")
      ?.addEventListener("click", () => onBack());
    section.appendChild(backHeader);
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

  // Header: back to list + orientation toggle.
  const header = document.createElement("div");
  header.className = "family-tree-header";
  header.innerHTML = `
    ${readOnly ? "" : `<button class="tree-back-btn" id="tree-back" title="Danh sách gia phả">← ${escapeHtml(family.name)}</button>`}
    <div class="tree-header-actions">
      <button class="tree-ctrl-btn" id="tree-search" title="Tìm thành viên" aria-label="Tìm thành viên">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <button class="tree-ctrl-btn" id="tree-gio" title="Lịch giỗ" aria-label="Lịch giỗ">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C8 6 8 10 12 14c4-4 4-8 0-12z"></path>
          <path d="M6 14a6 6 0 0 0 12 0c0-2-1-4-3-6"></path>
        </svg>
      </button>
      ${onPhaKy ? `<button class="tree-ctrl-btn" id="tree-phaky" title="Xem phả ký" aria-label="Xem phả ký">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </button>` : ""}
      <button class="tree-ctrl-btn tree-orient-btn" id="tree-orient"></button>
    </div>
  `;
  section.appendChild(header);

  const scroll = document.createElement("div");
  scroll.className = "tree-scroll";
  section.appendChild(scroll);

  // Floating control bar (collapse/expand + zoom) at the bottom-right corner.
  const fab = document.createElement("div");
  fab.className = "tree-fab";
  fab.innerHTML = `
    <button class="tree-ctrl-btn" id="collapse-all" title="Thu gọn tất cả" aria-label="Thu gọn tất cả">⊟</button>
    <button class="tree-ctrl-btn" id="expand-all" title="Mở tất cả" aria-label="Mở tất cả">⊞</button>
    <span class="tree-ctrl-sep"></span>
    <button class="tree-ctrl-btn" id="zoom-out" title="Thu nhỏ" aria-label="Thu nhỏ">−</button>
    <button class="tree-ctrl-btn tree-zoom-label" id="zoom-fit" title="Vừa màn hình" aria-label="Vừa màn hình">100%</button>
    <button class="tree-ctrl-btn" id="zoom-in" title="Phóng to" aria-label="Phóng to">+</button>
  `;
  section.appendChild(fab);

  container.appendChild(section);

  header.querySelector("#tree-back")?.addEventListener("click", () => onBack());
  header.querySelector("#tree-search")!.addEventListener("click", () => onSearch());
  header.querySelector("#tree-gio")!.addEventListener("click", () => onGio());
  if (onPhaKy) {
    header.querySelector("#tree-phaky")!.addEventListener("click", () => onPhaKy());
  }

  // Orientation toggle (xem ngang / xem dọc).
  const orientBtn = header.querySelector("#tree-orient") as HTMLElement;
  const updateOrientBtn = (): void => {
    // Icon-only to keep the header from overflowing on narrow screens; the
    // full label lives in the tooltip / accessible name.
    const next = orientation === "vertical" ? "Xem ngang" : "Xem dọc";
    orientBtn.textContent = orientation === "vertical" ? "⇄" : "⇅";
    orientBtn.title = next;
    orientBtn.setAttribute("aria-label", next);
  };
  updateOrientBtn();
  orientBtn.addEventListener("click", () => {
    orientation = orientation === "vertical" ? "horizontal" : "vertical";
    updateOrientBtn();
    buildTree();
  });

  const label = fab.querySelector("#zoom-fit") as HTMLElement;

  const applyZoom = (): void => {
    const tree = scroll.querySelector(".tree") as HTMLElement | null;
    if (tree) tree.style.setProperty("zoom", String(zoomLevel));
    label.textContent = `${Math.round(zoomLevel * 100)}%`;
  };
  const setZoom = (next: number): void => {
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    applyZoom();
  };

  // Track whether the current zoom value came from an auto-fit (vs. a manual
  // user gesture). We re-fit on resize ONLY while this flag is true so the
  // tree adapts when the detail panel slides in, but never overrides a zoom
  // the user explicitly set.
  let autoFitActive = false;
  let manualSetZoom: ((next: number) => void) | null = null;

  const centerHorizontally = (): void => {
    if (scroll.scrollWidth > scroll.clientWidth) {
      scroll.scrollLeft = (scroll.scrollWidth - scroll.clientWidth) / 2;
    }
    scroll.scrollTop = 0;
  };

  // Scale the tree down so its natural width fits the visible scroll area
  // (never scales up past 100%).
  const fitToWidth = (): void => {
    const tree = scroll.querySelector(".tree") as HTMLElement | null;
    if (!tree) return;
    tree.style.setProperty("zoom", "1");
    const natural = tree.scrollWidth;
    const avail = scroll.clientWidth;
    autoFitActive = true;
    setZoom(natural > 0 ? Math.min(1, avail / natural) : 1);
    autoFitActive = true;
    requestAnimationFrame(centerHorizontally);
  };

  // Read-only viewers open at a legible zoom: fit the width but never shrink
  // below MIN_READABLE_ZOOM (they pan/pinch to explore instead of squinting).
  // Small trees that already fit are shown at 100% — no point shrinking them.
  const fitReadable = (): void => {
    const tree = scroll.querySelector(".tree") as HTMLElement | null;
    if (!tree) return;
    tree.style.setProperty("zoom", "1");
    const natural = tree.scrollWidth;
    const avail = scroll.clientWidth;
    autoFitActive = true;
    if (natural === 0 || natural <= avail) {
      setZoom(1);
    } else {
      setZoom(Math.max(MIN_READABLE_ZOOM, avail / natural));
    }
    autoFitActive = true;
    requestAnimationFrame(centerHorizontally);
  };

  // Any setZoom call from a user gesture should turn off the auto-fit flag
  // so subsequent ResizeObserver ticks don't override the user's choice.
  manualSetZoom = (next: number): void => {
    autoFitActive = false;
    setZoom(next);
  };

  const buildTree = (): void => {
    scroll.innerHTML = "";
    const tree = document.createElement("ul");
    tree.className =
      orientation === "horizontal" ? "tree horizontal" : "tree";
    for (const root of roots) tree.appendChild(renderNode(root, cb));
    scroll.appendChild(tree);
    applyZoom();
    // On first open of a tree, auto fit-to-width so wide trees are legible
    // without manual zooming (especially when opening a share link on desktop).
    if (autoFitPending) {
      autoFitPending = false;
      if (readOnly) fitReadable();
      else fitToWidth();
    }
  };
  buildTree();

  // --- Collapse / expand all ---
  fab.querySelector("#collapse-all")!.addEventListener("click", () => {
    collapsedIds.clear();
    for (const id of collectCollapsibleIds(roots, 0)) collapsedIds.add(id);
    buildTree();
  });
  fab.querySelector("#expand-all")!.addEventListener("click", () => {
    collapsedIds.clear();
    buildTree();
  });

  // --- Zoom controls ---
  fab
    .querySelector("#zoom-in")!
    .addEventListener("click", () => manualSetZoom!(zoomLevel + 0.1));
  fab
    .querySelector("#zoom-out")!
    .addEventListener("click", () => manualSetZoom!(zoomLevel - 0.1));
  fab.querySelector("#zoom-fit")!.addEventListener("click", () => fitToWidth());

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
        manualSetZoom!(
          (pinchStartZoom * touchDistance(e.touches)) / pinchStartDist,
        );
      }
    },
    { passive: false },
  );
  scroll.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinchStartDist = 0;
  });

  // --- Ctrl/Cmd + wheel zoom (desktop) ---
  scroll.addEventListener(
    "wheel",
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.1 : 0.1;
      manualSetZoom!(zoomLevel + step);
    },
    { passive: false },
  );

  // --- Re-fit when the scroll width changes (detail panel open/close, window
  // resize). Only while auto-fit is active so we never override a user zoom. ---
  let resizeTimer: number | null = null;
  const ro = new ResizeObserver(() => {
    if (!autoFitActive) return;
    if (resizeTimer != null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      if (!autoFitActive) return;
      if (readOnly) fitReadable();
      else fitToWidth();
    }, 150);
  });
  ro.observe(scroll);

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
    const spouseBox = makeBox(spouse, cb);
    spouseBox.classList.add("tree-spouse-box");
    couple.appendChild(spouseBox);
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
  const deceased = person.isDeceased || person.deathLunar != null;
  box.className = `tree-node-box gender-${person.gender}${deceased ? " deceased" : ""}`;
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
