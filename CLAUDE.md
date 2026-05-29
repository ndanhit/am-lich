# Hướng dẫn cho Claude Code

## Project overview

Single-page web app TypeScript vanilla + esbuild quản lý sự kiện theo Âm lịch
(Vietnamese lunar calendar). Offline-first (localStorage), tuỳ chọn backup
Supabase. UI tiếng Việt, dùng `lunar-javascript` cho astronomical math.

Kiến trúc layered:
- `src/core/` — domain logic (lunar math, models, system events)
- `src/application/` — use cases (CRUD, queries, sync)
- `src/adapters/` — persistence (localStorage, Supabase)
- `src/ui/` — vanilla components, state manager

## Commands

```bash
npm test                # vitest run (no coverage)
npm run test:coverage   # vitest + coverage threshold gate
npm run build:ui        # esbuild bundle → dist/app.bundle.js
npm run dev             # build + serve on :3456
npm run lint            # eslint
```

## Test coverage requirement (≥80%)

**Bất cứ thay đổi code nào trong các thư mục sau phải duy trì coverage ≥80%**
trên cả 4 metric (statements, branches, functions, lines):

- `src/core/**`
- `src/application/**`
- `src/adapters/storage/**`
- `src/lib/**`

Cấu hình threshold ở `vitest.config.ts`. UI (`src/ui/**`) và Supabase adapter
(`src/adapters/supabase/**`) được **exclude** vì cần DOM/network mock — viết
test riêng nếu thật sự cần, không bắt buộc.

### Quy trình bắt buộc khi sửa/thêm code trong scope coverage

1. Trước khi push: chạy `npm run test:coverage`. Nếu fail threshold → bổ sung test cho phần code mới hoặc đã đổi.
2. Khi thêm function/branch mới mà chưa cover → viết test trong `tests/`
   theo mirror structure của `src/`.
3. Pure functions → unit test đơn giản (xem `tests/application/memo-crud.test.ts`).
4. Adapters chạm `localStorage`/`global` → mock global state (xem
   `tests/adapters/storage/local-storage-adapter.test.ts`).
5. Không hạ threshold để tránh viết test. Nếu code thật sự không testable
   (vd: cần DOM phức tạp), thêm vào `coverage.exclude` của `vitest.config.ts`
   và giải thích lý do trong PR.

## Code conventions

- Immutable updates — không mutate input arrays (`[...arr, newItem]`).
- Vietnamese UI strings — hardcoded inline, không có i18n.
- Khi gọi `lunar-javascript`, luôn pipe Chinese output qua
  `translateGanZhiToVietnamese()` (`src/core/models/can-chi.ts`).
- localStorage keys: `am-lich-events`, `am-lich-memos`,
  `am-lich-hidden-system-events`. Đừng dùng key mới khi mở rộng schema —
  thêm field optional vào `ExportPayload` để backward-compat.
- System events có ID prefix `system:` — check qua `isSystemEventId()`.
  `state.editEvent()` và `state.deleteEvent()` đều throw khi nhận ID này.

## Pull requests

Chỉ tạo PR khi user yêu cầu rõ ràng. Mỗi PR: 1 logical change, focus vào
một tính năng/fix.
