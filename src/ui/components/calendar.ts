import type { UpcomingEventOccurrence, SolarDate } from '../../lib/index';
import type { CalendarViewModel, CalendarCell } from '../types';
import { MONTH_NAMES, WEEKDAY_HEADERS } from '../types';
import type { AppState } from '../state';

/** Get today's solar date */
function getToday(): SolarDate {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Check if two solar dates are the same */
function isSameDate(a: SolarDate, b: SolarDate): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Get number of days in a solar month */
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

/** Get day of week for first day of month (0=Sun) */
function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month - 1, 1).getDay();
}

/** Build complete CalendarViewModel */
export function buildCalendarViewModel(state: AppState, year: number, month: number): CalendarViewModel {
    const occurrences = state.getOccurrencesForYear(year);
    const today = getToday();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDow = getFirstDayOfWeek(year, month);

    // Previous month padding
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);

    const cells: CalendarCell[] = [];

    // Pad with previous month days
    for (let i = firstDow - 1; i >= 0; i--) {
        const day = daysInPrev - i;
        const date: SolarDate = { year: prevYear, month: prevMonth, day };
        cells.push({
            date,
            isCurrentMonth: false,
            isToday: isSameDate(date, today),
            events: occurrences.filter(o => isSameDate(o.solarDate, date)),
        });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date: SolarDate = { year, month, day };
        cells.push({
            date,
            isCurrentMonth: true,
            isToday: isSameDate(date, today),
            events: occurrences.filter(o => isSameDate(o.solarDate, date)),
        });
    }

    // Fill remaining to complete rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    for (let day = 1; day <= remaining; day++) {
        const date: SolarDate = { year: nextYear, month: nextMonth, day };
        cells.push({
            date,
            isCurrentMonth: false,
            isToday: isSameDate(date, today),
            events: occurrences.filter(o => isSameDate(o.solarDate, date)),
        });
    }

    return {
        year,
        month,
        cells,
        monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
    };
}

/** Render the calendar component into a container */
export function renderCalendar(
    container: HTMLElement,
    viewModel: CalendarViewModel,
    onCellClick: (cell: CalendarCell) => void,
    onNavigate: (direction: -1 | 1) => void,
): void {
    container.innerHTML = '';

    // Nav bar
    const nav = document.createElement('div');
    nav.className = 'calendar-nav';
    nav.innerHTML = `
        <button id="cal-prev" aria-label="Previous month">‹</button>
        <h2>${viewModel.monthLabel}</h2>
        <button id="cal-next" aria-label="Next month">›</button>
    `;
    container.appendChild(nav);

    nav.querySelector('#cal-prev')!.addEventListener('click', () => onNavigate(-1));
    nav.querySelector('#cal-next')!.addEventListener('click', () => onNavigate(1));

    // Weekday headers
    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    WEEKDAY_HEADERS.forEach(d => {
        const span = document.createElement('span');
        span.textContent = d;
        weekdays.appendChild(span);
    });
    container.appendChild(weekdays);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    viewModel.cells.forEach(cell => {
        const el = document.createElement('div');
        el.className = 'calendar-cell';
        if (!cell.isCurrentMonth) el.classList.add('other-month');
        if (cell.isToday) el.classList.add('today');

        const dayNum = document.createElement('span');
        dayNum.className = 'day-number';
        dayNum.textContent = String(cell.date.day);
        el.appendChild(dayNum);

        if (cell.events.length > 0) {
            if (cell.events.length <= 3) {
                const dots = document.createElement('div');
                dots.className = 'event-dots';
                cell.events.forEach(ev => {
                    const dot = document.createElement('span');
                    dot.className = 'event-dot';
                    if (ev.isLeapMonthOccurrence) dot.classList.add('leap');
                    dots.appendChild(dot);
                });
                el.appendChild(dots);
            } else {
                const badge = document.createElement('span');
                badge.className = 'event-count-badge';
                badge.textContent = `${cell.events.length}`;
                el.appendChild(badge);
            }
        }

        el.addEventListener('click', () => onCellClick(cell));
        grid.appendChild(el);
    });

    container.appendChild(grid);

    // Empty state (only if global dataset is truly empty — checked by caller)
}
