import type { Gender } from "../../lib/index";
import type { PersonFormData, PersonFormContext } from "../types";
import { GENDER_LABELS } from "../types";

/**
 * Render the family-tree person form. Only personal info is captured here —
 * relationships are implied by `context` (the action that opened the form).
 * `submit` performs the actual mutation and may throw to surface inline errors.
 */
export function renderPersonForm(
  container: HTMLElement,
  context: PersonFormContext,
  submit: (data: PersonFormData) => void,
  onSaved: () => void,
  onCancel: () => void,
): void {
  const editPerson = context.mode === "edit" ? context.person : null;
  const isEdit = editPerson !== null;

  const title = formTitle(context);
  const cta = isEdit ? "Lưu thay đổi" : "Thêm";

  // Gender lock: addSpouse fixes the opposite gender; editing a married-in
  // person keeps their gender stable.
  let lockedGender: Gender | null = null;
  if (context.mode === "addSpouse") lockedGender = context.lockedGender;
  else if (editPerson && editPerson.isMarriedIn) lockedGender = editPerson.gender;

  const defaultName = editPerson ? editPerson.name : "";
  const defaultGender: Gender =
    lockedGender ?? (editPerson ? editPerson.gender : "male");
  const defaultNotes = editPerson ? editPerson.notes : "";
  const birthValue = editPerson ? solarToInputValue(editPerson.birthDate) : "";
  const deathValue = editPerson ? solarToInputValue(editPerson.deathDate) : "";
  const isDeceased =
    isEdit && (editPerson!.isDeceased || editPerson!.deathDate !== null);

  const genderField = lockedGender
    ? `<input type="hidden" name="gender" value="${lockedGender}">
       <div class="form-static">${GENDER_LABELS[lockedGender]}</div>`
    : `<div class="recurrence-options">
        ${(Object.keys(GENDER_LABELS) as Gender[])
          .map(
            (g) => `
          <label class="recurrence-option">
            <input type="radio" name="gender" value="${g}" ${g === defaultGender ? "checked" : ""}>
            ${GENDER_LABELS[g]}
          </label>`,
          )
          .join("")}
      </div>`;

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
        <div class="modal-title-text">${escapeText(title)}</div>
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
            ${genderField}
          </div>

          <div class="form-group">
            <label for="person-birth">Ngày sinh (dương lịch)</label>
            <input type="date" id="person-birth" value="${birthValue}" min="1901-01-01" max="2099-12-31">
            <div class="form-error" id="person-birth-error"></div>
          </div>

          <div class="form-group">
            <label class="checkbox-row">
              <input type="checkbox" id="person-deceased" ${isDeceased ? "checked" : ""}>
              <span>Đã mất</span>
            </label>
          </div>

          <div class="form-group" id="person-death-group" style="display: ${isDeceased ? "block" : "none"}">
            <label for="person-death">Ngày mất (dương lịch, không bắt buộc)</label>
            <input type="date" id="person-death" value="${deathValue}" min="1901-01-01" max="2099-12-31">
            <div class="form-error" id="person-death-error"></div>
          </div>

          <div class="form-group">
            <label for="person-notes">Ghi chú</label>
            <textarea id="person-notes" maxlength="500" rows="3" placeholder="vd: quê quán, nghề nghiệp...">${escapeText(defaultNotes)}</textarea>
          </div>

          <button type="submit" class="btn-cta" id="person-submit-btn">${cta}</button>
        </form>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const nameInput = overlay.querySelector("#person-name") as HTMLInputElement;
  const birthInput = overlay.querySelector("#person-birth") as HTMLInputElement;
  const deathInput = overlay.querySelector("#person-death") as HTMLInputElement;
  const notesInput = overlay.querySelector(
    "#person-notes",
  ) as HTMLTextAreaElement;
  const deceasedCheckbox = overlay.querySelector(
    "#person-deceased",
  ) as HTMLInputElement;
  const deathGroup = overlay.querySelector(
    "#person-death-group",
  ) as HTMLElement;

  deceasedCheckbox.addEventListener("change", () => {
    deathGroup.style.display = deceasedCheckbox.checked ? "block" : "none";
    if (!deceasedCheckbox.checked) deathInput.value = "";
  });

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
      overlay.querySelector('[name="gender"]:checked, input[type="hidden"][name="gender"]') as HTMLInputElement
    ).value as Gender;

    const deceased = deceasedCheckbox.checked;
    const deathDate = deceased ? parseInputDate(deathInput.value) : null;

    const formData: PersonFormData = {
      name,
      gender,
      birthDate: parseInputDate(birthInput.value),
      isDeceased: deceased,
      deathDate,
      notes: notesInput.value,
    };

    try {
      submit(formData);
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

function formTitle(context: PersonFormContext): string {
  switch (context.mode) {
    case "edit":
      return `Sửa ${context.person.name}`;
    case "addRoot":
      return "Thành viên đầu tiên";
    case "addChild":
      return `Thêm con cho ${context.targetName}`;
    case "addSpouse":
      return `Thêm ${context.lockedGender === "female" ? "vợ" : "chồng"} cho ${context.targetName}`;
    case "addParent":
      return `Thêm cha/mẹ cho ${context.targetName}`;
  }
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
