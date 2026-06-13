import type { FamilyTree } from "../../lib/index";
import type { AppState } from "../state";

export type FamilyListCallbacks = {
  onOpen: (family: FamilyTree) => void;
  onCreate: () => void;
  onEdit: (family: FamilyTree) => void;
  onDelete: (family: FamilyTree) => void;
  onShare: (family: FamilyTree) => void;
  onSharedWithMe: () => void;
};

/** Render the list of family trees (gia phả) the user owns. */
export function renderFamilyList(
  container: HTMLElement,
  state: AppState,
  cb: FamilyListCallbacks,
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "family-list";

  const header = document.createElement("div");
  header.className = "family-tree-header";
  header.innerHTML = `
    <h2>Gia phả</h2>
    <div class="tree-header-actions">
      <button class="btn btn-secondary" id="shared-with-me-btn">Được chia sẻ</button>
      <button class="btn btn-primary" id="create-family-btn">Tạo</button>
    </div>
  `;
  section.appendChild(header);
  header
    .querySelector("#create-family-btn")!
    .addEventListener("click", () => cb.onCreate());
  header
    .querySelector("#shared-with-me-btn")!
    .addEventListener("click", () => cb.onSharedWithMe());

  const families = state.getFamilies();

  if (families.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state-icon">
        <img src="assets/images/ico-events.svg" alt="" style="width: 48px; height: 48px; opacity: 0.25;">
      </div>
      <p>Chưa có gia phả nào</p>
      <button class="btn btn-primary" id="empty-create-family-btn">Tạo gia phả</button>
    `;
    section.appendChild(empty);
    container.appendChild(section);
    empty
      .querySelector("#empty-create-family-btn")
      ?.addEventListener("click", () => cb.onCreate());
    return;
  }

  const list = document.createElement("div");
  list.className = "family-cards";
  for (const family of families) {
    list.appendChild(renderCard(family, state.countPeopleInTree(family.id), cb));
  }
  section.appendChild(list);
  container.appendChild(section);
}

function renderCard(
  family: FamilyTree,
  memberCount: number,
  cb: FamilyListCallbacks,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "family-card";

  const descHtml = family.description.trim()
    ? `<div class="family-card-desc">${escapeHtml(family.description)}</div>`
    : "";

  card.innerHTML = `
    <button class="family-card-main" aria-label="Mở gia phả ${escapeAttr(family.name)}">
      <div class="family-card-name">${escapeHtml(family.name)}</div>
      ${descHtml}
      <div class="family-card-sub">${memberCount} thành viên</div>
    </button>
    <div class="family-card-actions">
      <button class="icon-btn" data-action="share" aria-label="Chia sẻ gia phả" title="Chia sẻ">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
      <button class="icon-btn" data-action="edit" aria-label="Sửa gia phả" title="Sửa">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="delete" aria-label="Xóa gia phả" title="Xóa">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        </svg>
      </button>
    </div>
  `;

  card
    .querySelector(".family-card-main")!
    .addEventListener("click", () => cb.onOpen(family));
  card
    .querySelector('[data-action="share"]')!
    .addEventListener("click", () => cb.onShare(family));
  card
    .querySelector('[data-action="edit"]')!
    .addEventListener("click", () => cb.onEdit(family));
  card
    .querySelector('[data-action="delete"]')!
    .addEventListener("click", () => cb.onDelete(family));

  return card;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
