import type { AppState } from "../state";
import { SyncAdapter } from "../../adapters/supabase/sync-adapter";

import { showLoginModal } from "./auth-modals";

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const LAST_BACKUP_KEY = "am-lich-last-backup";

function formatBackupTime(ts: string): string {
  const d = new Date(parseInt(ts));
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

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

  // Auth section — rendered empty initially to avoid loading flicker
  const authSection = document.createElement("div");
  authSection.className = "auth-section";
  section.appendChild(authSection);

  // --- System events section ---
  const systemSection = document.createElement("div");
  systemSection.className = "system-events-section";
  renderSystemEventsSection(systemSection, state);
  section.appendChild(systemSection);

  const controls = document.createElement("div");
  controls.innerHTML = `
    <h2 style="font-size:var(--font-size-md);font-weight:600;margin-bottom:var(--space-1)">Đồng bộ đám mây</h2>
    <div id="last-backup-info" style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:var(--space-2);min-height:1.2em"></div>
    <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4)">
      <button class="btn btn-primary" style="flex:1" id="cloud-backup-btn" aria-label="Sao lưu lên đám mây">
        <img src="assets/images/ico-export.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Sao lưu
      </button>
      <button class="btn btn-primary" style="flex:1" id="cloud-restore-btn" aria-label="Phục hồi từ đám mây">
        <img src="assets/images/ico-import.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Phục hồi
      </button>
    </div>

    <h2 style="font-size:var(--font-size-md);font-weight:600;margin-bottom:var(--space-2)">Quản lý dữ liệu file</h2>
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
  section.appendChild(controls);

  container.appendChild(section);

  // --- Last backup time display ---
  const updateLastBackupDisplay = () => {
    const el = section.querySelector("#last-backup-info") as HTMLElement;
    if (!el) return;
    const ts = localStorage.getItem(LAST_BACKUP_KEY);
    el.textContent = ts ? `Sao lưu cuối: ${formatBackupTime(ts)}` : "";
  };
  updateLastBackupDisplay();

  // --- Auth section update ---
  const updateAuthSection = () => {
    SyncAdapter.getSession().then(user => {
      if (!user) return;
      authSection.innerHTML = `
        <div class="auth-box" style="padding:var(--space-3);background:var(--color-surface);border-radius:var(--radius-md);margin-bottom:var(--space-3);border:1px solid var(--color-border)">
          <p style="margin:0 0 var(--space-1) 0;font-size:var(--font-size-sm);color:var(--color-text-muted)">Đã đăng nhập với</p>
          <p style="margin:0 0 var(--space-3) 0;font-weight:600;word-break:break-all;color:var(--color-primary)">${user.email}</p>
          <button class="btn btn-primary btn-block" id="logout-btn">Đăng xuất</button>
        </div>
      `;
      authSection.querySelector("#logout-btn")!.addEventListener("click", async () => {
        await SyncAdapter.signOut();
        showToast("Đã đăng xuất", "success");
        renderImportExport(container, state, showToast, onConfirm, onSuccess, modalContainer);
      });
    });
  };
  updateAuthSection();

  // --- Named action functions (reused after login) ---
  const backupBtn = section.querySelector("#cloud-backup-btn") as HTMLButtonElement;
  const restoreBtn = section.querySelector("#cloud-restore-btn") as HTMLButtonElement;

  const doBackup = async () => {
    try {
      backupBtn.disabled = true;
      backupBtn.innerHTML = "⏳ Đang sao lưu...";
      await SyncAdapter.backupEvents(state.getEvents());
      localStorage.setItem(LAST_BACKUP_KEY, Date.now().toString());
      updateLastBackupDisplay();
      showToast("Sao lưu đám mây thành công", "success");
    } catch (err: any) {
      showToast(`Lỗi sao lưu: ${err.message}`, "error");
    } finally {
      backupBtn.disabled = false;
      backupBtn.innerHTML = '<img src="assets/images/ico-export.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Sao lưu';
    }
  };

  const doRestore = async () => {
    const confirmed = await onConfirm(
      "Phục hồi từ đám mây",
      "Dữ liệu hiện tại sẽ bị thay thế bằng bản sao lưu trên đám mây. Hành động này không thể hoàn tác."
    );
    if (!confirmed) return;

    try {
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = "⏳ Đang phục hồi...";
      const events = await SyncAdapter.restoreEvents();

      if (!events) {
        showToast("Không tìm thấy bản sao lưu nào trên đám mây", "warning");
        return;
      }

      const payload = { version: 1, exportedAt: Date.now(), events };
      const result = await state.importFromJson(JSON.stringify(payload), true);
      showToast(`Phục hồi thành công: ${result.added} sự kiện`, "success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(`Lỗi phục hồi: ${err.message}`, "error");
    } finally {
      restoreBtn.disabled = false;
      restoreBtn.innerHTML = '<img src="assets/images/ico-import.svg" alt="" style="width:24px;height:24px;opacity:0.8"> Phục hồi';
    }
  };

  // Auto-execute pending action after login
  const requireLoginThen = (action: () => Promise<void>) => {
    if (modalContainer) {
      showLoginModal(modalContainer, showToast, async () => {
        updateAuthSection();
        await action();
      });
    }
  };

  // --- Button handlers ---
  backupBtn.addEventListener("click", async () => {
    const user = await SyncAdapter.getUser();
    if (!user) { requireLoginThen(doBackup); return; }
    await doBackup();
  });

  restoreBtn.addEventListener("click", async () => {
    const user = await SyncAdapter.getUser();
    if (!user) { requireLoginThen(doRestore); return; }
    await doRestore();
  });

  // Export handler — no confirmation needed (read-only)
  section.querySelector("#export-btn")!.addEventListener("click", () => {
    try {
      const json = state.exportPayload();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `am-lich-events-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Xuất sự kiện thành công", "success");
    } catch (err: any) {
      showToast(`Lỗi khi xuất: ${err.message}`, "error");
    }
  });

  // Import handler — merge mode (replaceAll=false), no confirmation needed
  const fileInput = section.querySelector("#import-file") as HTMLInputElement;
  section.querySelector("#import-trigger")!.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await state.importFromJson(text, false);
      showToast(`Nhập thành công: ${result.added} sự kiện mới`, "success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(`Lỗi khi nhập: ${err.message}`, "error");
    }

    fileInput.value = "";
  });
}

