import type { UpcomingEventOccurrence } from '../../lib/index';
import { LEAP_MONTH_LABELS } from '../types';

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

    // Render first event or list
    const html = occurrences.map(occ => {
        const ev = occ.event;
        const daysText = occ.daysUntil === 0 ? 'Today' :
            occ.daysUntil === 1 ? 'Tomorrow' :
                `${occ.daysUntil} days`;
        const leapLabel = LEAP_MONTH_LABELS[ev.leapMonthRule];
        const leapTag = occ.isLeapMonthOccurrence ? ' <span style="color:var(--color-warning)">(Leap)</span>' : '';

        return `
            <div class="detail-event-item" data-event-id="${ev.id}">
                <div class="detail-panel-header">
                    <h3>${escapeHtml(ev.name)}${leapTag}</h3>
                </div>
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <span class="label">Lunar date</span>
                        <span>Month ${ev.lunarDate.month}, Day ${ev.lunarDate.day}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="label">Solar date</span>
                        <span>${occ.solarDate.year}/${String(occ.solarDate.month).padStart(2, '0')}/${String(occ.solarDate.day).padStart(2, '0')}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="label">Leap rule</span>
                        <span>${leapLabel}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="label">Next in</span>
                        <span>${daysText}</span>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="btn btn-secondary edit-btn" data-id="${ev.id}" aria-label="Edit ${escapeHtml(ev.name)}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-id="${ev.id}" data-name="${escapeHtml(ev.name)}" aria-label="Delete ${escapeHtml(ev.name)}">Delete</button>
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
