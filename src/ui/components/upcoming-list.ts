import type {
  SolarDate,
  UpcomingEventOccurrence,
  GroupedUpcomingEvents,
} from "../../lib/index";
import { MONTH_NAMES_SHORT, RECURRENCE_LABELS } from "../types";
import { formatSolarDate } from "../../lib/index";
import type { AppState } from "../state";
import { RecurrenceRule } from "../../core/models/types";

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
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "upcoming-list";

  const h2 = document.createElement("h2");
  h2.textContent = "Sự kiện sắp tới";
  section.appendChild(h2);

  const today = getToday();
  const occurrences = state.getUpcoming(today, 30); // Increased limit slightly for better year spread

  if (occurrences.length === 0) {
    section.innerHTML += `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <img src="assets/images/ico-events.svg" alt="" style="width: 48px; height: 48px; opacity: 0.25;">
                </div>
                <p>Chưa có sự kiện sắp tới</p>
            </div>
        `;
    container.appendChild(section);
    return;
  }

  // T009: Group occurrences by year
  const groups: GroupedUpcomingEvents[] = [];
  occurrences.forEach((occ) => {
    let group = groups.find((g) => g.year === occ.solarDate.year);
    if (!group) {
      group = { year: occ.solarDate.year, occurrences: [] };
      groups.push(group);
    }
    group.occurrences.push(occ);
  });

  // T010: Render grouped list
  groups.forEach((group) => {
    const yearHeader = document.createElement("div");
    yearHeader.className = "upcoming-year-header";
    yearHeader.textContent = `Năm ${group.year}`;
    section.appendChild(yearHeader);

    const groupList = document.createElement("div");
    groupList.className = "upcoming-grouped-list";

    group.occurrences.forEach((occ: UpcomingEventOccurrence) => {
      const item = document.createElement("div");
      item.className = "upcoming-item";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute(
        "aria-label",
        `${occ.event.name}, ${formatDaysUntil(occ.daysUntil)}`,
      );

      const leapTag = occ.isLeapMonthOccurrence
        ? ' <span class="leap-tag">(Nhuận)</span>'
        : "";

      const solarStr = formatSolarDate(occ.solarDate);
      const lunarYearStr = occ.event.lunarYear ? `/${occ.event.lunarYear}` : "";
      const recurrenceBadge =
        occ.event.recurrence && occ.event.recurrence !== RecurrenceRule.ONCE
          ? `<span class="event-recurrence-badge">${RECURRENCE_LABELS[occ.event.recurrence]}</span>`
          : "";

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
                    <div class="lunar-label sub">Âm lịch ${occ.event.lunarDate.day}/${occ.event.lunarDate.month}${lunarYearStr}${leapTag}</div>
                </div>
                <span class="days-until-badge ${occ.daysUntil === 0 ? "today" : occ.daysUntil <= 7 ? "soon" : ""}">
                    ${formatDaysUntil(occ.daysUntil)}
                </span>
            `;

      item.addEventListener("click", () => onEventClick(occ));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEventClick(occ);
        }
      });

      groupList.appendChild(item);
    });
    section.appendChild(groupList);
  });

  container.appendChild(section);
}

function formatDaysUntil(days: number): string {
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Ngày mai";
  return `${days} ngày`;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
