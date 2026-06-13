import type { FamilyTree, Person } from "../../lib/index";
import { buildShareHash } from "../../lib/index";
import { FamilyShareAdapter } from "../../adapters/supabase/family-share-adapter";
import { SyncAdapter } from "../../adapters/supabase/sync-adapter";

type ToastFn = (msg: string, type?: "success" | "error" | "warning") => void;

/**
 * Owner-facing "Chia sẻ" modal: publish a family snapshot to the cloud and copy
 * a secret share link. Requires the user to be signed in.
 */
export function renderShareFamilyModal(
  container: HTMLElement,
  family: FamilyTree,
  people: Person[],
  showToast: ToastFn,
  onNeedLogin: (onSuccess: () => void) => void,
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="share-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Chia sẻ gia phả</div>
      </div>
      <div class="modal-body" id="share-body"><div class="detail-empty">Đang tải…</div></div>
    </div>
  `;
  container.appendChild(overlay);
  const body = overlay.querySelector("#share-body") as HTMLElement;
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector("#share-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const fullLink = (token: string): string =>
    `${location.origin}${location.pathname}${buildShareHash(family.id, token)}`;

  const renderShared = (token: string, hasPassword: boolean): void => {
    const link = fullLink(token);
    body.innerHTML = `
      <p class="reorder-hint">Bất cứ ai có link dưới đây đều xem được (chỉ đọc). Chia sẻ thận trọng.</p>
      <div class="share-link-row">
        <input type="text" id="share-link" readonly value="${escapeAttr(link)}">
        <button class="btn btn-primary" id="share-copy">Copy</button>
      </div>
      <div class="form-group" style="margin-top:var(--space-4)">
        <label for="share-pass">Mật khẩu link (tuỳ chọn)</label>
        <div class="share-link-row">
          <input type="text" id="share-pass" placeholder="${hasPassword ? "Đang đặt mật khẩu — nhập mới để đổi" : "Để trống = không mật khẩu"}">
          <button class="btn btn-secondary" id="share-pass-save">Lưu</button>
        </div>
      </div>
      <div class="detail-actions detail-actions-wrap" style="margin-top:var(--space-4)">
        <button class="btn btn-secondary" id="share-update">Cập nhật bản mới nhất</button>
        <button class="btn btn-danger" id="share-stop">Gỡ chia sẻ</button>
      </div>
    `;
    body.querySelector("#share-pass-save")!.addEventListener("click", async () => {
      const val = (body.querySelector("#share-pass") as HTMLInputElement).value;
      try {
        await FamilyShareAdapter.setFamilyPassword(family.id, val || null);
        showToast(val ? "Đã đặt mật khẩu" : "Đã bỏ mật khẩu", "success");
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
    body.querySelector("#share-copy")!.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        showToast("Đã copy link", "success");
      } catch {
        (body.querySelector("#share-link") as HTMLInputElement).select();
        showToast("Hãy copy thủ công", "warning");
      }
    });
    body.querySelector("#share-update")!.addEventListener("click", async () => {
      try {
        await FamilyShareAdapter.publishFamily(family, people);
        showToast("Đã cập nhật bản chia sẻ", "success");
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
    body.querySelector("#share-stop")!.addEventListener("click", async () => {
      try {
        await FamilyShareAdapter.unpublishFamily(family.id);
        showToast("Đã gỡ chia sẻ", "success");
        renderNotShared();
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  const renderNotShared = (): void => {
    body.innerHTML = `
      <p class="reorder-hint">Đăng tải gia phả "${escapeHtml(family.name)}" lên đám mây để tạo link chia sẻ (chỉ đọc).</p>
      <button class="btn-cta" id="share-publish">Đăng tải & tạo link</button>
    `;
    body.querySelector("#share-publish")!.addEventListener("click", async () => {
      try {
        const token = await FamilyShareAdapter.publishFamily(family, people);
        showToast("Đã đăng tải", "success");
        renderShared(token, false);
      } catch (e: any) {
        showToast(e.message, "error");
      }
    });
  };

  const load = async (): Promise<void> => {
    const session = await SyncAdapter.getSession();
    if (!session) {
      body.innerHTML = `
        <p class="reorder-hint">Bạn cần đăng nhập để chia sẻ gia phả.</p>
        <button class="btn-cta" id="share-login">Đăng nhập</button>
      `;
      body.querySelector("#share-login")!.addEventListener("click", () => {
        close();
        onNeedLogin(() =>
          renderShareFamilyModal(container, family, people, showToast, onNeedLogin),
        );
      });
      return;
    }
    try {
      const info = await FamilyShareAdapter.getMyPublishedFamily(family.id);
      if (info) renderShared(info.shareToken, info.hasPassword);
      else renderNotShared();
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
function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
