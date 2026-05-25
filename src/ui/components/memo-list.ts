import type { QuickMemo, GroupedMemos } from "../../lib/index";
import { formatSolarDate } from "../../lib/index";
import { MONTH_NAMES_SHORT } from "../types";
import type { AppState } from "../state";

/** Render memo list grouped by title */
export function renderMemoList(
  container: HTMLElement,
  state: AppState,
  onEdit: (memo: QuickMemo) => void,
  onDelete: (memo: QuickMemo) => void,
  onCreate: () => void,
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "memo-list";

  const h2 = document.createElement("h2");
  h2.textContent = "Memo";
  section.appendChild(h2);

  const groups = state.getMemosGroupedByTitle();

  if (groups.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <div class="empty-state-icon">
        <img src="assets/images/ico-events.svg" alt="" style="width: 48px; height: 48px; opacity: 0.25;">
      </div>
      <p>Chưa có memo nào</p>
      <button class="btn btn-primary" id="empty-add-memo-btn">Tạo memo</button>
    `;
    section.appendChild(empty);
    container.appendChild(section);
    section
      .querySelector("#empty-add-memo-btn")
      ?.addEventListener("click", () => onCreate());
    return;
  }

  groups.forEach((group) => {
    section.appendChild(renderGroupCard(group, onEdit, onDelete));
  });

  container.appendChild(section);
}

function renderGroupCard(
  group: GroupedMemos,
  onEdit: (memo: QuickMemo) => void,
  onDelete: (memo: QuickMemo) => void,
): HTMLElement {
  const card = document.createElement("div");
  card.className = "memo-group";
  card.setAttribute("data-expanded", "false");

  const lastDateStr = formatSolarDate(group.lastDate);

  card.innerHTML = `
    <button class="memo-group-header" aria-expanded="false">
      <div class="memo-group-meta">
        <div class="memo-group-title">${escapeHtml(group.title)}</div>
        <div class="memo-group-sub">${group.memos.length} lần • lần cuối ${lastDateStr}</div>
      </div>
      <span class="memo-group-chevron" aria-hidden="true">›</span>
    </button>
    <div class="memo-group-entries" hidden></div>
  `;

  const entriesContainer = card.querySelector(
    ".memo-group-entries",
  ) as HTMLElement;

  group.memos.forEach((memo) => {
    entriesContainer.appendChild(renderEntry(memo, onEdit, onDelete));
  });

  const header = card.querySelector(
    ".memo-group-header",
  ) as HTMLButtonElement;
  header.addEventListener("click", () => {
    const expanded = card.getAttribute("data-expanded") === "true";
    const next = !expanded;
    card.setAttribute("data-expanded", String(next));
    header.setAttribute("aria-expanded", String(next));
    if (next) {
      entriesContainer.removeAttribute("hidden");
    } else {
      entriesContainer.setAttribute("hidden", "");
    }
  });

  return card;
}

function renderEntry(
  memo: QuickMemo,
  onEdit: (memo: QuickMemo) => void,
  onDelete: (memo: QuickMemo) => void,
): HTMLElement {
  const entry = document.createElement("div");
  entry.className = "memo-entry";

  const noteHtml = memo.note.trim()
    ? `<div class="memo-entry-note">${escapeHtml(memo.note)}</div>`
    : `<div class="memo-entry-note placeholder">Không có ghi chú</div>`;

  entry.innerHTML = `
    <div class="upcoming-date-badge">
      <span class="month">${MONTH_NAMES_SHORT[memo.solarDate.month - 1]}</span>
      <span class="day">${memo.solarDate.day}</span>
    </div>
    <div class="memo-entry-body">
      ${noteHtml}
      <div class="memo-entry-date">${formatSolarDate(memo.solarDate)}</div>
    </div>
    <div class="memo-entry-actions">
      <button class="icon-btn" data-action="edit" aria-label="Sửa memo">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="icon-btn" data-action="delete" aria-label="Xóa memo">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
      </button>
    </div>
  `;

  entry
    .querySelector('[data-action="edit"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      onEdit(memo);
    });
  entry
    .querySelector('[data-action="delete"]')
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      onDelete(memo);
    });

  return entry;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
