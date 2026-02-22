import { LeapMonthRule, RecurrenceRule } from '../../lib/index';
import type { LunarEvent } from '../../lib/index';
import type { EventFormData } from '../types';
import { LEAP_MONTH_LABELS, RECURRENCE_LABELS } from '../types';
import type { AppState } from '../state';
import { convertSolarToLunar } from '../../core/lunar-math/converter';
import type { SolarDate } from '../../core/models/types';

/**
 * Render event creation/edit form as a modal overlay.
 */
export function renderEventForm(
    container: HTMLElement,
    state: AppState,
    editEvent: LunarEvent | null,
    onSaved: () => void,
    onCancel: () => void,
    initialDate?: SolarDate,
): void {
    const isEdit = editEvent !== null;
    const title = isEdit ? 'Sửa sự kiện' : 'Sự kiện mới';

    // Pre-fill logic for new events from Day Detail Modal
    let defaultDay = '';
    let defaultMonth = '';
    if (isEdit) {
        defaultDay = String(editEvent.lunarDate.day);
        defaultMonth = String(editEvent.lunarDate.month);
    } else {
        const referenceDate = initialDate || {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate()
        };
        const lunar = convertSolarToLunar(referenceDate.year, referenceDate.month, referenceDate.day);
        if (lunar) {
            defaultDay = String(lunar.lunarDay);
            defaultMonth = String(Math.abs(lunar.lunarMonth));
        }
    }

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
                <div class="form-group">
                    <label>Lặp lại</label>
                    <div class="recurrence-options">
                        ${Object.values(RecurrenceRule).map(rule => `
                            <label class="recurrence-option">
                                <input type="radio" name="recurrence" value="${rule}" ${(isEdit ? editEvent.recurrence === rule : rule === RecurrenceRule.YEARLY) ? 'checked' : ''}>
                                ${RECURRENCE_LABELS[rule]}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-row" id="date-row">
                    <div class="form-group" id="year-group" style="display: ${(isEdit && editEvent.recurrence === RecurrenceRule.ONCE) ? 'block' : 'none'}">
                        <label for="lunar-year">Năm âm</label>
                        <input type="number" id="lunar-year" min="1901" max="2099" placeholder="2026"
                               value="${isEdit ? (editEvent.lunarYear || 2026) : (initialDate ? initialDate.year : 2026)}">
                        <div class="form-error" id="year-error"></div>
                    </div>
                    <div class="form-group" id="month-group" style="display: ${(isEdit && editEvent.recurrence === RecurrenceRule.MONTHLY) ? 'none' : 'block'}">
                        <label for="lunar-month">Tháng âm</label>
                        <input type="number" id="lunar-month" min="1" max="12" placeholder="1–12"
                               value="${defaultMonth}" required>
                        <div class="form-error" id="month-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="lunar-day">Ngày âm</label>
                        <input type="number" id="lunar-day" min="1" max="30" placeholder="1–30"
                               value="${defaultDay}" required>
                        <div class="form-error" id="day-error"></div>
                    </div>
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

    // --- Dynamic Field Visibility ---
    const monthGroup = overlay.querySelector('#month-group') as HTMLElement;
    const yearGroup = overlay.querySelector('#year-group') as HTMLElement;
    const recurrenceInputs = overlay.querySelectorAll('input[name="recurrence"]');

    recurrenceInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const val = (e.target as HTMLInputElement).value as RecurrenceRule;
            if (val === RecurrenceRule.MONTHLY) {
                monthGroup.style.display = 'none';
                yearGroup.style.display = 'none';
            } else if (val === RecurrenceRule.ONCE) {
                monthGroup.style.display = 'block';
                yearGroup.style.display = 'block';
            } else {
                monthGroup.style.display = 'block';
                yearGroup.style.display = 'none';
            }
        });
    });

    // --- Form Submission ---
    overlay.querySelector('#event-form')!.addEventListener('submit', (e) => {
        e.preventDefault();

        // Clear previous errors
        overlay.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        overlay.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

        const name = nameInput.value.trim();
        const recurrence = (overlay.querySelector('input[name="recurrence"]:checked') as HTMLInputElement).value as RecurrenceRule;
        const day = parseInt((overlay.querySelector('#lunar-day') as HTMLInputElement).value);
        const month = parseInt((overlay.querySelector('#lunar-month') as HTMLInputElement).value);
        const year = parseInt((overlay.querySelector('#lunar-year') as HTMLInputElement).value);

        // Client-side quick checks
        if (!name) {
            showError(overlay, 'name-error', 'event-name', 'Tên sự kiện không được để trống');
            return;
        }

        if (isNaN(day)) {
            showError(overlay, 'day-error', 'lunar-day', 'Ngày âm không hợp lệ');
            return;
        }

        if (recurrence !== RecurrenceRule.MONTHLY && isNaN(month)) {
            showError(overlay, 'month-error', 'lunar-month', 'Tháng âm không hợp lệ');
            return;
        }

        if (recurrence === RecurrenceRule.ONCE && isNaN(year)) {
            showError(overlay, 'year-error', 'lunar-year', 'Năm âm không hợp lệ');
            return;
        }

        const formData: EventFormData = {
            name,
            lunarDay: day,
            lunarMonth: recurrence === RecurrenceRule.MONTHLY ? 1 : month, // month 1 serves as dummy for monthly
            lunarYear: recurrence === RecurrenceRule.ONCE ? year : undefined,
            recurrence: recurrence,
            leapMonthRule: LeapMonthRule.REGULAR_ONLY
        };

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
