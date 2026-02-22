import { SolarDate, LunarDateContext, UpcomingEventOccurrence, RecurrenceRule } from '../../core/models/types';
import { convertSolarToLunar } from '../../core/lunar-math/converter';
import { formatSolarDate, formatLunarDate } from '../../lib/formatters';
import { RECURRENCE_LABELS } from '../types';

export interface DayDetailState {
    activeSolarDate: SolarDate;
    events: UpcomingEventOccurrence[];
}

export function renderDayDetailModal(
    container: HTMLElement,
    initialDate: SolarDate,
    allEvents: UpcomingEventOccurrence[],
    onClose: () => void,
    onAddEvent: (date: SolarDate) => void,
    onDateChange?: (date: SolarDate) => void
) {
    let state: DayDetailState = {
        activeSolarDate: initialDate,
        events: filterEventsForDate(allEvents, initialDate)
    };

    const overlay = document.createElement('div');
    overlay.className = 'day-detail-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Chi tiết ngày');

    const content = document.createElement('div');
    content.className = 'day-detail-modal';
    overlay.appendChild(content);

    // Disable body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function filterEventsForDate(events: UpcomingEventOccurrence[], date: SolarDate) {
        return events.filter(e =>
            e.solarDate.year === date.year &&
            e.solarDate.month === date.month &&
            e.solarDate.day === date.day
        );
    }

    function update(newDate: SolarDate) {
        state.activeSolarDate = newDate;
        state.events = filterEventsForDate(allEvents, newDate);
        render();
        if (onDateChange) onDateChange(newDate);
    }

    function render() {
        const lunarContext = convertSolarToLunar(
            state.activeSolarDate.year,
            state.activeSolarDate.month,
            state.activeSolarDate.day
        );

        if (!lunarContext) return;

        content.innerHTML = `
            <div class="modal-header">
                <button class="close-btn" aria-label="Đóng">&times;</button>
                <div class="nav-controls">
                    <button class="nav-btn prev-day" aria-label="Ngày trước">&larr;</button>
                    <div class="current-date-display">
                        <span class="solar-label">${formatSolarDate(state.activeSolarDate)}</span>
                        <button class="quick-view-btn" aria-label="Xem nhanh ngày">📅</button>
                    </div>
                    <button class="nav-btn next-day" aria-label="Ngày sau">&rarr;</button>
                </div>
            </div>
            
            <div class="modal-sections">
            <div class="modal-sections">
                <section class="section-dates">
                    <div class="lunar-line-1">Ngày <span class="big-day">${lunarContext.lunarDay}</span></div>
                    <div class="lunar-line-2">Tháng ${Math.abs(lunarContext.lunarMonth)}${lunarContext.isLeapMonth ? ' nhuận' : ''} năm ${lunarContext.canChiYear}</div>
                    <div class="lunar-line-3">Ngày ${lunarContext.canChiDay} - Tháng ${lunarContext.canChiMonth}</div>
                </section>

                <section class="section-events">
                    <h3>Sự kiện</h3>
                    <div class="event-list">
                        ${state.events.length > 0 ?
                state.events.map(e => `
                                <div class="event-item">
                                    <div class="event-info">
                                        <span class="event-name">${e.event.name}</span>
                                        ${e.event.recurrence && e.event.recurrence !== RecurrenceRule.ONCE ?
                        `<span class="event-recurrence-badge">${RECURRENCE_LABELS[e.event.recurrence]}</span>` : ''}
                                    </div>
                                </div>
                            `).join('') :
                '<p class="no-events">Không có sự kiện nào.</p>'
            }
                    </div>
                    <button class="add-event-compact-btn">Thêm sự kiện</button>
                </section>
            </div>
        `;

        // Wire up events
        const datePicker = document.createElement('input');
        datePicker.type = 'date';
        datePicker.className = 'hidden-date-picker';
        datePicker.style.position = 'absolute';
        datePicker.style.opacity = '0';
        datePicker.style.pointerEvents = 'none';
        content.querySelector('.current-date-display')?.appendChild(datePicker);

        content.querySelector('.close-btn')?.addEventListener('click', () => {
            overlay.remove();
            document.body.style.overflow = originalOverflow;
            onClose();
        });

        content.querySelector('.add-event-compact-btn')?.addEventListener('click', () => {
            onAddEvent(state.activeSolarDate);
        });

        content.querySelector('.prev-day')?.addEventListener('click', () => {
            const d = new Date(state.activeSolarDate.year, state.activeSolarDate.month - 1, state.activeSolarDate.day - 1);
            update({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
        });

        content.querySelector('.next-day')?.addEventListener('click', () => {
            const d = new Date(state.activeSolarDate.year, state.activeSolarDate.month - 1, state.activeSolarDate.day + 1);
            update({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
        });

        const pickerTrigger = content.querySelector('.quick-view-btn');
        const openPicker = (e: Event) => {
            e.preventDefault();
            datePicker.showPicker();
        };
        pickerTrigger?.addEventListener('click', openPicker);
        pickerTrigger?.addEventListener('touchend', openPicker);

        datePicker.addEventListener('change', (e) => {
            const val = (e.target as HTMLInputElement).value;
            if (val) {
                const [y, m, d] = val.split('-').map(Number);
                update({ year: y, month: m, day: d });
            }
        });
    }

    render();
    container.appendChild(overlay);

    // Global listeners
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.body.style.overflow = originalOverflow;
            onClose();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}
