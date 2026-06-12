import type { Person, Gender } from "../../lib/index";
import { getDescendantIds } from "../../lib/index";
import type { PersonFormData } from "../types";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

/**
 * Render the family-tree person creation/edit form as a modal overlay.
 * Birth/death dates are optional (may be left blank). The parent dropdown
 * excludes the person itself and its descendants to prevent cycles.
 */
export function renderPersonForm(
  container: HTMLElement,
  state: AppState,
  editPerson: Person | null,
  onSaved: () => void,
  onCancel: () => void,
  presetParentId?: string | null,
): void {
  const isEdit = editPerson !== null;
  const title = isEdit ? "Sửa thành viên" : "Thành viên mới";

  const defaultName = isEdit ? editPerson.name : "";
  const defaultGender: Gender = isEdit ? editPerson.gender : "male";
  const defaultNotes = isEdit ? editPerson.notes : "";
  const birthValue = isEdit ? solarToInputValue(editPerson.birthDate) : "";
  const deathValue = isEdit ? solarToInputValue(editPerson.deathDate) : "";
  const defaultParentId = isEdit
    ? editPerson.parentId
    : (presetParentId ?? null);
  const defaultSpouseId = isEdit ? editPerson.spouseId : null;

  // Build candidate lists for parent/spouse dropdowns.
  const people = state.getPeople();
  const excluded = new Set<string>();
  if (isEdit) {
    excluded.add(editPerson.id);
    for (const id of getDescendantIds(people, editPerson.id)) {
      excluded.add(id);
    }
  }
  const parentCandidates = people.filter((p) => !excluded.has(p.id));
  const spouseCandidates = people.filter(
    (p) => !isEdit || p.id !== editPerson.id,
  );

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="person-form-close" aria-label="Đóng form">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">${title}</div>
      </div>
      <div class="modal-body">
        <form id="person-form" novalidate>
          <div class="form-group">
            <label for="person-name">Họ và tên</label>
            <input type="text" id="person-name" maxlength="100" placeholder="Nguyễn Văn A"
                   value="${escapeAttr(defaultName)}" required>
            <div class="form-error" id="person-name-error"></div>
          </div>

          <div class="form-group">
            <label>Giới tính</label>
            <div class="recurrence-options">
              ${(Object.keys(GENDER_LABELS) as Gender[])
                .map(
                  (g) => `
                <label class="recurrence-option">
                  <input type="radio" name="gender" value="${g}" ${g === defaultGender ? "checked" : ""}>
                  ${GENDER_LABELS[g]}
                </label>
              `,
                )
                .join("")}
            </div>
          </div>

          <div class="form-group">
            <label for="person-birth">Ngày sinh (dương lịch)</label>
            <input type="date" id="person-birth" value="${birthValue}" min="1901-01-01" max="2099-12-31">
            <div class="form-error" id="person-birth-error"></div>
          </div>

          <div class="form-group">
            <label for="person-death">Ngày mất (dương lịch)</label>
            <input type="date" id="person-death" value="${deathValue}" min="1901-01-01" max="2099-12-31">
            <div class="form-error" id="person-death-error"></div>
          </div>

          <div class="form-group">
            <label for="person-parent">Cha/Mẹ</label>
            <select id="person-parent">
              <option value="">— Không (đời đầu) —</option>
              ${parentCandidates
                .map(
                  (p) =>
                    `<option value="${escapeAttr(p.id)}" ${p.id === defaultParentId ? "selected" : ""}>${escapeText(p.name)}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="person-spouse">Vợ/Chồng</label>
            <select id="person-spouse">
              <option value="">— Không —</option>
              ${spouseCandidates
                .map(
                  (p) =>
                    `<option value="${escapeAttr(p.id)}" ${p.id === defaultSpouseId ? "selected" : ""}>${escapeText(p.name)}</option>`,
                )
                .join("")}
            </select>
          </div>

          <div class="form-group">
            <label for="person-notes">Ghi chú</label>
            <textarea id="person-notes" maxlength="500" rows="3" placeholder="vd: quê quán, nghề nghiệp...">${escapeText(defaultNotes)}</textarea>
          </div>

          <button type="submit" class="btn-cta" id="person-submit-btn">
            ${isEdit ? "Lưu thay đổi" : "Thêm thành viên"}
          </button>
        </form>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const nameInput = overlay.querySelector("#person-name") as HTMLInputElement;
  const birthInput = overlay.querySelector("#person-birth") as HTMLInputElement;
  const deathInput = overlay.querySelector("#person-death") as HTMLInputElement;
  const parentSelect = overlay.querySelector(
    "#person-parent",
  ) as HTMLSelectElement;
  const spouseSelect = overlay.querySelector(
    "#person-spouse",
  ) as HTMLSelectElement;
  const notesInput = overlay.querySelector(
    "#person-notes",
  ) as HTMLTextAreaElement;

  overlay.querySelector("#person-form-close")!.addEventListener("click", () => {
    closeForm(overlay, onCancel);
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeForm(overlay, onCancel);
  });

  overlay.querySelector("#person-form")!.addEventListener("submit", (e) => {
    e.preventDefault();

    overlay.querySelectorAll(".form-error").forEach((el) => {
      el.textContent = "";
    });
    overlay
      .querySelectorAll(".form-group")
      .forEach((g) => g.classList.remove("has-error"));

    const name = nameInput.value.trim();
    if (!name) {
      showError(
        overlay,
        "person-name-error",
        "person-name",
        "Họ và tên không được để trống",
      );
      return;
    }

    const gender = (
      overlay.querySelector('input[name="gender"]:checked') as HTMLInputElement
    ).value as Gender;

    const formData: PersonFormData = {
      name,
      gender,
      birthDate: parseInputDate(birthInput.value),
      deathDate: parseInputDate(deathInput.value),
      parentId: parentSelect.value || null,
      spouseId: spouseSelect.value || null,
      notes: notesInput.value,
    };

    try {
      if (isEdit) {
        state.editPerson(editPerson.id, formData);
      } else {
        state.createPerson(formData);
      }
      closeForm(overlay, onSaved);
    } catch (err: any) {
      const msg = err.message || "Dữ liệu không hợp lệ";
      if (msg.includes("mất")) {
        showError(overlay, "person-death-error", "person-death", msg);
      } else if (msg.includes("sinh")) {
        showError(overlay, "person-birth-error", "person-birth", msg);
      } else {
        showError(overlay, "person-name-error", "person-name", msg);
      }
    }
  });

  setTimeout(() => nameInput.focus(), 100);
}

function parseInputDate(
  value: string,
): { year: number; month: number; day: number } | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function solarToInputValue(
  date: { year: number; month: number; day: number } | null,
): string {
  if (!date) return "";
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function closeForm(overlay: HTMLElement, callback: () => void): void {
  overlay.classList.remove("open");
  setTimeout(() => {
    overlay.remove();
    callback();
  }, 300);
}

function showError(
  overlay: HTMLElement,
  errorId: string,
  inputId: string,
  message: string,
): void {
  const errorEl = overlay.querySelector(`#${errorId}`) as HTMLElement;
  const inputEl = overlay.querySelector(`#${inputId}`) as HTMLElement;
  if (errorEl) errorEl.textContent = message;
  inputEl?.closest(".form-group")?.classList.add("has-error");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
