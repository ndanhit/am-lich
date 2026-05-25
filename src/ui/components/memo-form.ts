import type { QuickMemo, SolarDate } from "../../lib/index";
import type { MemoFormData } from "../types";
import type { AppState } from "../state";

/**
 * Render quick-memo creation/edit form as a modal overlay.
 */
export function renderMemoForm(
  container: HTMLElement,
  state: AppState,
  editMemo: QuickMemo | null,
  onSaved: () => void,
  onCancel: () => void,
  initialDate?: SolarDate,
): void {
  const isEdit = editMemo !== null;
  const title = isEdit ? "Sửa memo" : "Memo mới";

  const today = new Date();
  const defaultDate: SolarDate = isEdit
    ? editMemo.solarDate
    : initialDate || {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
  const dateValue = `${defaultDate.year}-${String(defaultDate.month).padStart(2, "0")}-${String(defaultDate.day).padStart(2, "0")}`;

  const defaultTitle = isEdit ? editMemo.title : "";
  const defaultNote = isEdit ? editMemo.note : "";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="memo-form-close" aria-label="Đóng form">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">${title}</div>
      </div>
      <div class="modal-body">
        <form id="memo-form" novalidate>
          <div class="form-group">
            <label for="memo-title">Tiêu đề</label>
            <input type="text" id="memo-title" maxlength="100" placeholder="Vệ sinh điều hoà,..."
                   value="${escapeAttr(defaultTitle)}" required>
            <div class="char-count"><span id="memo-title-count">${defaultTitle.length}</span>/100</div>
            <div class="form-error" id="memo-title-error"></div>
          </div>

          <div class="form-group">
            <label for="memo-date">Ngày (dương lịch)</label>
            <input type="date" id="memo-date" value="${dateValue}" min="1901-01-01" max="2099-12-31" required>
            <div class="form-error" id="memo-date-error"></div>
          </div>

          <div class="form-group">
            <label for="memo-note">Ghi chú</label>
            <textarea id="memo-note" maxlength="500" rows="3" placeholder="vd: điều hoà phòng ngủ">${escapeText(defaultNote)}</textarea>
            <div class="char-count"><span id="memo-note-count">${defaultNote.length}</span>/500</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="memo-submit-btn">
            ${isEdit ? "Lưu thay đổi" : "Tạo memo"}
          </button>
        </form>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const titleInput = overlay.querySelector("#memo-title") as HTMLInputElement;
  const noteInput = overlay.querySelector("#memo-note") as HTMLTextAreaElement;
  const dateInput = overlay.querySelector("#memo-date") as HTMLInputElement;
  const titleCount = overlay.querySelector(
    "#memo-title-count",
  ) as HTMLSpanElement;
  const noteCount = overlay.querySelector(
    "#memo-note-count",
  ) as HTMLSpanElement;

  titleInput.addEventListener("input", () => {
    titleCount.textContent = String(titleInput.value.length);
  });
  noteInput.addEventListener("input", () => {
    noteCount.textContent = String(noteInput.value.length);
  });

  overlay.querySelector("#memo-form-close")!.addEventListener("click", () => {
    closeForm(overlay, onCancel);
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeForm(overlay, onCancel);
  });

  overlay.querySelector("#memo-form")!.addEventListener("submit", (e) => {
    e.preventDefault();

    overlay
      .querySelectorAll(".form-error")
      .forEach((el) => (el.textContent = ""));
    overlay
      .querySelectorAll(".form-group")
      .forEach((g) => g.classList.remove("has-error"));

    const t = titleInput.value.trim();
    if (!t) {
      showError(
        overlay,
        "memo-title-error",
        "memo-title",
        "Tiêu đề không được để trống",
      );
      return;
    }

    const dateVal = dateInput.value;
    if (!dateVal) {
      showError(
        overlay,
        "memo-date-error",
        "memo-date",
        "Ngày không được để trống",
      );
      return;
    }

    const [y, m, d] = dateVal.split("-").map(Number);

    const formData: MemoFormData = {
      title: t,
      note: noteInput.value,
      solarYear: y,
      solarMonth: m,
      solarDay: d,
    };

    try {
      if (isEdit) {
        state.editMemo(editMemo.id, formData);
      } else {
        state.createMemo(formData);
      }
      closeForm(overlay, onSaved);
    } catch (err: any) {
      const msg = err.message || "Dữ liệu không hợp lệ";
      if (msg.toLowerCase().includes("ngày") || msg.toLowerCase().includes("tháng") || msg.toLowerCase().includes("năm")) {
        showError(overlay, "memo-date-error", "memo-date", msg);
      } else {
        showError(overlay, "memo-title-error", "memo-title", msg);
      }
    }
  });

  setTimeout(() => titleInput.focus(), 100);
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
