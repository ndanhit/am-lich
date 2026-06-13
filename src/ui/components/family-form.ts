import type { FamilyTree } from "../../lib/index";
import type { FamilyFormData } from "../types";

/**
 * Create/edit a family tree (gia phả): name + optional description.
 * `submit` performs the mutation and may throw to surface an inline error.
 */
export function renderFamilyForm(
  container: HTMLElement,
  editFamily: FamilyTree | null,
  submit: (data: FamilyFormData) => void,
  onSaved: () => void,
  onCancel: () => void,
): void {
  const isEdit = editFamily !== null;
  const title = isEdit ? "Sửa gia phả" : "Gia phả mới";
  const cta = isEdit ? "Lưu thay đổi" : "Tạo gia phả";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="family-form-close" aria-label="Đóng form">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">${title}</div>
      </div>
      <div class="modal-body">
        <form id="family-form" novalidate>
          <div class="form-group">
            <label for="family-name">Tên gia phả</label>
            <input type="text" id="family-name" maxlength="100" placeholder="Họ Nguyễn Văn..."
                   value="${escapeAttr(isEdit ? editFamily.name : "")}" required>
            <div class="form-error" id="family-name-error"></div>
          </div>
          <div class="form-group">
            <label for="family-desc">Mô tả (không bắt buộc)</label>
            <textarea id="family-desc" maxlength="500" rows="3" placeholder="vd: nguồn gốc, quê quán...">${escapeText(isEdit ? editFamily.description : "")}</textarea>
          </div>
          <button type="submit" class="btn-cta" id="family-submit-btn">${cta}</button>
        </form>
      </div>
    </div>
  `;

  container.appendChild(overlay);

  const nameInput = overlay.querySelector("#family-name") as HTMLInputElement;
  const descInput = overlay.querySelector("#family-desc") as HTMLTextAreaElement;

  const close = (cb: () => void) => {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      cb();
    }, 300);
  };

  overlay
    .querySelector("#family-form-close")!
    .addEventListener("click", () => close(onCancel));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close(onCancel);
  });

  overlay.querySelector("#family-form")!.addEventListener("submit", (e) => {
    e.preventDefault();
    const errEl = overlay.querySelector("#family-name-error") as HTMLElement;
    errEl.textContent = "";

    const name = nameInput.value.trim();
    if (!name) {
      errEl.textContent = "Tên gia phả không được để trống";
      return;
    }

    try {
      submit({ name, description: descInput.value });
      close(onSaved);
    } catch (err: any) {
      errEl.textContent = err.message || "Dữ liệu không hợp lệ";
    }
  });

  setTimeout(() => nameInput.focus(), 100);
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
