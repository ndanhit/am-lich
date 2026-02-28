import { SyncAdapter } from "../../adapters/supabase/sync-adapter";

export function showLoginModal(
  container: HTMLElement,
  showToast: (message: string, type: "success" | "error" | "warning") => void,
  onSuccess: () => void
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:400px;margin:auto;margin-top:10vh;">
      <div class="modal-header">
        <button class="close-btn" id="login-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Đăng nhập</div>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:var(--space-4);color:var(--color-text-secondary);font-size:var(--font-size-sm)">
          Đăng nhập để đồng bộ dữ liệu lịch của bạn trên đám mây.
        </p>
        <input type="email" id="login-email" placeholder="Email" autocomplete="email" style="width:100%;margin-bottom:var(--space-3)">
        <input type="password" id="login-password" placeholder="Mật khẩu" autocomplete="current-password" style="width:100%;margin-bottom:var(--space-4)">
        
        <button class="btn btn-primary btn-block" id="login-submit" style="margin-bottom:var(--space-4)">Đăng nhập</button>
        
        <div style="text-align:center;font-size:var(--font-size-sm)">
          <span style="color:var(--color-text-secondary)">Chưa có tài khoản?</span>
          <button id="go-to-register" style="color:var(--color-primary);margin-left:var(--space-1);background:none;border:none;cursor:pointer;">Đăng ký ngay</button>
        </div>
        
        <div style="margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px solid var(--color-border);text-align:center;">
          <span style="color:var(--color-text-muted);font-weight:500;letter-spacing:0.05em;font-size:var(--font-size-sm);">Powered by Supabase</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const cleanup = () => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector("#login-close")!.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });

  const emailInput = overlay.querySelector("#login-email") as HTMLInputElement;
  const passInput = overlay.querySelector("#login-password") as HTMLInputElement;
  const submitBtn = overlay.querySelector("#login-submit") as HTMLButtonElement;

  submitBtn.addEventListener("click", async () => {
    try {
      if (!emailInput.value || !passInput.value) {
        showToast("Vui lòng nhập email và mật khẩu", "warning");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = "⏳ Đang xử lý...";
      await SyncAdapter.signInWithEmail(emailInput.value, passInput.value);
      showToast("Đăng nhập thành công", "success");
      cleanup();
      onSuccess();
    } catch (err: any) {
      showToast(`Lỗi đăng nhập: ${err.message}`, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Đăng nhập";
    }
  });

  overlay.querySelector("#go-to-register")!.addEventListener("click", () => {
    cleanup();
    setTimeout(() => showRegisterModal(container, showToast, onSuccess), 350);
  });
}

export function showRegisterModal(
  container: HTMLElement,
  showToast: (message: string, type: "success" | "error" | "warning") => void,
  onSuccess: () => void
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:400px;margin:auto;margin-top:10vh;">
      <div class="modal-header">
        <button class="close-btn" id="register-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Đăng ký</div>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:var(--space-4);color:var(--color-text-secondary);font-size:var(--font-size-sm)">
          Tạo tài khoản mới để sao lưu dữ liệu an toàn.
        </p>
        <input type="email" id="register-email" placeholder="Email" autocomplete="email" style="width:100%;margin-bottom:var(--space-3)">
        <input type="password" id="register-password" placeholder="Mật khẩu" autocomplete="new-password" style="width:100%;margin-bottom:var(--space-4)">
        
        <p id="register-msg" style="margin-bottom:var(--space-3);font-size:var(--font-size-sm);color:var(--color-success);display:none;"></p>
        
        <button class="btn btn-primary btn-block" id="register-submit" style="margin-bottom:var(--space-4)">Đăng ký</button>
        
        <div style="text-align:center;font-size:var(--font-size-sm)">
          <span style="color:var(--color-text-secondary)">Đã có tài khoản?</span>
          <button id="go-to-login" style="color:var(--color-primary);margin-left:var(--space-1);background:none;border:none;cursor:pointer;">Đăng nhập ngay</button>
        </div>
        
        <div style="margin-top:var(--space-2);padding-top:var(--space-2);border-top:1px solid var(--color-border);text-align:center;">
          <span style="color:var(--color-text-muted);font-weight:500;letter-spacing:0.05em;font-size:var(--font-size-sm);">Powered by Supabase</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const cleanup = () => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector("#register-close")!.addEventListener("click", cleanup);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cleanup();
  });

  const emailInput = overlay.querySelector("#register-email") as HTMLInputElement;
  const passInput = overlay.querySelector("#register-password") as HTMLInputElement;
  const submitBtn = overlay.querySelector("#register-submit") as HTMLButtonElement;
  const msgText = overlay.querySelector("#register-msg") as HTMLParagraphElement;

  submitBtn.addEventListener("click", async () => {
    try {
      if (!emailInput.value || !passInput.value) {
        showToast("Vui lòng nhập email và mật khẩu", "warning");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = "⏳ Đang xử lý...";
      msgText.style.display = "none";
      await SyncAdapter.signUpWithEmail(emailInput.value, passInput.value);
      msgText.innerHTML = "✅ Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác thực.";
      msgText.style.display = "block";
      showToast("Vui lòng xác thực email", "success");
      // Don't auto-close because they need to read the message to verify DB. User can navigate to login manually.
      submitBtn.innerHTML = "Đăng ký";
      submitBtn.disabled = false;
    } catch (err: any) {
      showToast(`Lỗi đăng ký: ${err.message}`, "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Đăng ký";
    }
  });

  overlay.querySelector("#go-to-login")!.addEventListener("click", () => {
    cleanup();
    setTimeout(() => showLoginModal(container, showToast, onSuccess), 350);
  });
}
