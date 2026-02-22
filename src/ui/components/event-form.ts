import { LeapMonthRule } from '../../lib/index';
import type { LunarEvent } from '../../lib/index';
import type { EventFormData } from '../types';
import { LEAP_MONTH_LABELS } from '../types';
import type { AppState } from '../state';

/**
 * Render event creation/edit form as a modal overlay.
 */
export function renderEventForm(
    container: HTMLElement,
    state: AppState,
    editEvent: LunarEvent | null,
    onSaved: () => void,
    onCancel: () => void,
): void {
    const isEdit = editEvent !== null;
    const title = isEdit ? 'Sửa sự kiện' : 'Sự kiện mới';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="detail-panel-close" id="form-close" aria-label="Close form">✕</button>
            </div>
            <form id="event-form" novalidate>
                <div class="form-group">
                    <label for="event-name">Tên sự kiện</label>
                    <input type="text" id="event-name" maxlength="100" placeholder="ví dụ: Giỗ tổ Hùng Vương"
                           value="${isEdit ? escapeAttr(editEvent.name) : ''}" required>
                    <div class="char-count"><span id="char-current">${isEdit ? editEvent.name.length : 0}</span>/100</div>
                    <div class="form-error" id="name-error"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="lunar-day">Ngày âm</label>
                        <input type="number" id="lunar-day" min="1" max="30" placeholder="1–30"
                               value="${isEdit ? editEvent.lunarDate.day : ''}" required>
                        <div class="form-error" id="day-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="lunar-month">Tháng âm</label>
                        <input type="number" id="lunar-month" min="1" max="12" placeholder="1–12"
                               value="${isEdit ? editEvent.lunarDate.month : ''}" required>
                        <div class="form-error" id="month-error"></div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="leap-rule">Quy tắc tháng nhuận</label>
                    <select id="leap-rule">
                        ${Object.values(LeapMonthRule).map(rule =>
        `<option value="${rule}" ${isEdit && editEvent.leapMonthRule === rule ? 'selected' : ''}>
                                ${LEAP_MONTH_LABELS[rule]}
                            </option>`
    ).join('')}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary btn-block" id="submit-btn" aria-label="${isEdit ? 'Lưu thay đổi' : 'Tạo sự kiện'}">
                    ${isEdit ? 'Lưu thay đổi' : 'Tạo sự kiện'}
                </button>
            </form>
        </div>
    `;

    container.appendChild(overlay);

    // Character counter
    const nameInput = overlay.querySelector('#event-name') as HTMLInputElement;
    const charCount = overlay.querySelector('#char-current') as HTMLSpanElement;
    const charContainer = overlay.querySelector('.char-count') as HTMLElement;

    nameInput.addEventListener('input', () => {
        const len = nameInput.value.length;
        charCount.textContent = String(len);
        charContainer.classList.toggle('warning', len > 90);
    });

    // Close handlers
    overlay.querySelector('#form-close')!.addEventListener('click', () => {
        closeForm(overlay, onCancel);
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeForm(overlay, onCancel);
    });

    // Form submit
    const form = overlay.querySelector('#event-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(overlay);

        const name = nameInput.value.trim();
        const day = parseInt((overlay.querySelector('#lunar-day') as HTMLInputElement).value);
        const month = parseInt((overlay.querySelector('#lunar-month') as HTMLInputElement).value);
        const rule = (overlay.querySelector('#leap-rule') as HTMLSelectElement).value as LeapMonthRule;

        // Client-side quick checks (not domain logic, just empty-field guards)
        if (!name) {
            showError(overlay, 'name-error', 'event-name', 'Tên sự kiện không được để trống');
            return;
        }

        if (isNaN(day)) {
            showError(overlay, 'day-error', 'lunar-day', 'Ngày âm không hợp lệ');
            return;
        }

        if (isNaN(month)) {
            showError(overlay, 'month-error', 'lunar-month', 'Tháng âm không hợp lệ');
            return;
        }

        const formData: EventFormData = { name, lunarDay: day, lunarMonth: month, leapMonthRule: rule };

        try {
            if (isEdit) {
                state.editEvent(editEvent.id, formData);
            } else {
                state.createEvent(formData);
            }
            closeForm(overlay, onSaved);
        } catch (err: any) {
            // Domain validation error from Core Engine
            const msg = err.message || 'Dữ liệu không hợp lệ';
            if (msg.includes('day')) {
                showError(overlay, 'day-error', 'lunar-day', msg);
            } else if (msg.includes('month')) {
                showError(overlay, 'month-error', 'lunar-month', msg);
            } else {
                showError(overlay, 'name-error', 'event-name', msg);
            }
        }
    });

    // Focus first field
    setTimeout(() => nameInput.focus(), 100);
}

function closeForm(overlay: HTMLElement, callback: () => void): void {
    overlay.classList.remove('open');
    setTimeout(() => {
        overlay.remove();
        callback();
    }, 300);
}

function showError(overlay: HTMLElement, errorId: string, inputId: string, message: string): void {
    const errorEl = overlay.querySelector(`#${errorId}`) as HTMLElement;
    const inputEl = overlay.querySelector(`#${inputId}`) as HTMLElement;
    if (errorEl) errorEl.textContent = message;
    inputEl?.closest('.form-group')?.classList.add('has-error');
}

function clearErrors(overlay: HTMLElement): void {
    overlay.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    overlay.querySelectorAll('.form-error').forEach(e => (e as HTMLElement).textContent = '');
}

function escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
