import type { Person } from "../../lib/index";
import { getUpcomingGio, formatSolarDate, formatLunarDate } from "../../lib/index";
import { MONTH_NAMES_SHORT } from "../types";
import type { AppState } from "../state";

/** Modal listing upcoming death anniversaries (giỗ) for the current tree. */
export function renderGioList(
  container: HTMLElement,
  state: AppState,
  onSelect: (person: Person) => void,
): void {
  const now = new Date();
  const today = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  const gios = getUpcomingGio(state.getPeople(), today, 200);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="gio-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Lịch giỗ</div>
      </div>
      <div class="modal-body" id="gio-body"></div>
    </div>
  `;
  container.appendChild(overlay);

  const body = overlay.querySelector("#gio-body") as HTMLElement;
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };

  if (gios.length === 0) {
    body.innerHTML = `<div class="detail-empty">Chưa có ngày giỗ nào (cần người đã mất có đủ ngày/tháng/năm mất).</div>`;
  } else {
    const list = document.createElement("div");
    list.className = "gio-list";
    for (const g of gios) {
      const occ = g.occurrence;
      const solar = occ.solarDate;
      const daysText =
        occ.daysUntil === 0
          ? "Hôm nay"
          : occ.daysUntil === 1
            ? "Ngày mai"
            : `Còn ${occ.daysUntil} ngày`;
      const lunarStr = occ.lunarContext
        ? formatLunarDate(occ.lunarContext)
        : "";
      const row = document.createElement("button");
      row.className = "gio-item";
      row.innerHTML = `
        <div class="upcoming-date-badge">
          <span class="month">${MONTH_NAMES_SHORT[solar.month - 1]}</span>
          <span class="day">${solar.day}</span>
        </div>
        <div class="gio-item-body">
          <div class="gio-item-name">${escapeHtml(g.person.name)}</div>
          <div class="gio-item-sub">${escapeHtml(lunarStr)}</div>
          <div class="gio-item-sub">${formatSolarDate(solar)}</div>
        </div>
        <div class="gio-item-days">${daysText}</div>
      `;
      row.addEventListener("click", () => {
        close();
        onSelect(g.person);
      });
      list.appendChild(row);
    }
    body.appendChild(list);
  }

  overlay.querySelector("#gio-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
