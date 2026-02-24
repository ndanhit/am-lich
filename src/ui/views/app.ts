import { LocalStorageAdapter } from "../../adapters/storage/local-storage-adapter";
import { AppState } from "../state";
import { buildCalendarViewModel, renderCalendar } from "../components/calendar";
import {
  renderEventDetail,
  closeDetailPanel,
} from "../components/event-detail";
import { renderEventForm } from "../components/event-form";
import { renderUpcomingList } from "../components/upcoming-list";
import { renderImportExport } from "../components/import-export";
import { renderDayDetailModal } from "../components/day-detail-modal";
import type { CalendarCell } from "../types";
import type { AppView } from "../types";
import type {
  UpcomingEventOccurrence,
  LunarEvent,
  SolarDate,
} from "../../lib/index";

// --- Year Boundary Constants (F1) ---
const MIN_YEAR = 1901;
const MAX_YEAR = 2099;

// --- Bootstrap ---
const adapter = new LocalStorageAdapter();
const state = new AppState(adapter);

let currentView: AppView = "calendar";
let currentYear: number;
let currentMonth: number;
// --- Initialize to current month ---
const now = new Date();
currentYear = now.getFullYear();
currentMonth = now.getMonth() + 1;

function isOverlayOpen() {
  return !!(
    document.querySelector(".modal-overlay.open") ||
    document.querySelector(".detail-panel.open")
  );
}

// --- DOM Setup ---
const app = document.getElementById("app")!;

app.innerHTML = `
    <header class="app-header">
        <h1>Âm Lịch</h1>
        <div class="app-header-actions">
            <button class="icon-btn" id="import-export-btn" aria-label="Cài đặt">
                <img src="assets/images/ico-setting.svg" alt="" class="icon-img">
            </button>
            <button class="icon-btn primary" id="add-event-btn" aria-label="Thêm sự kiện">
                <img src="assets/images/ico-calendar-add.svg" alt="" class="icon-img">
            </button>
        </div>
    </header>
    <nav class="tab-bar">
        <button class="tab-btn active" id="tab-calendar" aria-label="Lịch">
            <img src="assets/images/ico-calendar.svg" alt="" class="tab-icon">
            <span>Lịch</span>
        </button>
        <button class="tab-btn" id="tab-upcoming" aria-label="Sắp tới">
            <img src="assets/images/ico-events.svg" alt="" class="tab-icon">
            <span>Sắp tới</span>
        </button>
    </nav>
    <main id="view-container"></main>
    <div id="detail-container"></div>
    <div id="modal-container"></div>
    <div id="backdrop" class="backdrop"></div>
    <div id="toast" class="toast"></div>
    <div id="confirm" class="confirm-dialog"></div>
    <div id="today-fab" class="today-fab" aria-label="Hôm nay">Hôm nay</div>
`;

const viewContainer = document.getElementById("view-container")!;
const detailContainer = document.getElementById("detail-container")!;
const modalContainer = document.getElementById("modal-container")!;
const backdrop = document.getElementById("backdrop")!;
const toast = document.getElementById("toast")!;
const confirmDialog = document.getElementById("confirm")!;

/**
 * Surface-level confirmation dialog utility
 */
export async function showConfirm(
  title: string,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    confirmDialog.innerHTML = `
            <div class="confirm-dialog-box">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-dialog-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">Hủy</button>
                    <button class="btn btn-danger" id="confirm-ok">Tiếp tục</button>
                </div>
            </div>
        `;
    confirmDialog.classList.add("open");

    const cleanup = (result: boolean) => {
      confirmDialog.classList.remove("open");
      resolve(result);
    };

    confirmDialog
      .querySelector("#confirm-cancel")!
      .addEventListener("click", () => cleanup(false));
    confirmDialog
      .querySelector("#confirm-ok")!
      .addEventListener("click", () => cleanup(true));

    // click outside to cancel
    confirmDialog.addEventListener(
      "click",
      (e) => {
        if (e.target === confirmDialog) cleanup(false);
      },
      { once: true },
    );
  });
}

// --- Toast ---
let toastTimer: ReturnType<typeof setTimeout>;
function showToast(
  message: string,
  type: "success" | "error" | "warning" = "success",
) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// --- History API (FR-018) ---
function pushOverlayState() {
  window.history.pushState({ overlay: true }, "");
}

window.addEventListener("popstate", (event) => {
  // If we popped and an overlay is open, close it
  const modalOverlay = document.querySelector(".modal-overlay.open");
  const detailPanel = document.querySelector(".detail-panel.open");

  if (modalOverlay) {
    modalOverlay.classList.remove("open");
    setTimeout(() => modalOverlay.remove(), 300);
  } else if (detailPanel) {
    closeDetailPanel(detailContainer);
    backdrop.classList.remove("open");
  }
});

// --- Render Views ---
function renderCurrentView() {
  closeDetailPanel(detailContainer);
  backdrop.classList.remove("open");
  updateTodayFab();

  if (currentView === "calendar") {
    renderCalendarView();
  } else {
    renderUpcomingView();
  }
}

function updateTodayFab() {
  const fab = document.getElementById("today-fab");
  if (!fab) return;

  const now = new Date();
  const isTodayMonth =
    currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;

  if (!isTodayMonth && currentView === "calendar") {
    fab.classList.add("show");
  } else {
    fab.classList.remove("show");
  }
}

// Today FAB Click (US2)
document.getElementById("today-fab")?.addEventListener("click", () => {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;
  renderCurrentView();
});

