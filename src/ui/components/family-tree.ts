import type { Person, FamilyTreeNode } from "../../lib/index";
import { GENDER_LABELS, GENDER_ICONS } from "../types";
import type { AppState } from "../state";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
// Persisted across re-renders (component rebuilds DOM whenever state changes).
let zoomLevel = 1;

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

  const peopleById = new Map(state.getPeople().map((p) => [p.id, p]));

  // Determine which people are rendered attached to a partner (so they are not
  // also drawn as a standalone root). Only "married-in" spouses (parentId null)
  // are attached; the blood-line member stays as the structural node.
  const attachedSpouseIds = computeAttachedSpouses(state.getPeople(), peopleById);

  // Header row: title + zoom controls.
  const header = document.createElement("div");
  header.className = "family-tree-header";
  header.innerHTML = `
    <h2>Gia phả</h2>
    <div class="tree-zoom-controls">
      <button class="zoom-btn" id="zoom-out" aria-label="Thu nhỏ" title="Thu nhỏ">−</button>
      <button class="zoom-level" id="zoom-reset" aria-label="Đặt lại 100%" title="Đặt lại">100%</button>
      <button class="zoom-btn" id="zoom-in" aria-label="Phóng to" title="Phóng to">+</button>
    </div>
  `;
  section.appendChild(header);

  const cb: NodeCallbacks = { onSelect, attachedSpouseIds, peopleById };

  const scroll = document.createElement("div");
  scroll.className = "tree-scroll";

  const tree = document.createElement("ul");
  tree.className = "tree";
  for (const root of roots) {
    if (attachedSpouseIds.has(root.person.id)) continue;
    tree.appendChild(renderNode(root, cb));
  }
  scroll.appendChild(tree);
  section.appendChild(scroll);
  container.appendChild(section);

  // --- Zoom wiring ---
  const label = header.querySelector("#zoom-reset") as HTMLElement;
  const applyZoom = () => {
    tree.style.transform = `scale(${zoomLevel})`;
    tree.style.transformOrigin = "top center";
    label.textContent = `${Math.round(zoomLevel * 100)}%`;
  };
  const setZoom = (next: number) => {
    zoomLevel = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    applyZoom();
  };
  header
    .querySelector("#zoom-in")!
    .addEventListener("click", () => setZoom(zoomLevel + 0.1));
  header
    .querySelector("#zoom-out")!
    .addEventListener("click", () => setZoom(zoomLevel - 0.1));
  header
    .querySelector("#zoom-reset")!
    .addEventListener("click", () => setZoom(1));

  // Pinch-to-zoom on touch devices.
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
        const ratio = touchDistance(e.touches) / pinchStartDist;
        setZoom(pinchStartZoom * ratio);
      }
    },
    { passive: false },
  );
  scroll.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinchStartDist = 0;
  });

  applyZoom();
}

type NodeCallbacks = {
  onSelect: (person: Person) => void;
  attachedSpouseIds: Set<string>;
  peopleById: Map<string, Person>;
};

/**
 * Pick which spouse is drawn attached (to the right) of their partner. Only a
 * spouse with parentId === null is attachable; the partner reached first in
 * iteration claims it. The guard prevents two spouses from each claiming the
 * other (which would drop both from the tree).
 */
function computeAttachedSpouses(
  people: Person[],
  peopleById: Map<string, Person>,
): Set<string> {
  const attached = new Set<string>();
  for (const p of people) {
    if (attached.has(p.id)) continue;
    if (p.spouseId == null) continue;
    const spouse = peopleById.get(p.spouseId);
    if (
      spouse &&
      spouse.id !== p.id &&
      spouse.parentId == null &&
      !attached.has(spouse.id)
    ) {
      attached.add(spouse.id);
    }
  }
  return attached;
}

function touchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function renderNode(node: FamilyTreeNode, cb: NodeCallbacks): HTMLElement {
  const { person } = node;
  const li = document.createElement("li");

  const couple = document.createElement("div");
  couple.className = "tree-couple";
  couple.appendChild(makeBox(person, cb));

  // Attach married-in spouse to the right of this person.
  const spouse =
    person.spouseId != null ? cb.peopleById.get(person.spouseId) : undefined;
  if (spouse && spouse.parentId == null && spouse.id !== person.id) {
    const link = document.createElement("span");
    link.className = "tree-couple-link";
    link.textContent = "⚭";
    couple.appendChild(link);
    couple.appendChild(makeBox(spouse, cb));
  }

  li.appendChild(couple);

  if (node.children.length > 0) {
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
  box.setAttribute("aria-label", `Chi tiết ${person.name}`);
  box.innerHTML = `
    <span class="tree-name-text">${escapeHtml(person.name)}</span>
    <span class="tree-gender-icon gender-${person.gender}" title="${GENDER_LABELS[person.gender]}" aria-hidden="true">${GENDER_ICONS[person.gender]}</span>
  `;
  box.addEventListener("click", () => cb.onSelect(person));
  return box;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
