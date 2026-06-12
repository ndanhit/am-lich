import type { Person, SolarDate } from "../../lib/index";
import {
  formatSolarDate,
  formatLunarDate,
  convertSolarToLunar,
} from "../../lib/index";
import { GENDER_LABELS } from "../types";
import { closeDetailPanel } from "./event-detail";

export { closeDetailPanel };

/** Render the family-tree person detail panel (bottom sheet). */
export function renderPersonDetail(
  container: HTMLElement,
  person: Person,
  spouse: Person | null,
  onEdit: (person: Person) => void,
  onAddChild: (person: Person) => void,
  onCreateGio: (person: Person) => void,
  onDelete: (person: Person) => void,
  onClose: () => void,
): void {
  container.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "detail-panel open";

  const metaRows: string[] = [];
  metaRows.push(metaRow("Giới tính", GENDER_LABELS[person.gender]));
  if (person.birthDate) {
    metaRows.push(metaRow("Ngày sinh", formatDateWithLunar(person.birthDate)));
  }
  if (person.deathDate) {
    metaRows.push(metaRow("Ngày mất", formatDateWithLunar(person.deathDate)));
  } else {
    metaRows.push(metaRow("Tình trạng", "Còn sống"));
  }
  if (spouse) {
    metaRows.push(metaRow("Vợ/Chồng", escapeHtml(spouse.name)));
  }
  if (person.notes.trim()) {
    metaRows.push(metaRow("Ghi chú", escapeHtml(person.notes)));
  }

  const gioBtn = person.deathDate
    ? `<button class="btn btn-secondary gio-btn">Tạo nhắc giỗ</button>`
    : "";

  panel.innerHTML = `
    <div class="modal-header">
      <button class="close-btn detail-panel-close" aria-label="Đóng">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="modal-title-text">${escapeHtml(person.name)}</div>
    </div>
    <div class="modal-body">
      <div class="detail-meta">
        ${metaRows.join("")}
      </div>
      <div class="detail-actions detail-actions-wrap">
        <button class="btn btn-secondary edit-btn">Sửa</button>
        <button class="btn btn-secondary add-child-btn">Thêm con</button>
        ${gioBtn}
        <button class="btn btn-danger delete-btn">Xóa</button>
      </div>
    </div>
  `;

  container.appendChild(panel);

  panel
    .querySelector(".detail-panel-close")!
    .addEventListener("click", onClose);
  panel.querySelector(".edit-btn")!.addEventListener("click", () => onEdit(person));
  panel
    .querySelector(".add-child-btn")!
    .addEventListener("click", () => onAddChild(person));
  panel
    .querySelector(".gio-btn")
    ?.addEventListener("click", () => onCreateGio(person));
  panel
    .querySelector(".delete-btn")!
    .addEventListener("click", () => onDelete(person));
}

function metaRow(label: string, value: string): string {
  return `
    <div class="detail-meta-item">
      <span class="label">${label}</span>
      <span>${value}</span>
    </div>`;
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
