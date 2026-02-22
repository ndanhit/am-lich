# Research: Day Detail Modal

## unknowns

- [ ] How to retrieve "Mệnh ngày", "Giờ hoàng đạo", and "Tuổi xung" from `lunar-javascript`?
- [ ] Best pattern for "Focus Trap" in the existing Vanilla TS setup.
- [ ] Native date picker integration: How to trigger it cleanly from a "Quick view" button.

## Findings

### Auspicious Data (Fortune)
*Task: Research `lunar-javascript` for Section 2 data:*
- Decision: Use the following `Lunar` object methods:
    - `getDayNaYin()` for "Mệnh ngày" (Fate Element).
    - `getTimes().filter(t => t.getTianShenLuck() === '吉')` for "Giờ hoàng đạo" (Auspicious Hours).
    - `getChongShengXiao()` and `getChongDesc()` for "Tuổi xung" (Incompatible Ages).
- Rationale: These methods directly provide the required traditional data in the correct format for translation using existing `translateGanZhiToVietnamese`.

### Focus Trap Implementation
*Task: Research best practices for Vanila TS focus trap:*
- Decision: Implement a manual focus trap by listening for `keydown` (Tab/Shift+Tab) on the modal element.
- Rationale: It’s a lightweight solution that avoids external dependencies (Constitution Principle V: Simplicity).

### Native Date Picker Trigger
*Task: Research hidden input trigger pattern:*
- Decision: Use a hidden `<input type="date">` and trigger it using `input.showPicker()` (with `input.click()` fallback).
- Rationale: This is the most reliable way to trigger the browser's native date picker UI while maintaining custom styling for the "trigger" button.
