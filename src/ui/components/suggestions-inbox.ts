import { describeSuggestion } from "../../lib/index";
import {
  FamilyShareAdapter,
  type SuggestionRow,
} from "../../adapters/supabase/family-share-adapter";
import { SyncAdapter } from "../../adapters/supabase/sync-adapter";
import type { AppState } from "../state";

type ToastFn = (msg: string, type?: "success" | "error" | "warning") => void;

/** Owner inbox: review (approve/reject) pending edit suggestions. */
export function renderSuggestionsInbox(
  container: HTMLElement,
  state: AppState,
  showToast: ToastFn,
  onNeedLogin: (onSuccess: () => void) => void,
  onApplied: () => void,
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="inbox-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Đề xuất chỉnh sửa</div>
      </div>
      <div class="modal-body" id="inbox-body"><div class="detail-empty">Đang tải…</div></div>
    </div>`;
  container.appendChild(overlay);
  const body = overlay.querySelector("#inbox-body") as HTMLElement;
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector("#inbox-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const peopleByIdFor = (familyId: string): Map<string, any> =>
    new Map(state.getPeopleOfTree(familyId).map((p) => [p.id, p]));

  const renderRow = (s: SuggestionRow): HTMLElement => {
    const desc = describeSuggestion(s.payload, peopleByIdFor(s.familyId));
    const row = document.createElement("div");
    row.className = "detail-section";
    row.innerHTML = `
      <div class="kin-item" style="cursor:default">
        <span class="kin-name">${escapeHtml(desc)}<span class="kin-gender"> — bởi ${escapeHtml(s.suggesterName || "Ẩn danh")}</span></span>
      </div>
      <div class="detail-actions detail-actions-wrap" style="margin-top:var(--space-2)">
        <button class="btn btn-secondary" data-act="approve">Duyệt</button>
        <button class="btn btn-danger" data-act="reject">Từ chối</button>
      </div>`;

    row.querySelector('[data-act="approve"]')!.addEventListener("click", async () => {
      try {
        const family = state.getFamilies().find((f) => f.id === s.familyId);
        if (!family) throw new Error("Gia phả không có trên thiết bị này");
        state.applySuggestion(
          s.familyId,
          s.payload.kind,
          s.payload.targetId,
          s.payload.form as any,
        );
        await FamilyShareAdapter.publishFamily(
          family,
          state.getPeopleOfTree(s.familyId),
        );
        await FamilyShareAdapter.setSuggestionStatus(s.id, "approved");
        showToast("Đã duyệt & cập nhật", "success");
        onApplied();
        row.remove();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
    row.querySelector('[data-act="reject"]')!.addEventListener("click", async () => {
      try {
        await FamilyShareAdapter.setSuggestionStatus(s.id, "rejected");
        showToast("Đã từ chối", "success");
        row.remove();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
    return row;
  };

  const load = async (): Promise<void> => {
    const session = await SyncAdapter.getSession();
    if (!session) {
      body.innerHTML = `<p class="reorder-hint">Đăng nhập để xem các đề xuất gửi tới gia phả của bạn.</p>
        <button class="btn-cta" id="inbox-login">Đăng nhập</button>`;
      body.querySelector("#inbox-login")!.addEventListener("click", () => {
        close();
        onNeedLogin(() =>
          renderSuggestionsInbox(container, state, showToast, onNeedLogin, onApplied),
        );
      });
      return;
    }
    try {
      const items = await FamilyShareAdapter.listSuggestions();
      if (items.length === 0) {
        body.innerHTML = `<div class="detail-empty">Chưa có đề xuất nào.</div>`;
        return;
      }
      body.innerHTML = "";
      for (const s of items) body.appendChild(renderRow(s));
    } catch (e: any) {
      body.innerHTML = `<div class="detail-empty">Lỗi: ${escapeHtml(e.message)}</div>`;
    }
  };
  void load();
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
