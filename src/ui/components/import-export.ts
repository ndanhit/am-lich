import type { AppState } from "../state";

/** Render import/export controls */
export function renderImportExport(
  container: HTMLElement,
  state: AppState,
  showToast: (message: string, type: "success" | "error" | "warning") => void,
  onConfirm: (title: string, message: string) => Promise<boolean>,
  onSuccess?: () => void,
): void {
  container.innerHTML = "";

  const section = document.createElement("div");
  section.className = "import-export-section";

  section.innerHTML = `
        <h2 style="font-size:var(--font-size-md);font-weight:600;margin-bottom:var(--space-2)">Quản lý dữ liệu</h2>
        <button class="btn btn-secondary btn-block" id="export-btn" aria-label="Xuất sự kiện">
            📤 Xuất sự kiện
        </button>
        <div class="file-input-wrapper">
            <button class="btn btn-secondary btn-block" id="import-trigger" aria-label="Nhập sự kiện">
                📥 Nhập sự kiện
            </button>
            <input type="file" id="import-file" accept=".json,application/json" aria-label="Chọn tệp để nhập">
        </div>
    `;

  container.appendChild(section);

  // Export handler
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
      showToast(`Lỗi khi nhập: ${err.message}`, "error");
    }

    // Reset file input so the same file can be re-selected
    fileInput.value = "";
  });
}
