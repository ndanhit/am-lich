import type { AppState } from "../state";
import { SyncAdapter } from "../../adapters/supabase/sync-adapter";

import { showLoginModal } from "./auth-modals";

/** Render import/export controls */
export function renderImportExport(
  container: HTMLElement,
  state: AppState,
  showToast: (message: string, type: "success" | "error" | "warning") => void,
  onConfirm: (title: string, message: string) => Promise<boolean>,
  onSuccess?: () => void,
  modalContainer?: HTMLElement
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "import-export-section";

  const authSection = document.createElement("div");
  authSection.className = "auth-section";
  authSection.innerHTML = `<p style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:var(--space-3)">⏳ Đang kiểm tra đăng nhập...</p>`;
  section.appendChild(authSection);

  SyncAdapter.getUser().then(user => {
    if (user) {
      authSection.innerHTML = `
        <div class="auth-box" style="padding:var(--space-3);background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:var(--space-3);border:1px solid var(--color-border)">
          <p style="margin:0 0 var(--space-1) 0;font-size:var(--font-size-sm);color:var(--color-text-muted)">Đã đồng bộ đám mây với tài khoản</p>
          <p style="margin:0 0 var(--space-3) 0;font-weight:600;word-break:break-all;color:var(--color-primary)">${user.email}</p>
          <button class="btn btn-primary btn-block" id="logout-btn">Đăng xuất</button>
        </div>
      `;
      authSection.querySelector("#logout-btn")!.addEventListener("click", async () => {
        await SyncAdapter.signOut();
        showToast("Đã đăng xuất", "success");
        // Re-render essentially
        renderImportExport(container, state, showToast, onConfirm, onSuccess, modalContainer);
      });
    } else {
      authSection.innerHTML = ''; // Hide when not logged in
    }
  });

  const controlsWrapper = document.createElement("div");
  controlsWrapper.innerHTML = `
    <h2 style="font-size:var(--font-size-md);font-weight:600;margin-bottom:var(--space-2)">Đồng bộ đám mây</h2>
    <div style="display:flex;gap:var(--space-2)">
      <button class="btn btn-primary" style="flex:1" id="cloud-backup-btn" aria-label="Sao lưu lên đám mây">
        <img src="assets/images/ico-export.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Sao lưu
      </button>
      <button class="btn btn-primary" style="flex:1" id="cloud-restore-btn" aria-label="Phục hồi từ đám mây">
        <img src="assets/images/ico-import.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Phục hồi
      </button>
    </div>

    <h2 style="font-size:var(--font-size-md);font-weight:600;margin-top:var(--space-4);margin-bottom:var(--space-2)">Quản lý dữ liệu file</h2>
    <div style="display:flex;gap:var(--space-2)">
      <button class="btn btn-primary" style="flex:1" id="export-btn" aria-label="Xuất sự kiện ra file">
        <img src="assets/images/ico-export.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Xuất JSON
      </button>
      <div class="file-input-wrapper" style="flex:1">
        <button class="btn btn-primary btn-block" id="import-trigger" aria-label="Nhập sự kiện từ file">
          <img src="assets/images/ico-import.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Nhập từ JSON
        </button>
        <input type="file" id="import-file" accept=".json,application/json" aria-label="Chọn tệp để nhập">
      </div>
    </div>
  `;

  section.appendChild(controlsWrapper);
  container.appendChild(section);

  // Export handler
  section.querySelector("#export-btn")!.addEventListener("click", () => {
    try {
      const json = state.exportPayload();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `am - lich - events - ${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Xuất sự kiện thành công", "success");
    } catch (err: any) {
      showToast(`Lỗi khi xuất: ${err.message} `, "error");
    }
  });

  // Backup handler
  const backupBtn = section.querySelector("#cloud-backup-btn") as HTMLButtonElement;
  backupBtn.addEventListener("click", async () => {
    const user = await SyncAdapter.getUser();
    if (!user) {
      if (modalContainer) {
        showLoginModal(modalContainer, showToast, () => {
          renderImportExport(container, state, showToast, onConfirm, onSuccess, modalContainer);
        });
      }
      return;
    }

    try {
      backupBtn.disabled = true;
      backupBtn.innerHTML = '⏳ Đang sao lưu...';
      const events = state.getEvents();
      await SyncAdapter.backupEvents(events);
      showToast("Sao lưu đám mây thành công", "success");
    } catch (err: any) {
      showToast(`Lỗi sao lưu: ${err.message} `, "error");
    } finally {
      backupBtn.disabled = false;
      backupBtn.innerHTML = '<img src="assets/images/ico-export.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Sao lưu';
    }
  });

  // Restore handler
  const restoreBtn = section.querySelector("#cloud-restore-btn") as HTMLButtonElement;
  restoreBtn.addEventListener("click", async () => {
    const user = await SyncAdapter.getUser();
    if (!user) {
      if (modalContainer) {
        showLoginModal(modalContainer, showToast, () => {
          renderImportExport(container, state, showToast, onConfirm, onSuccess, modalContainer);
        });
      }
      return;
    }

    try {
      const confirmed = await onConfirm(
        "Phục hồi từ đám mây",
        "Hành động này sẽ xóa TẤT CẢ sự kiện hiện tại trên máy và thay thế bằng dữ liệu từ đám mây. Bạn có chắc chắn muốn tiếp tục?"
      );

      if (!confirmed) return;

      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '⏳ Đang phục hồi...';
      const events = await SyncAdapter.restoreEvents();

      if (!events) {
        showToast("Không tìm thấy bản sao lưu nào trên đám mây", "warning");
        return;
      }

      const result = await state.importFromJson(JSON.stringify(events), true);
      showToast(`Phục hồi thành công: ${result.added} sự kiện`, "success");
      // Don't close immediately so user sees success. Wait for explicit close or let onSuccess handle it if needed.
    } catch (err: any) {
      showToast(`Lỗi phục hồi: ${err.message}`, "error");
    } finally {
      restoreBtn.disabled = false;
      restoreBtn.innerHTML = '<img src="assets/images/ico-import.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Phục hồi';
    }
  });

  // Import handler
  const fileInput = section.querySelector("#import-file") as HTMLInputElement;
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const confirmed = await onConfirm(
        "Nhập sự kiện",
        "Hành động này sẽ xóa tất cả sự kiện hiện tại và thay thế bằng dữ liệu mới. Bạn có chắc chắn muốn tiếp tục?",
      );

      if (!confirmed) {
        fileInput.value = "";
        return;
      }

      const text = await file.text();
      const result = await state.importFromJson(text, true);
      showToast(`Nhập thành công: ${result.added} sự kiện mới`, "success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(`Lỗi khi nhập: ${err.message} `, "error");
    }

    // Reset file input so the same file can be re-selected
    fileInput.value = "";
  });
}