/** Render the "Vietnamese holidays" collapsible section inside settings */
function renderSystemEventsSection(
  container: HTMLElement,
  state: AppState,
): void {
  let expanded = false;

  function render(): void {
    const items = state.getSystemEventsWithVisibility();
    const visibleCount = items.filter((it) => !it.hidden).length;
    const total = items.length;
    const allHidden = visibleCount === 0;

    container.innerHTML = `
      <div class="settings-section-collapsible" data-expanded="${expanded}">
        <button class="settings-section-header" aria-expanded="${expanded}">
          <div class="settings-section-meta">
            <div class="settings-section-title">Lễ truyền thống Việt Nam</div>
            <div class="settings-section-sub">${visibleCount}/${total} đang bật</div>
          </div>
          <span class="settings-section-chevron" aria-hidden="true">›</span>
        </button>
        <div class="settings-section-body" ${expanded ? "" : "hidden"}>
          <p style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:var(--space-2)">
            Lễ được hiển thị trên lịch và danh sách sắp tới. Tắt nếu bạn không muốn xem.
          </p>
          <div class="system-events-actions">
            <button class="btn btn-secondary" id="sys-enable-all" ${!allHidden ? "disabled" : ""}>Bật tất cả</button>
            <button class="btn btn-secondary" id="sys-disable-all" ${allHidden ? "disabled" : ""}>Tắt tất cả</button>
          </div>
          <div class="system-events-list">
            ${items
              .map(
                (it) => `
              <label class="system-event-toggle">
                <div class="system-event-info">
                  <div class="system-event-name">${escapeHtml(it.event.name)}</div>
                  <div class="system-event-date">${it.event.lunarDate.day}/${it.event.lunarDate.month} âm</div>
                </div>
                <input type="checkbox" data-id="${it.event.id}" ${!it.hidden ? "checked" : ""}>
              </label>
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid var(--color-border-subtle);margin:var(--space-4) 0">
    `;

    container
      .querySelector(".settings-section-header")!
      .addEventListener("click", () => {
        expanded = !expanded;
        render();
      });

    container
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((cb) => {
        cb.addEventListener("change", () => {
          const id = cb.dataset.id!;
          state.setSystemEventHidden(id, !cb.checked);
          render();
        });
      });

    container.querySelector("#sys-enable-all")?.addEventListener("click", () => {
      state.setAllSystemEventsHidden(false);
      render();
    });

    container.querySelector("#sys-disable-all")?.addEventListener("click", () => {
      state.setAllSystemEventsHidden(true);
      render();
    });
  }

  render();
}