function renderCalendarView() {
  let py = currentYear,
    pm = currentMonth - 1;
  if (pm < 1) {
    pm = 12;
    py--;
  }

  let ny = currentYear,
    nm = currentMonth + 1;
  if (nm > 12) {
    nm = 1;
    ny++;
  }

  const prevVm = buildCalendarViewModel(state, py, pm);
  const currVm = buildCalendarViewModel(state, currentYear, currentMonth);
  const nextVm = buildCalendarViewModel(state, ny, nm);

  const calContainer = document.createElement("div");
  calContainer.className = "calendar";
  viewContainer.innerHTML = "";
  viewContainer.appendChild(calContainer);

  renderCalendar(
    calContainer,
    [prevVm, currVm, nextVm],
    onCellClick,
    navigateMonth,
  );
}

function renderUpcomingView() {
  if (state.getEvents().length === 0) {
    viewContainer.innerHTML = `
            <div class="upcoming-list">
                <h2>Sự kiện sắp tới</h2>
                <div class="empty-state">
                <div class="empty-state-icon">
                    <img src="assets/images/ico-calendar.svg" alt="" style="width: 48px; height: 48px; opacity: 0.25;">
                </div>
                    <p>Chưa có sự kiện sắp tới</p>
                    <button class="btn btn-primary" id="empty-add-btn-up">Tạo sự kiện</button>
                </div>
            </div>
        `;
    viewContainer
      .querySelector("#empty-add-btn-up")
      ?.addEventListener("click", () => openCreateForm());
    return;
  }

  renderUpcomingList(viewContainer, state, onUpcomingItemClick);
}

function navigateMonth(direction: -1 | 1) {
  let nextMonth = currentMonth + direction;
  let nextYear = currentYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  if (nextMonth < 1) {
    nextMonth = 12;
    nextYear--;
  }

  // F1: Year boundary check
  if (nextYear < MIN_YEAR || nextYear > MAX_YEAR) {
    showToast(
      `${direction === -1 ? "Sớm nhất" : "Muộn nhất"} năm hỗ trợ là (${direction === -1 ? MIN_YEAR : MAX_YEAR})`,
      "warning",
    );
    return;
  }

  currentMonth = nextMonth;
  currentYear = nextYear;

  renderCurrentView();
}

// --- Interactions ---
function onCellClick(cell: CalendarCell) {
  renderDayDetailModal(
    modalContainer,
    cell.date,
    state.getOccurrencesForYear(currentYear),
    () => {
      // onClose - no special action needed as modal removes itself
    },
    (date: SolarDate) => {
      openCreateForm(date);
    },
    (_newDate: SolarDate) => {
      // onDateChange - optionally sync view if needed
    },
  );
}

function onUpcomingItemClick(occ: UpcomingEventOccurrence) {
  backdrop.classList.add("open");
  pushOverlayState();
  renderEventDetail(
    detailContainer,
    [occ],
    openEditForm,
    async (id, name) => {
      if (
        await showConfirm("Xóa sự kiện", `Bạn có chắc chắn muốn xóa "${name}"?`)
      ) {
        state.deleteEvent(id);
        renderCurrentView();
        showToast("Đã xóa sự kiện", "success");
      }
    },
    () => {
      closeDetailPanel(detailContainer);
      backdrop.classList.remove("open");
    },
  );
}

// --- Forms ---
function openCreateForm(initialDate?: SolarDate) {
  pushOverlayState();
  renderEventForm(
    modalContainer,
    state,
    null,
    () => {
      renderCurrentView();
      showToast("Event created!", "success");
    },
    () => {
      /* cancel */
    },
    initialDate,
  );
}

function openEditForm(eventId: string) {
  const event = state.getEvents().find((e) => e.id === eventId);
  if (!event) return;

  closeDetailPanel(detailContainer);
  backdrop.classList.remove("open");

  pushOverlayState();
  renderEventForm(
    modalContainer,
    state,
    event,
    () => {
      renderCurrentView();
      showToast("Event updated!", "success");
    },
    () => {
      /* cancel */
    },
  );
}

// --- Import/Export Modal ---
function openImportExport() {
  pushOverlayState();
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Cài đặt</h2>
                <button class="detail-panel-close" id="ie-close" aria-label="Đóng cài đặt">✕</button>
            </div>
            <div id="ie-content"></div>
        </div>
    `;
  modalContainer.appendChild(overlay);

  overlay.querySelector("#ie-close")!.addEventListener("click", () => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 300);
    }
  });

  renderImportExport(
    overlay.querySelector("#ie-content")!,
    state,
    (msg, type) => {
      showToast(msg, type);
      renderCurrentView();
    },
    showConfirm,
    () => {
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 300);
    },
  );
}

// --- Tab Switching ---
const tabCalendar = document.getElementById("tab-calendar")!;
const tabUpcoming = document.getElementById("tab-upcoming")!;

tabCalendar.addEventListener("click", () => {
  currentView = "calendar";
  tabCalendar.classList.add("active");
  tabUpcoming.classList.remove("active");
  renderCurrentView();
});

tabUpcoming.addEventListener("click", () => {
  currentView = "upcoming";
  tabUpcoming.classList.add("active");
  tabCalendar.classList.remove("active");
  renderCurrentView();
});

// --- Header Actions ---
document.getElementById("add-event-btn")!.addEventListener("click", () => {
  openCreateForm();
});
document
  .getElementById("import-export-btn")!
  .addEventListener("click", openImportExport);
backdrop.addEventListener("click", () => {
  closeDetailPanel(detailContainer);
  backdrop.classList.remove("open");
});

// --- Initial Render ---
renderCurrentView();

// Check for corrupted storage on load
if (state.corruptedOnLoad) {
  showToast("Could not load saved data — starting fresh.", "warning");
  state.clearCorruptedFlag();
}

// --- State Change Re-render ---
state.subscribe(() => renderCurrentView());
