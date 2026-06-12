import type { Person, FamilyTreeNode, SolarDate } from "../../lib/index";
import { formatSolarDate, formatLunarDate, convertSolarToLunar } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

/** Render the family-tree (gia phả) view. */
export function renderFamilyTree(
  container: HTMLElement,
  state: AppState,
  onEdit: (person: Person) => void,
  onDelete: (person: Person) => void,
  onCreate: () => void,
  onAddChild: (parent: Person) => void,
  onCreateGio: (person: Person) => void,
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "family-tree";

  const h2 = document.createElement("h2");
  h2.textContent = "Gia phả";
  section.appendChild(h2);

  const roots = state.getFamilyTree();

  if (roots.length === 0) {
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

  // Lookup for resolving spouse names inline.
  const peopleById = new Map(state.getPeople().map((p) => [p.id, p]));

  const treeRoot = document.createElement("div");
  treeRoot.className = "family-tree-root";
  for (const root of roots) {
    treeRoot.appendChild(
      renderNode(root, peopleById, {
        onEdit,
        onDelete,
        onAddChild,
        onCreateGio,
      }),
    );
  }
  section.appendChild(treeRoot);
  container.appendChild(section);
}

type NodeCallbacks = {
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onAddChild: (parent: Person) => void;
  onCreateGio: (person: Person) => void;
};

function renderNode(
  node: FamilyTreeNode,
  peopleById: Map<string, Person>,
  cb: NodeCallbacks,
): HTMLElement {
  const { person } = node;
  const wrapper = document.createElement("div");
  wrapper.className = "tree-node";
  wrapper.style.setProperty("--depth", String(node.depth));

  const spouse =
    person.spouseId != null ? peopleById.get(person.spouseId) : undefined;
  const spouseHtml = spouse
    ? `<span class="tree-spouse">⚭ ${escapeHtml(spouse.name)}</span>`
    : "";

  const birthHtml = person.birthDate
    ? `<div class="tree-date">Sinh: ${formatDateWithLunar(person.birthDate)}</div>`
    : "";
  const deathHtml = person.deathDate
    ? `<div class="tree-date">Mất: ${formatDateWithLunar(person.deathDate)}</div>`
    : `<div class="tree-date tree-alive">Còn sống</div>`;

  const gioBtn = person.deathDate
    ? `<button class="icon-btn" data-action="gio" aria-label="Tạo nhắc giỗ" title="Tạo nhắc giỗ">
         <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
           <path d="M12 2C8 6 8 10 12 14c4-4 4-8 0-12z"></path>
           <path d="M6 14a6 6 0 0 0 12 0c0-2-1-4-3-6"></path>
         </svg>
       </button>`
    : "";

  const card = document.createElement("div");
  card.className = "tree-card";
  card.innerHTML = `
    <div class="tree-card-main">
      <div class="tree-name">
        ${escapeHtml(person.name)}
        <span class="tree-gender">${GENDER_LABELS[person.gender]}</span>
        ${spouseHtml}
      </div>
      ${birthHtml}
      ${deathHtml}
    </div>
    <div class="tree-card-actions">
      <button class="icon-btn" data-action="add-child" aria-label="Thêm con" title="Thêm con">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      ${gioBtn}
      <button class="icon-btn" data-action="edit" aria-label="Sửa thành viên" title="Sửa">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="delete" aria-label="Xóa thành viên" title="Xóa">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
      </button>
    </div>
  `;

  card
    .querySelector('[data-action="edit"]')
    ?.addEventListener("click", () => cb.onEdit(person));
  card
    .querySelector('[data-action="delete"]')
    ?.addEventListener("click", () => cb.onDelete(person));
  card
    .querySelector('[data-action="add-child"]')
    ?.addEventListener("click", () => cb.onAddChild(person));
  card
    .querySelector('[data-action="gio"]')
    ?.addEventListener("click", () => cb.onCreateGio(person));

  wrapper.appendChild(card);

  if (node.children.length > 0) {
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "tree-children";
    for (const child of node.children) {
      childrenContainer.appendChild(renderNode(child, peopleById, cb));
    }
    wrapper.appendChild(childrenContainer);
  }

  return wrapper;
}

/**
 * Format a solar date with its lunar equivalent when available.
 * Dates outside the converter's supported range fall back to solar only.
 */
function formatDateWithLunar(date: SolarDate): string {
  const solar = formatSolarDate(date);
  const lunar = convertSolarToLunar(date.year, date.month, date.day);
  return lunar ? `${solar} (${formatLunarDate(lunar)})` : solar;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
