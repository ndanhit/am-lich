import { LocalStorageAdapter } from '../../adapters/storage/local-storage-adapter';
import { AppState } from '../state';
import { buildCalendarViewModel, renderCalendar } from '../components/calendar';
import { renderEventDetail, closeDetailPanel } from '../components/event-detail';
import { renderEventForm } from '../components/event-form';
import { renderUpcomingList } from '../components/upcoming-list';
import { renderImportExport } from '../components/import-export';
import type { CalendarCell } from '../types';
import type { AppView } from '../types';
import type { UpcomingEventOccurrence, LunarEvent } from '../../lib/index';

// --- Year Boundary Constants (F1) ---
const MIN_YEAR = 1901;
const MAX_YEAR = 2099;

// --- Bootstrap ---
const adapter = new LocalStorageAdapter();
const state = new AppState(adapter);

let currentView: AppView = 'calendar';
let currentYear: number;
let currentMonth: number;
let isLoading = false;

// Initialize to current month
const now = new Date();
currentYear = now.getFullYear();
currentMonth = now.getMonth() + 1;

// --- DOM Setup ---
const app = document.getElementById('app')!;
app.innerHTML = `
    <header class="app-header">
        <h1>Âm Lịch</h1>
        <div class="app-header-actions">
            <button class="icon-btn" id="import-export-btn" aria-label="Cài đặt">⚙</button>
            <button class="icon-btn primary" id="add-event-btn" aria-label="Thêm sự kiện">📅+</button>
        </div>
    </header>
    <nav class="tab-bar">
        <button class="tab-btn active" id="tab-calendar" aria-label="Lịch">📅 Lịch</button>
        <button class="tab-btn" id="tab-upcoming" aria-label="Sắp tới">📋 Sắp tới</button>
    </nav>
    <main id="view-container"></main>
    <div id="detail-container"></div>
    <div id="modal-container"></div>
    <div id="backdrop" class="backdrop"></div>
    <div id="toast" class="toast"></div>
    <div id="confirm" class="confirm-dialog"></div>
`;

const viewContainer = document.getElementById('view-container')!;
const detailContainer = document.getElementById('detail-container')!;
const modalContainer = document.getElementById('modal-container')!;
const backdrop = document.getElementById('backdrop')!;
const toastEl = document.getElementById('toast')!;
const confirmEl = document.getElementById('confirm')!;

// --- Toast ---
let toastTimer: ReturnType<typeof setTimeout>;
function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// --- Confirm Dialog ---
function showConfirm(title: string, message: string, onConfirm: () => void) {
    confirmEl.className = 'confirm-dialog open';
    confirmEl.innerHTML = `
        <div class="confirm-dialog-box">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="confirm-dialog-actions">
                <button class="btn btn-secondary" id="confirm-cancel">Hủy</button>
                <button class="btn btn-danger" id="confirm-ok">Xóa</button>
            </div>
        </div>
    `;
    confirmEl.querySelector('#confirm-cancel')!.addEventListener('click', () => {
        confirmEl.className = 'confirm-dialog';
    });
    confirmEl.querySelector('#confirm-ok')!.addEventListener('click', () => {
        confirmEl.className = 'confirm-dialog';
        onConfirm();
    });
}

// --- History API (FR-018) ---
function pushOverlayState() {
    window.history.pushState({ overlay: true }, '');
}

window.addEventListener('popstate', (event) => {
    // If we popped and an overlay is open, close it
    const modalOverlay = document.querySelector('.modal-overlay.open');
    const detailPanel = document.querySelector('.detail-panel.open');

    if (modalOverlay) {
        modalOverlay.classList.remove('open');
        setTimeout(() => modalOverlay.remove(), 300);
    } else if (detailPanel) {
        closeDetailPanel(detailContainer);
        backdrop.classList.remove('open');
    }
});

// --- Render Views ---
function renderCurrentView() {
    closeDetailPanel(detailContainer);
    backdrop.classList.remove('open');

    if (currentView === 'calendar') {
        renderCalendarView();
    } else {
        renderUpcomingView();
    }
}

function renderCalendarView() {
    const vm = buildCalendarViewModel(state, currentYear, currentMonth);

    if (isLoading) {
        viewContainer.innerHTML = `
            <div class="calendar">
                <div class="calendar-nav">
                    <button id="cal-prev" aria-label="Previous month">‹</button>
                    <h2>${vm.monthLabel}</h2>
                    <button id="cal-next" aria-label="Next month">›</button>
                </div>
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        `;
        viewContainer.querySelector('#cal-prev')!.addEventListener('click', () => navigateMonth(-1));
        viewContainer.querySelector('#cal-next')!.addEventListener('click', () => navigateMonth(1));
        return;
    }

    const calContainer = document.createElement('div');
    calContainer.className = 'calendar';
    viewContainer.innerHTML = '';
    viewContainer.appendChild(calContainer);

    renderCalendar(calContainer, vm, onCellClick, navigateMonth);
}

