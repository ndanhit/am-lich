import type { Gender, PartialDate, LunarDate } from "../../lib/index";
import type { PersonFormData, PersonFormContext } from "../types";
import { GENDER_LABELS } from "../types";

const MIN_YEAR = 1901;
const MAX_YEAR = 2099;

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
  const isDeceased =
    isEdit && (editPerson!.isDeceased || editPerson!.deathLunar != null);

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
            <label for="person-alias">Tên thường gọi</label>
            <input type="text" id="person-alias" maxlength="100" value="${escapeAttr(editPerson ? editPerson.aliasName ?? "" : "")}">
          </div>

          <div class="form-group">
            <label>Giới tính</label>
            ${genderField}
          </div>

          <div class="form-group">
            <label>Ngày sinh (dương lịch, không bắt buộc)</label>
            ${datePickerHtml("birth")}
            <div class="form-error" id="person-birth-error"></div>
          </div>

          <div class="form-group">
            <label class="checkbox-row">
              <input type="checkbox" id="person-deceased" ${isDeceased ? "checked" : ""}>
              <span>Đã mất</span>
            </label>
          </div>

          <div class="form-group" id="person-death-group" style="display: ${isDeceased ? "block" : "none"}">
            <label>Ngày giỗ (âm lịch, không bắt buộc)</label>
            ${gioPickerHtml()}
            <div class="form-hint">Chọn tháng &amp; ngày âm lịch để app nhắc giỗ hằng năm.</div>
            <div class="form-error" id="person-death-error"></div>
          </div>

          <details class="form-extra">
            <summary>Thông tin thêm</summary>
            <div class="form-group">
              <label for="person-altnames">Tên khác (huý / tự / hiệu)</label>
              <input type="text" id="person-altnames" maxlength="200" value="${escapeAttr(editPerson ? editPerson.altNames ?? "" : "")}">
            </div>
            <div class="form-group">
              <label for="person-homeland">Quê quán</label>
              <input type="text" id="person-homeland" maxlength="200" value="${escapeAttr(editPerson ? editPerson.homeland ?? "" : "")}">
            </div>
            <div class="form-group">
              <label for="person-burial">Nơi an táng (mộ phần)</label>
              <input type="text" id="person-burial" maxlength="200" value="${escapeAttr(editPerson ? editPerson.burialPlace ?? "" : "")}">
            </div>
            <div class="form-group">
              <label for="person-titles">Chức tước / học vị</label>
              <input type="text" id="person-titles" maxlength="200" value="${escapeAttr(editPerson ? editPerson.titles ?? "" : "")}">
            </div>
          </details>

          <div class="form-group">
            <label for="person-notes">Ghi chú</label>
            <textarea id="person-notes" maxlength="500" rows="3" placeholder="vd: nghề nghiệp, công trạng...">${escapeText(defaultNotes)}</textarea>
          </div>

          <button type="submit" class="btn-cta" id="person-submit-btn">${cta}</button>
        </form>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const nameInput = overlay.querySelector("#person-name") as HTMLInputElement;
  const notesInput = overlay.querySelector(
    "#person-notes",
  ) as HTMLTextAreaElement;
  const deceasedCheckbox = overlay.querySelector(
    "#person-deceased",
  ) as HTMLInputElement;
  const deathGroup = overlay.querySelector(
    "#person-death-group",
  ) as HTMLElement;

  // Progressive Năm → Tháng → Ngày pickers for birth and death.
  const getBirth = setupDatePicker(
    overlay,
    "birth",
    editPerson ? editPerson.birthDate : null,
  );
  const getGio = setupGioPicker(
    overlay,
    editPerson ? (editPerson.deathLunar ?? null) : null,
  );

  deceasedCheckbox.addEventListener("change", () => {
    deathGroup.style.display = deceasedCheckbox.checked ? "block" : "none";
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
    const val = (id: string): string =>
      (overlay.querySelector(`#${id}`) as HTMLInputElement).value;

    const formData: PersonFormData = {
      name,
      gender,
      birthDate: getBirth(),
      isDeceased: deceased,
      deathLunar: deceased ? getGio() : null,
      aliasName: val("person-alias"),
      altNames: val("person-altnames"),
      homeland: val("person-homeland"),
      burialPlace: val("person-burial"),
      titles: val("person-titles"),
      notes: notesInput.value,
    };

    try {
      submit(formData);
      closeForm(overlay, onSaved);
    } catch (err: any) {
      const msg = err.message || "Dữ liệu không hợp lệ";
      if (msg.includes("giỗ") || msg.includes("mất")) {
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

/** Markup for a Năm/Tháng/Ngày picker; month & day start hidden. */
function datePickerHtml(prefix: string): string {
  const years: string[] = [];
  for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
    years.push(`<option value="${y}">${y}</option>`);
  }
  const months = Array.from(
    { length: 12 },
    (_, i) => `<option value="${i + 1}">Tháng ${i + 1}</option>`,
  ).join("");
  return `
    <div class="date-picker">
      <select id="${prefix}-year" class="date-select" aria-label="Năm">
        <option value="">Năm</option>${years.join("")}
      </select>
      <select id="${prefix}-month" class="date-select" aria-label="Tháng" style="display:none">
        <option value="">Tháng</option>${months}
      </select>
      <select id="${prefix}-day" class="date-select" aria-label="Ngày" style="display:none">
        <option value="">Ngày</option>
      </select>
    </div>`;
}

/** Markup for a lunar giỗ picker: Tháng ÂL + Ngày ÂL (both optional). */
function gioPickerHtml(): string {
  const months = Array.from(
    { length: 12 },
    (_, i) => `<option value="${i + 1}">Tháng ${i + 1}</option>`,
  ).join("");
  const days = Array.from(
    { length: 30 },
    (_, i) => `<option value="${i + 1}">Ngày ${i + 1}</option>`,
  ).join("");
  return `
    <div class="date-picker">
      <select id="gio-month" class="date-select" aria-label="Tháng âm lịch">
        <option value="">Tháng ÂL</option>${months}
      </select>
      <select id="gio-day" class="date-select" aria-label="Ngày âm lịch">
        <option value="">Ngày ÂL</option>${days}
      </select>
    </div>`;
}

/**
 * Wire the lunar giỗ picker. Returns a getter producing the chosen LunarDate
 * (month + day) — or null when either part is missing.
 */
function setupGioPicker(
  overlay: HTMLElement,
  initial: LunarDate | null,
): () => LunarDate | null {
  const monthSel = overlay.querySelector("#gio-month") as HTMLSelectElement;
  const daySel = overlay.querySelector("#gio-day") as HTMLSelectElement;
  if (initial) {
    monthSel.value = String(initial.month);
    daySel.value = String(initial.day);
  }
  return () => {
    if (!monthSel.value || !daySel.value) return null;
    return { month: Number(monthSel.value), day: Number(daySel.value) };
  };
}

/**
 * Wire a Năm → Tháng → Ngày picker with progressive disclosure. Returns a
 * getter producing the chosen PartialDate (or null if no year is selected).
 */
function setupDatePicker(
  overlay: HTMLElement,
  prefix: string,
  initial: PartialDate | null,
): () => PartialDate | null {
  const yearSel = overlay.querySelector(`#${prefix}-year`) as HTMLSelectElement;
  const monthSel = overlay.querySelector(
    `#${prefix}-month`,
  ) as HTMLSelectElement;
  const daySel = overlay.querySelector(`#${prefix}-day`) as HTMLSelectElement;

  const populateDays = (preserve: number | null): void => {
    const year = Number(yearSel.value);
    const month = Number(monthSel.value);
    const count =
      year && month ? new Date(year, month, 0).getDate() : 31;
    let html = `<option value="">Ngày</option>`;
    for (let d = 1; d <= count; d++) html += `<option value="${d}">${d}</option>`;
    daySel.innerHTML = html;
    if (preserve != null && preserve <= count) daySel.value = String(preserve);
  };

  const refresh = (): void => {
    monthSel.style.display = yearSel.value ? "" : "none";
    if (!yearSel.value) {
      monthSel.value = "";
    }
    daySel.style.display = yearSel.value && monthSel.value ? "" : "none";
    if (!monthSel.value) daySel.value = "";
  };

  yearSel.addEventListener("change", () => {
    if (monthSel.value) populateDays(Number(daySel.value) || null);
    refresh();
  });
  monthSel.addEventListener("change", () => {
    populateDays(null);
    refresh();
  });

  // Initialize from existing value.
  if (initial) {
    yearSel.value = String(initial.year);
    if (initial.month != null) {
      monthSel.value = String(initial.month);
      populateDays(initial.day);
    }
  }
  refresh();

  return () => {
    if (!yearSel.value) return null;
    return {
      year: Number(yearSel.value),
      month: monthSel.value ? Number(monthSel.value) : null,
      day: daySel.value ? Number(daySel.value) : null,
    };
  };
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
