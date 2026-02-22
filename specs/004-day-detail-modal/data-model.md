# Data Model: Day Detail Modal

## Entities

### `DayDetailState`
Represents the central state of the modal.
- `activeSolarDate`: `SolarDate` (Year, Month, Day) - The date currently displayed.
- `dayDetailInfo`: `DayDetailInfo` - The calculated view data for the `activeSolarDate`.

### `DayDetailInfo`
DTO containing all information displayed in the modal sections.
- `solarDateLabel`: `string` (e.g., "22 Tháng 02 năm 2026")
- `lunarDateLabel`: `string` (e.g., "6 Tháng 1 năm Bính Ngọ")
- `canChiDayLabel`: `string` (e.g., "Ngày Đinh Mão")
- `canChiMonthLabel`: `string` (e.g., "Tháng Canh Dần")
- `fateElement`: `string` (e.g., "Lô Trung Hỏa")
- `auspiciousHours`: `string[]` (e.g., ["Tý (23h-1h)", "Sửu (1h-3h)"])
- `incompatibleAges`: `string[]` (e.g., ["Quý Dậu", "Ất Dậu"])
- `events`: `UpcomingEventOccurrence[]` - Sorted by startTime.

## Relationships
- `DayDetailState` is maintained locally within the `DayDetailModal` component.
- `DayDetailInfo` is re-calculated whenever `activeSolarDate` changes.
- `events` are filtered from `AppState` based on the `activeSolarDate`.

## Validation Rules
- `activeSolarDate` MUST be within the range [1901-01-01, 2099-12-31].
- `auspiciousHours` and `incompatibleAges` labels MUST be translated into Vietnamese using `translateGanZhiToVietnamese`.
