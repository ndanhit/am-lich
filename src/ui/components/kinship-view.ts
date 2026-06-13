import type { Person } from "../../lib/index";
import { kinshipTerm } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

/**
 * Modal showing how `from` addresses every other member of the current tree.
 */
export function renderKinshipView(
  container: HTMLElement,
  state: AppState,
  from: Person,
  onSelect: (person: Person) => void,
): void {
  const people = state.getPeople();
  const others = people.filter((p) => p.id !== from.id);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="kin-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Cách xưng hô</div>
      </div>
      <div class="modal-body">
        <p class="reorder-hint">${escapeHtml(from.name)} gọi…</p>
        <div class="kin-list" id="kin-list"></div>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const list = overlay.querySelector("#kin-list") as HTMLElement;
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };

  if (others.length === 0) {
    list.innerHTML = `<div class="detail-empty">Chưa có thành viên khác.</div>`;
  } else {
    for (const p of others) {
      const term = kinshipTerm(people, from.id, p.id);
      const row = document.createElement("button");
      row.className = "kin-item";
      row.innerHTML = `
        <span class="kin-name">${escapeHtml(p.name)} <span class="kin-gender">${GENDER_LABELS[p.gender]}</span></span>
        <span class="kin-term">${escapeHtml(term)}</span>
      `;
      row.addEventListener("click", () => {
        close();
        onSelect(p);
      });
      list.appendChild(row);
    }
  }

  overlay.querySelector("#kin-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
