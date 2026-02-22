import { RecurrenceRule, UpcomingEventOccurrence } from '../../core/models/types';
import { RECURRENCE_LABELS } from '../types';
import { formatSolarDate, formatLunarDate } from '../../lib/index';

/** Render event detail panel */
export function renderEventDetail(
    container: HTMLElement,
    occurrences: UpcomingEventOccurrence[],
    onEdit: (eventId: string) => void,
    onDelete: (eventId: string, eventName: string) => void,
    onClose: () => void,
): void {
    if (occurrences.length === 0) {
        closeDetailPanel(container);
        return;
    }

    container.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'detail-panel open';

    // Render occurrences
    const html = occurrences.map(occ => {
        const ev = occ.event;
        const daysText = occ.daysUntil === 0 ? 'Hôm nay' :
            occ.daysUntil === 1 ? 'Ngày mai' :
                `${occ.daysUntil} ngày nữa`;

        const leapTag = occ.isLeapMonthOccurrence ? ' <span style="color:var(--color-warning)">(Nhuận)</span>' : '';

        const lunarStr = occ.lunarContext ? formatLunarDate(occ.lunarContext) : `Tháng ${ev.lunarDate.month}, Ngày ${ev.lunarDate.day}`;
        const solarStr = formatSolarDate(occ.solarDate);

        const recurrenceBadge = (ev.recurrence && ev.recurrence !== RecurrenceRule.ONCE)
            ? `<span class="event-recurrence-badge">${RECURRENCE_LABELS[ev.recurrence]}</span>`
            : '';

        return `
            <div class="detail-event-item" data-event-id="${ev.id}">
                <div class="detail-panel-header">
                    <div class="event-name-row">
                        <h3>${escapeHtml(ev.name)}${leapTag}</h3>
                        ${recurrenceBadge}
                    </div>
                </div>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <span class="label">Ngày âm lịch</span>
                        <span>${lunarStr}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="label">Ngày dương lịch</span>
                        <span>${solarStr}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="label">Sắp tới trong</span>
                        <span>${daysText}</span>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn btn-secondary edit-btn" data-id="${ev.id}" aria-label="Sửa ${escapeHtml(ev.name)}">Sửa</button>
                    <button class="btn btn-danger delete-btn" data-id="${ev.id}" data-name="${escapeHtml(ev.name)}" aria-label="Xóa ${escapeHtml(ev.name)}">Xóa</button>
                </div>
            </div>
        `;
    }).join('<hr style="border:none;border-top:1px solid var(--color-border-subtle);margin:var(--space-4) 0">');

    panel.innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:var(--space-2)">
            <button class="detail-panel-close" aria-label="Close panel">✕</button>
        </div>
        ${html}
    `;

    container.appendChild(panel);

    // Wire close
    panel.querySelector('.detail-panel-close')!.addEventListener('click', onClose);

    // Wire edit buttons
    panel.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            onEdit((btn as HTMLElement).dataset.id!);
        });
    });

    // Wire delete buttons
    panel.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const el = btn as HTMLElement;
            onDelete(el.dataset.id!, el.dataset.name!);
        });
    });
}

export function closeDetailPanel(container: HTMLElement): void {
    const panel = container.querySelector('.detail-panel');
    if (panel) {
        panel.classList.remove('open');
        setTimeout(() => { container.innerHTML = ''; }, 300);
    } else {
        container.innerHTML = '';
    }
}

function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
