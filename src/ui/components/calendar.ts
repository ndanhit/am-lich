import { convertSolarToLunar } from '../../lib/index';
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
    const leadingDays = (firstDow + 6) % 7;

    // Pad with previous month days
    for (let i = leadingDays - 1; i >= 0; i--) {
        const day = daysInPrev - i;
        const date: SolarDate = { year: prevYear, month: prevMonth, day };
        const lunar = convertSolarToLunar(date.year, date.month, date.day) || undefined;
        const currentIdx = cells.length;
        cells.push({
            date,
            lunar,
            isCurrentMonth: false,
            isToday: isSameDate(date, today),
            isSunday: currentIdx % 7 === 6,
            dayOfWeek: currentIdx % 7,
            isFirstDayOfLunar: lunar?.lunarDay === 1,
            events: occurrences.filter(o => isSameDate(o.solarDate, date)),
        });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date: SolarDate = { year, month, day };
        const lunar = convertSolarToLunar(date.year, date.month, date.day) || undefined;
        const currentIdx = cells.length;
        cells.push({
            date,
            lunar,
            isCurrentMonth: true,
            isToday: isSameDate(date, today),
            isSunday: currentIdx % 7 === 6,
            dayOfWeek: currentIdx % 7,
            isFirstDayOfLunar: lunar?.lunarDay === 1,
            events: occurrences.filter(o => isSameDate(o.solarDate, date)),
        });
    }

    // Fill remaining to complete rows of 7
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    while (cells.length % 7 !== 0) {
        const day = (cells.length - leadingDays - daysInMonth) + 1;
        const date: SolarDate = { year: nextYear, month: nextMonth, day };
        const lunar = convertSolarToLunar(date.year, date.month, date.day) || undefined;
        const currentIdx = cells.length;
        cells.push({
            date,
            lunar,
            isCurrentMonth: false,
            isToday: isSameDate(date, today),
            isSunday: currentIdx % 7 === 6,
            dayOfWeek: currentIdx % 7,
            isFirstDayOfLunar: lunar?.lunarDay === 1,
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
        <h2>${viewModel.monthLabel}</h2>
    `;
    container.appendChild(nav);

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
        if (cell.isSunday) el.classList.add('sunday');

        const dayNum = document.createElement('span');
        dayNum.className = 'day-number';
        dayNum.textContent = String(cell.date.day);
        el.appendChild(dayNum);

        if (cell.lunar) {
            const lunarDay = document.createElement('span');
            lunarDay.className = 'lunar-day';
            if (cell.isFirstDayOfLunar) lunarDay.classList.add('mung-1');
            lunarDay.textContent = cell.isFirstDayOfLunar ? `1/${cell.lunar.lunarMonth}` : String(cell.lunar.lunarDay);
            el.setAttribute('data-lunar-date', `${cell.lunar.lunarYear}-${cell.lunar.lunarMonth}-${cell.lunar.lunarDay}`);
            el.appendChild(lunarDay);
        }

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
