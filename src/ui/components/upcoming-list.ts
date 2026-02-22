import type { SolarDate, UpcomingEventOccurrence } from '../../lib/index';
import { MONTH_NAMES_SHORT, RECURRENCE_LABELS } from '../types';
import { formatSolarDate } from '../../lib/index';
import type { AppState } from '../state';
import { RecurrenceRule } from '../../core/models/types';

/** Get today's solar date */
function getToday(): SolarDate {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Render upcoming events list */
export function renderUpcomingList(
    container: HTMLElement,
    state: AppState,
    onEventClick: (occurrence: UpcomingEventOccurrence) => void,
): void {
    container.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'upcoming-list';

    const h2 = document.createElement('h2');
    h2.textContent = 'Sự kiện sắp tới';
    section.appendChild(h2);

    const today = getToday();
    const occurrences = state.getUpcoming(today, 20);

    if (occurrences.length === 0) {
        section.innerHTML += `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>Chưa có sự kiện sắp tới</p>
            </div>
        `;
        container.appendChild(section);
        return;
    }

    occurrences.forEach(occ => {
        const item = document.createElement('div');
        item.className = 'upcoming-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `${occ.event.name}, ${formatDaysUntil(occ.daysUntil)}`);

        const leapTag = occ.isLeapMonthOccurrence
            ? ' <span class="leap-tag">(Nhuận)</span>'
            : '';

        const solarStr = formatSolarDate(occ.solarDate);
        const lunarYearStr = occ.event.lunarYear ? `/${occ.event.lunarYear}` : '';
        const recurrenceBadge = (occ.event.recurrence && occ.event.recurrence !== RecurrenceRule.ONCE)
            ? `<span class="event-recurrence-badge">${RECURRENCE_LABELS[occ.event.recurrence]}</span>`
            : '';

        item.innerHTML = `
            <div class="upcoming-date-badge">
                <span class="month">${MONTH_NAMES_SHORT[occ.solarDate.month - 1]}</span>
                <span class="day">${occ.solarDate.day}</span>
            </div>
            <div class="upcoming-info">
                <div class="event-name-row">
                    <div class="event-name">${escapeHtml(occ.event.name)}</div>
                    ${recurrenceBadge}
                </div>
                <div class="lunar-label">Dương lịch: ${solarStr}</div>
                <div class="lunar-label sub">Âm lịch ${occ.event.lunarDate.month}/${occ.event.lunarDate.day}${lunarYearStr}${leapTag}</div>
            </div>
            <span class="days-until-badge ${occ.daysUntil === 0 ? 'today' : occ.daysUntil <= 7 ? 'soon' : ''}">
                ${formatDaysUntil(occ.daysUntil)}
            </span>
        `;

        item.addEventListener('click', () => onEventClick(occ));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEventClick(occ);
            }
        });

        section.appendChild(item);
    });

    container.appendChild(section);
}

function formatDaysUntil(days: number): string {
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Ngày mai';
    return `${days} ngày`;
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
