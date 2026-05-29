import type { SolarDate, LunarDateContext } from "../../lib/index";
import {
  convertSolarToLunar,
  convertLunarToSolar,
  formatSolarDate,
} from "../../lib/index";

type Direction = "s2l" | "l2s";

interface ConverterState {
  direction: Direction;
  // Solar inputs (when direction = s2l)
  solar: SolarDate;
  // Lunar inputs (when direction = l2s)
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  lunarLeap: boolean;
}

/**
 * Render the date-lookup converter modal: bi-directional Solar ↔ Lunar
 * conversion with full Can-Chi context.
 */
export function renderDateConverterModal(
  container: HTMLElement,
  onClose: () => void,
): void {
  const today = new Date();
  const state: ConverterState = {
    direction: "s2l",
    solar: {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    },
    lunarYear: today.getFullYear(),
    lunarMonth: 1,
    lunarDay: 1,
    lunarLeap: false,
  };

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="conv-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Tra cứu ngày</div>
      </div>
      <div class="modal-body">
        <div class="converter-tabs" role="tablist">
          <button class="converter-tab active" data-dir="s2l" role="tab" aria-selected="true">Dương → Âm</button>
          <button class="converter-tab" data-dir="l2s" role="tab" aria-selected="false">Âm → Dương</button>
        </div>

        <div class="converter-input" id="s2l-input">
          <div class="form-group">
            <label for="conv-solar-date">Ngày dương lịch</label>
            <input type="date" id="conv-solar-date" min="1901-01-01" max="2099-12-31"
                   value="${toIso(state.solar)}">
          </div>
        </div>

        <div class="converter-input" id="l2s-input" hidden>
          <div class="form-row converter-lunar-row">
            <div class="form-group">
              <label for="conv-lunar-day">Ngày âm</label>
              <input type="number" id="conv-lunar-day" min="1" max="30" value="${state.lunarDay}">
            </div>
            <div class="form-group">
              <label for="conv-lunar-month">Tháng âm</label>
              <input type="number" id="conv-lunar-month" min="1" max="12" value="${state.lunarMonth}">
            </div>
            <div class="form-group">
              <label for="conv-lunar-year">Năm âm</label>
              <input type="number" id="conv-lunar-year" min="1901" max="2099" value="${state.lunarYear}">
            </div>
          </div>
          <label class="converter-leap-toggle">
            <input type="checkbox" id="conv-lunar-leap"> Tháng nhuận
          </label>
        </div>

        <div class="converter-result" id="conv-result"></div>
      </div>
    </div>
  `;

  container.appendChild(overlay);
  window.history.pushState({ overlay: true }, "");

  const tabs = overlay.querySelectorAll<HTMLButtonElement>(".converter-tab");
  const s2lInput = overlay.querySelector("#s2l-input") as HTMLElement;
  const l2sInput = overlay.querySelector("#l2s-input") as HTMLElement;
  const result = overlay.querySelector("#conv-result") as HTMLElement;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.direction = tab.dataset.dir as Direction;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
      });
      s2lInput.hidden = state.direction !== "s2l";
      l2sInput.hidden = state.direction !== "l2s";
      rerender();
    });
  });

  const solarDateInput = overlay.querySelector(
    "#conv-solar-date",
  ) as HTMLInputElement;
  solarDateInput.addEventListener("input", () => {
    const val = solarDateInput.value;
    if (!val) return;
    const [y, m, d] = val.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      state.solar = { year: y, month: m, day: d };
      rerender();
    }
  });

  const lunarDayInput = overlay.querySelector(
    "#conv-lunar-day",
  ) as HTMLInputElement;
  const lunarMonthInput = overlay.querySelector(
    "#conv-lunar-month",
  ) as HTMLInputElement;
  const lunarYearInput = overlay.querySelector(
    "#conv-lunar-year",
  ) as HTMLInputElement;
  const lunarLeapInput = overlay.querySelector(
    "#conv-lunar-leap",
  ) as HTMLInputElement;

  const onLunarChange = () => {
    state.lunarDay = parseInt(lunarDayInput.value, 10);
    state.lunarMonth = parseInt(lunarMonthInput.value, 10);
    state.lunarYear = parseInt(lunarYearInput.value, 10);
    state.lunarLeap = lunarLeapInput.checked;
    rerender();
  };
  lunarDayInput.addEventListener("input", onLunarChange);
  lunarMonthInput.addEventListener("input", onLunarChange);
  lunarYearInput.addEventListener("input", onLunarChange);
  lunarLeapInput.addEventListener("change", onLunarChange);

  const cleanup = () => {
    overlay.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      onClose();
    }, 300);
  };

  overlay.querySelector("#conv-close")!.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });

  const handlePop = () => cleanup();
  window.addEventListener("popstate", handlePop, { once: true });

  function rerender(): void {
    if (state.direction === "s2l") {
      const ctx = convertSolarToLunar(
        state.solar.year,
        state.solar.month,
        state.solar.day,
      );
      result.innerHTML = ctx
        ? renderResult(state.solar, ctx)
        : renderError("Ngày dương lịch không hợp lệ");
    } else {
      const {
        lunarYear,
        lunarMonth,
        lunarDay,
        lunarLeap,
      } = state;
      if (
        !Number.isFinite(lunarYear) ||
        !Number.isFinite(lunarMonth) ||
        !Number.isFinite(lunarDay)
      ) {
        result.innerHTML = renderError("Vui lòng nhập đầy đủ ngày âm lịch");
        return;
      }
      const solar = convertLunarToSolar(
        lunarYear,
        { day: lunarDay, month: lunarMonth },
        lunarLeap,
      );
      if (!solar) {
        result.innerHTML = renderError(
          lunarLeap
            ? `Năm ${lunarYear} không có tháng ${lunarMonth} nhuận, hoặc ngày không tồn tại`
            : "Ngày âm lịch không tồn tại trong năm này",
        );
        return;
      }
      const ctx = convertSolarToLunar(solar.year, solar.month, solar.day);
      result.innerHTML = ctx
        ? renderResult(solar, ctx)
        : renderError("Không tính được Can-Chi cho ngày này");
    }
  }

  rerender();
  setTimeout(() => solarDateInput.focus(), 100);
}

function renderResult(solar: SolarDate, ctx: LunarDateContext): string {
  const leapSuffix = ctx.isLeapMonth ? " nhuận" : "";
  const hours =
    ctx.auspiciousHours.length > 0
      ? ctx.auspiciousHours.map(escapeHtml).join(", ")
      : "—";
  const ages =
    ctx.incompatibleAges.length > 0
      ? ctx.incompatibleAges.map(escapeHtml).join(", ")
      : "—";

  return `
    <div class="converter-result-card">
      <div class="converter-result-big">
        <div class="converter-result-day">${ctx.lunarDay}</div>
        <div class="converter-result-monthyear">
          Tháng ${Math.abs(ctx.lunarMonth)}${leapSuffix} năm ${escapeHtml(ctx.canChiYear)}
        </div>
        <div class="converter-result-canchi">
          Ngày ${escapeHtml(ctx.canChiDay)} · Tháng ${escapeHtml(ctx.canChiMonth)}
        </div>
      </div>
      <div class="converter-result-meta">
        <div class="converter-result-row">
          <span class="label">Dương lịch</span>
          <span>${formatSolarDate(solar)}</span>
        </div>
        <div class="converter-result-row">
          <span class="label">Ngũ Hành</span>
          <span>${escapeHtml(ctx.fateElement)}</span>
        </div>
        <div class="converter-result-row">
          <span class="label">Giờ hoàng đạo</span>
          <span>${hours}</span>
        </div>
        <div class="converter-result-row">
          <span class="label">Tuổi xung</span>
          <span>${ages}</span>
        </div>
      </div>
    </div>
  `;
}

function renderError(message: string): string {
  return `<div class="converter-result-error">${escapeHtml(message)}</div>`;
}

function toIso(d: SolarDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
