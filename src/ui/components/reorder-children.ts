import type { Person } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

/**
 * Modal to reorder the children of a parent (top = leftmost = oldest on the
 * tree). Uses ↑/↓ buttons; saving persists the new order.
 */
export function renderReorderChildren(
  container: HTMLElement,
  state: AppState,
  parent: Person,
  onSaved: () => void,
  onCancel: () => void,
): void {
  // Working copy of the current ordering.
  let ids = state.getOrderedChildren(parent.id).map((c) => c.id);
  const nameById = new Map(
    state.getOrderedChildren(parent.id).map((c) => [c.id, c]),
  );

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="reorder-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Sắp xếp con</div>
      </div>
      <div class="modal-body">
        <p class="reorder-hint">Trên cùng = lớn nhất (bên trái trên cây).</p>
        <div class="reorder-list" id="reorder-list"></div>
        <button type="button" class="btn-cta" id="reorder-save">Lưu thứ tự</button>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const listEl = overlay.querySelector("#reorder-list") as HTMLElement;

  const move = (index: number, delta: number): void => {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    renderList();
  };

  const renderList = (): void => {
    listEl.innerHTML = "";
    ids.forEach((id, index) => {
      const person = nameById.get(id)!;
      const row = document.createElement("div");
      row.className = "reorder-item";
      row.innerHTML = `
        <span class="reorder-rank">${index + 1}</span>
        <span class="reorder-name">${escapeHtml(person.name)}</span>
        <span class="reorder-gender">${GENDER_LABELS[person.gender]}</span>
        <span class="reorder-actions">
          <button type="button" class="icon-btn" data-act="up" aria-label="Lên" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="icon-btn" data-act="down" aria-label="Xuống" ${index === ids.length - 1 ? "disabled" : ""}>↓</button>
        </span>
      `;
      row
        .querySelector('[data-act="up"]')!
        .addEventListener("click", () => move(index, -1));
      row
        .querySelector('[data-act="down"]')!
        .addEventListener("click", () => move(index, 1));
      listEl.appendChild(row);
    });
  };
  renderList();

  const close = (cb: () => void): void => {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      cb();
    }, 300);
  };

  overlay
    .querySelector("#reorder-close")!
    .addEventListener("click", () => close(onCancel));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close(onCancel);
  });
  overlay.querySelector("#reorder-save")!.addEventListener("click", () => {
    state.reorderChildren(parent.id, ids);
    close(onSaved);
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
