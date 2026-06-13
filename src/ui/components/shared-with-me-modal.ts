import type { SharedSnapshot } from "../../lib/index";
import { FamilyShareAdapter } from "../../adapters/supabase/family-share-adapter";
import { SyncAdapter } from "../../adapters/supabase/sync-adapter";

type ToastFn = (msg: string, type?: "success" | "error" | "warning") => void;

/** Modal listing family trees shared TO the current user; open read-only. */
export function renderSharedWithMeModal(
  container: HTMLElement,
  showToast: ToastFn,
  onNeedLogin: (onSuccess: () => void) => void,
  onOpen: (snapshot: SharedSnapshot) => void,
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="swm-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Được chia sẻ với tôi</div>
      </div>
      <div class="modal-body" id="swm-body"><div class="detail-empty">Đang tải…</div></div>
    </div>
  `;
  container.appendChild(overlay);
  const body = overlay.querySelector("#swm-body") as HTMLElement;
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector("#swm-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const load = async (): Promise<void> => {
    const session = await SyncAdapter.getSession();
    if (!session) {
      body.innerHTML = `<p class="reorder-hint">Đăng nhập để xem các gia phả được chia sẻ với bạn.</p>
        <button class="btn-cta" id="swm-login">Đăng nhập</button>`;
      body.querySelector("#swm-login")!.addEventListener("click", () => {
        close();
        onNeedLogin(() =>
          renderSharedWithMeModal(container, showToast, onNeedLogin, onOpen),
        );
      });
      return;
    }
    try {
      const items = await FamilyShareAdapter.listSharedWithMe();
      if (items.length === 0) {
        body.innerHTML = `<div class="detail-empty">Chưa có gia phả nào được chia sẻ với bạn.</div>`;
        return;
      }
      body.innerHTML = `<div class="kin-list" id="swm-list"></div>`;
      const list = body.querySelector("#swm-list") as HTMLElement;
      for (const it of items) {
        const row = document.createElement("button");
        row.className = "kin-item";
        row.innerHTML = `<span class="kin-name">${escapeHtml(it.name || "Gia phả")}</span>
          <span class="kin-term">Xem</span>`;
        row.addEventListener("click", async () => {
          try {
            await FamilyShareAdapter.acceptShare(it.familyId);
            const snap = await FamilyShareAdapter.getSharedFamilyAuthed(it.familyId);
            if (!snap) {
              showToast("Không mở được (có thể đã bị gỡ)", "warning");
              return;
            }
            close();
            onOpen(snap);
          } catch (e: any) {
            showToast(e.message, "error");
          }
        });
        list.appendChild(row);
      }
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