function renderUpcomingView() {
    if (state.getEvents().length === 0) {
        viewContainer.innerHTML = `
            <div class="upcoming-list">
                <h2>Sự kiện sắp tới</h2>
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <p>Chưa có sự kiện sắp tới</p>
                    <button class="btn btn-primary" id="empty-add-btn-up">Tạo sự kiện</button>
                </div>
            </div>
        `;
        viewContainer.querySelector('#empty-add-btn-up')?.addEventListener('click', openCreateForm);
        return;
    }

    renderUpcomingList(viewContainer, state, onUpcomingItemClick);
}

// --- Navigation (F1: year bounds, F2: debounce) ---
let navDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function navigateMonth(direction: -1 | 1) {
    let nextMonth = currentMonth + direction;
    let nextYear = currentYear;
    if (nextMonth > 12) { nextMonth = 1; nextYear++; }
    if (nextMonth < 1) { nextMonth = 12; nextYear--; }

    // F1: Year boundary check
    if (nextYear < MIN_YEAR || nextYear > MAX_YEAR) {
        showToast(`${direction === -1 ? 'Earliest' : 'Latest'} supported year reached (${direction === -1 ? MIN_YEAR : MAX_YEAR})`, 'warning');
        return;
    }

    currentMonth = nextMonth;
    currentYear = nextYear;

    // Simulate loading for UX (FR-017)
    isLoading = true;
    renderCurrentView();

    if (navDebounceTimer) clearTimeout(navDebounceTimer);
    navDebounceTimer = setTimeout(() => {
        navDebounceTimer = null;
        isLoading = false;
        renderCurrentView();
    }, 200);
}

// --- Interactions ---
function onCellClick(cell: CalendarCell) {
    if (cell.events.length === 0) {
        closeDetailPanel(detailContainer);
        backdrop.classList.remove('open');
        return;
    }

    backdrop.classList.add('open');
    renderEventDetail(
        detailContainer,
        cell.events,
        openEditForm,
        (id, name) => showConfirm(
            'Delete Event',
            `Are you sure you want to delete "${name}"?`,
            () => { state.deleteEvent(id); renderCurrentView(); showToast('Event deleted', 'success'); }
        ),
        () => { closeDetailPanel(detailContainer); backdrop.classList.remove('open'); },
    );
}

function onUpcomingItemClick(occ: UpcomingEventOccurrence) {
    backdrop.classList.add('open');
    pushOverlayState();
    renderEventDetail(
        detailContainer,
        [occ],
        openEditForm,
        (id, name) => showConfirm(
            'Delete Event',
            `Are you sure you want to delete "${name}"?`,
            () => { state.deleteEvent(id); renderCurrentView(); showToast('Event deleted', 'success'); }
        ),
        () => { closeDetailPanel(detailContainer); backdrop.classList.remove('open'); },
    );
}

// --- Forms ---
function openCreateForm() {
    pushOverlayState();
    renderEventForm(modalContainer, state, null, () => {
        renderCurrentView();
        showToast('Event created!', 'success');
    }, () => { /* cancel */ });
}

function openEditForm(eventId: string) {
    const event = state.getEvents().find(e => e.id === eventId);
    if (!event) return;

    closeDetailPanel(detailContainer);
    backdrop.classList.remove('open');

    pushOverlayState();
    renderEventForm(modalContainer, state, event, () => {
        renderCurrentView();
        showToast('Event updated!', 'success');
    }, () => { /* cancel */ });
}

// --- Import/Export Modal ---
function openImportExport() {
    pushOverlayState();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
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

    overlay.querySelector('#ie-close')!.addEventListener('click', () => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('open');
            setTimeout(() => overlay.remove(), 300);
        }
    });

    renderImportExport(overlay.querySelector('#ie-content')!, state, (msg, type) => {
        showToast(msg, type);
        renderCurrentView();
    });
}

// --- Tab Switching ---
const tabCalendar = document.getElementById('tab-calendar')!;
const tabUpcoming = document.getElementById('tab-upcoming')!;

tabCalendar.addEventListener('click', () => {
    currentView = 'calendar';
    tabCalendar.classList.add('active');
    tabUpcoming.classList.remove('active');
    renderCurrentView();
});

tabUpcoming.addEventListener('click', () => {
    currentView = 'upcoming';
    tabUpcoming.classList.add('active');
    tabCalendar.classList.remove('active');
    renderCurrentView();
});

// --- Header Actions ---
document.getElementById('add-event-btn')!.addEventListener('click', openCreateForm);
document.getElementById('import-export-btn')!.addEventListener('click', openImportExport);
backdrop.addEventListener('click', () => {
    closeDetailPanel(detailContainer);
    backdrop.classList.remove('open');
});

// --- Initial Render ---
renderCurrentView();

// Check for corrupted storage on load
if (state.corruptedOnLoad) {
    showToast('Could not load saved data — starting fresh.', 'warning');
    state.clearCorruptedFlag();
}

// --- State Change Re-render ---
state.subscribe(() => renderCurrentView());
