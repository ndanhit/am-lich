import type { Person, PartialDate } from "../../lib/index";
import {
  formatSolarDate,
  formatPartialDate,
  formatLunarDate,
  convertSolarToLunar,
} from "../../lib/index";
import { GENDER_LABELS } from "../types";
import { closeDetailPanel } from "./event-detail";

export { closeDetailPanel };

/** Callbacks for the person detail panel actions. */
export type PersonDetailCallbacks = {
  onEdit: (person: Person) => void;
  onAddChild: (person: Person) => void;
  onAddSpouse: (person: Person) => void;
  onAddParent: (person: Person) => void;
  onCreateGio: (person: Person) => void;
  onDelete: (person: Person) => void;
  onClose: () => void;
};

/** Render the family-tree person detail panel (bottom sheet). */
export function renderPersonDetail(
  container: HTMLElement,
  person: Person,
  spouse: Person | null,
  cb: PersonDetailCallbacks,
): void {
  container.innerHTML = "";

  const panel = document.createElement("div");
  panel.className = "detail-panel open";

  const metaRows: string[] = [];
  metaRows.push(metaRow("Giới tính", GENDER_LABELS[person.gender]));
  if (person.birthDate) {
    metaRows.push(metaRow("Ngày sinh", formatDateWithLunar(person.birthDate)));
  }
  const deceased = person.isDeceased || person.deathDate !== null;
  if (deceased) {
    metaRows.push(
      metaRow(
        "Ngày mất",
        person.deathDate ? formatDateWithLunar(person.deathDate) : "Không rõ",
      ),
    );
  } else {
    metaRows.push(metaRow("Tình trạng", "Còn sống"));
  }
  if (spouse) {
    metaRows.push(metaRow("Vợ/Chồng", escapeHtml(spouse.name)));
  }
  if (person.notes.trim()) {
    metaRows.push(metaRow("Ghi chú", escapeHtml(person.notes)));
  }

  // Conditional relationship actions.
  const canAddSpouse =
    !person.isMarriedIn &&
    (person.gender === "male" || person.gender === "female") &&
    person.spouseId == null;
  const spouseLabel = person.gender === "male" ? "Thêm vợ" : "Thêm chồng";
  const canAddParent = !person.isMarriedIn && person.parentId == null;

  const spouseBtn = canAddSpouse
    ? `<button class="btn btn-secondary add-spouse-btn">${spouseLabel}</button>`
    : "";
  const parentBtn = canAddParent
    ? `<button class="btn btn-secondary add-parent-btn">Thêm cha/mẹ</button>`
    : "";
  const gioBtn = isCompleteDate(person.deathDate)
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
        <button class="btn btn-secondary add-child-btn">Thêm con</button>
        ${spouseBtn}
        ${parentBtn}
        <button class="btn btn-secondary edit-btn">Sửa</button>
        ${gioBtn}
        <button class="btn btn-danger delete-btn">Xóa</button>
      </div>
    </div>
  `;

  container.appendChild(panel);

  panel
    .querySelector(".detail-panel-close")!
    .addEventListener("click", cb.onClose);
  panel
    .querySelector(".edit-btn")!
    .addEventListener("click", () => cb.onEdit(person));
  panel
    .querySelector(".add-child-btn")!
    .addEventListener("click", () => cb.onAddChild(person));
  panel
    .querySelector(".add-spouse-btn")
    ?.addEventListener("click", () => cb.onAddSpouse(person));
  panel
    .querySelector(".add-parent-btn")
    ?.addEventListener("click", () => cb.onAddParent(person));
  panel
    .querySelector(".gio-btn")
    ?.addEventListener("click", () => cb.onCreateGio(person));
  panel
    .querySelector(".delete-btn")!
    .addEventListener("click", () => cb.onDelete(person));
}

function metaRow(label: string, value: string): string {
  return `
    <div class="detail-meta-item">
      <span class="label">${label}</span>
      <span>${value}</span>
    </div>`;
}

/**
 * Format a partial date, appending the lunar date only when the date is
 * complete (year+month+day) and convertible.
 */
function formatDateWithLunar(date: PartialDate): string {
  if (date.month == null || date.day == null) {
    return formatPartialDate(date);
  }
  const solar = formatSolarDate({
    year: date.year,
    month: date.month,
    day: date.day,
  });
  const lunar = convertSolarToLunar(date.year, date.month, date.day);
  return lunar ? `${solar} (${formatLunarDate(lunar)})` : solar;
}

/** Whether a partial date has all of year/month/day (needed for lunar/giỗ). */
function isCompleteDate(date: PartialDate | null): boolean {
  return date != null && date.month != null && date.day != null;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
