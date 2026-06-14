import type {
  Person,
  SharedSnapshot,
  ShareLinkParts,
  LunarEvent,
  QuickMemo,
  FamilyTree,
} from "../../lib/index";
import { computeBranchInsights, generationOf, buildPhaKy } from "../../lib/index";
import type { StorageAdapter } from "../../adapters/storage/local-storage-adapter";
import { FamilyShareAdapter } from "../../adapters/supabase/family-share-adapter";
import { AppState } from "../state";
import { renderFamilyTree } from "./family-tree";
import { renderPersonDetail, closeDetailPanel } from "./person-detail";
import { renderSearchPeople } from "./search-people";
import { renderGioList } from "./gio-list";
import { renderKinshipView } from "./kinship-view";
import { renderPersonForm } from "./person-form";
import { renderPhaKyView } from "./phaky-view";
import type { PersonFormContext, PersonFormData } from "../types";
import type { SuggestionKind } from "../../lib/index";

/** In-memory StorageAdapter seeded from a shared snapshot (read-only). */
class SnapshotAdapter implements StorageAdapter {
  constructor(private snap: SharedSnapshot) {}
  load(): LunarEvent[] {
    return [];
  }
  save(): void {}
  loadMemos(): QuickMemo[] {
    return [];
  }
  saveMemos(): void {}
  loadHiddenSystemEventIds(): string[] {
    return [];
  }
  saveHiddenSystemEventIds(): void {}
  loadPeople(): Person[] {
    return this.snap.people;
  }
  savePeople(): void {}
  loadFamilyTrees(): FamilyTree[] {
    return [this.snap.family];
  }
  saveFamilyTrees(): void {}
}

/**
 * Render a read-only view of a shared family snapshot, taking over `app`.
 * Reuses the full tree/search/giỗ/kinship stack via an in-memory state.
 */
export function renderSnapshotViewer(
  app: HTMLElement,
  snapshot: SharedSnapshot,
  onBack: () => void = () => {},
  token?: string,
): void {
  const state = new AppState(new SnapshotAdapter(snapshot));
  state.setCurrentTree(snapshot.family.id);
  const familyId = snapshot.family.id;

  const people = snapshot.people;
  const totalMembers = people.length;
  const deceasedCount = people.filter((p) => p.isDeceased).length;
  const phaky = buildPhaKy(people);
  const generations = phaky.length ? phaky[phaky.length - 1].generation : 0;
  const fam = snapshot.family;

  app.innerHTML = `
    <section class="family-hero family-hero--compact" id="shared-hero">
      <div class="family-hero-head">
        <h1 class="family-hero-title">Dòng họ ${escapeHtml(fam.name)}</h1>
        <span class="readonly-chip" title="Bạn đang xem bản chia sẻ — chỉ đọc">Chỉ đọc</span>
      </div>
      ${(fam.description ?? "").trim() ? `<p class="family-hero-desc">${escapeHtml(fam.description)}</p>` : ""}
      <div class="family-hero-stats">
        <div class="hero-stat"><span class="hero-stat-num">${generations}</span><span class="hero-stat-label">thế hệ</span></div>
        <div class="hero-stat"><span class="hero-stat-num">${totalMembers}</span><span class="hero-stat-label">thành viên</span></div>
        <div class="hero-stat"><span class="hero-stat-num">${deceasedCount}</span><span class="hero-stat-label">đã khuất</span></div>
        <button class="btn btn-secondary btn-sm" id="shared-phaky-btn">Xem phả ký</button>
      </div>
    </section>
    <main id="shared-view"></main>
    <footer class="share-footer">
      <a href="./" rel="noopener">Tạo gia phả của riêng bạn với Âm Lịch</a>
    </footer>
    <div id="shared-detail"></div>
    <div id="shared-modal"></div>
    <div id="shared-backdrop" class="backdrop"></div>
  `;
  const view = app.querySelector("#shared-view") as HTMLElement;
  const detail = app.querySelector("#shared-detail") as HTMLElement;
  const modal = app.querySelector("#shared-modal") as HTMLElement;
  const backdrop = app.querySelector("#shared-backdrop") as HTMLElement;

  app
    .querySelector("#shared-phaky-btn")!
    .addEventListener("click", () => renderPhaKyView(modal, fam, people));

  const doSuggest = (
    kind: SuggestionKind,
    targetId: string,
    form: PersonFormData,
  ): void => {
    let name = localStorage.getItem("am-lich-suggester-name") ?? "";
    if (!name) {
      name = (window.prompt("Tên của bạn (người đề xuất):") ?? "").trim();
      if (name) localStorage.setItem("am-lich-suggester-name", name);
    }
    FamilyShareAdapter.submitSuggestion(
      familyId,
      name || "Ẩn danh",
      kind,
      { kind, targetId, form },
      token,
    )
      .then(() => sharedToast("Đã gửi đề xuất, chờ chủ gia phả duyệt."))
      .catch((e) => sharedToast(e.message));
  };

  const openSuggestForm = (context: PersonFormContext, kind: SuggestionKind, targetId: string): void => {
    renderPersonForm(
      modal,
      context,
      (form) => doSuggest(kind, targetId, form),
      () => {},
      () => {},
    );
  };

  const openSuggest = (person: Person): void => {
    const opts: Array<{ label: string; run: () => void }> = [];
    opts.push({
      label: "Đề xuất thêm con",
      run: () =>
        openSuggestForm({ mode: "addChild", targetName: person.name }, "add_child", person.id),
    });
    if (
      !person.isMarriedIn &&
      (person.gender === "male" || person.gender === "female") &&
      person.spouseId == null
    ) {
      const lockedGender = person.gender === "male" ? "female" : "male";
      opts.push({
        label: person.gender === "male" ? "Đề xuất thêm vợ" : "Đề xuất thêm chồng",
        run: () =>
          openSuggestForm(
            { mode: "addSpouse", targetName: person.name, lockedGender },
            "add_spouse",
            person.id,
          ),
      });
    }
    if (!person.isMarriedIn && person.parentId == null) {
      opts.push({
        label: "Đề xuất thêm cha/mẹ",
        run: () =>
          openSuggestForm({ mode: "addParent", targetName: person.name }, "add_parent", person.id),
      });
    }
    opts.push({
      label: "Đề xuất sửa thông tin",
      run: () => openSuggestForm({ mode: "edit", person }, "edit", person.id),
    });
    renderActionSheet(modal, `Đề xuất cho ${person.name}`, opts);
  };

  const openDetail = (person: Person): void => {
    backdrop.classList.add("open");
    const spouse =
      person.spouseId != null
        ? (state.getPeople().find((p) => p.id === person.spouseId) ?? null)
        : null;
    const insights = computeBranchInsights(state.getPeople(), person.id);
    const generation = generationOf(state.getPeople(), person.id);
    const close = (): void => {
      closeDetailPanel(detail);
      backdrop.classList.remove("open");
    };
    renderPersonDetail(detail, person, spouse, insights, generation, true, {
      onEdit: () => {},
      onAddChild: () => {},
      onAddSpouse: () => {},
      onAddParent: () => {},
      onReorderChildren: () => {},
      onKinship: (p) => {
        close();
        renderKinshipView(modal, state, p, openDetail);
      },
      onCreateGio: () => {},
      onDelete: () => {},
      onClose: close,
      onSuggest: (p) => {
        close();
        openSuggest(p);
      },
    });
  };
  backdrop.addEventListener("click", () => {
    closeDetailPanel(detail);
    backdrop.classList.remove("open");
  });

  renderFamilyTree(
    view,
    state,
    snapshot.family,
    openDetail,
    () => {},
    onBack,
    () => renderSearchPeople(modal, state, openDetail),
    () => renderGioList(modal, state, openDetail),
    { readOnly: true },
  );

  maybeShowViewerHint(view);
}

/** One-time interaction hint for first-time viewers, dismissible. */
function maybeShowViewerHint(host: HTMLElement): void {
  if (localStorage.getItem("am-lich-share-hint-seen")) return;
  // Pinch gestures only exist on touch; show keyboard/mouse equivalents on
  // desktop so the copy actually matches what the user can do.
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const copy = touch
    ? "Chạm vào tên để xem chi tiết · Kéo để di chuyển · Chụm 2 ngón để phóng to"
    : "Bấm vào tên để xem chi tiết · Kéo để di chuyển · Ctrl + cuộn để phóng to";
  const hint = document.createElement("div");
  hint.className = "share-hint";
  hint.innerHTML = `
    <span>${copy}</span>
    <button class="share-hint-close" aria-label="Đóng gợi ý">✕</button>
  `;
  const dismiss = (): void => {
    localStorage.setItem("am-lich-share-hint-seen", "1");
    hint.remove();
  };
  hint.querySelector(".share-hint-close")!.addEventListener("click", dismiss);
  host.prepend(hint);
}

/** Render a read-only public view of a shared family from a #/share link. */
export function renderSharedFamilyView(
  app: HTMLElement,
  route: ShareLinkParts,
): void {
  app.innerHTML = `<div class="shared-loading">Đang tải gia phả được chia sẻ…</div>`;

  const showError = (msg: string): void => {
    app.innerHTML = `<div class="shared-error"><p>${escapeHtml(msg)}</p></div>`;
  };

  const askPassword = (): void => {
    app.innerHTML = `
      <div class="shared-password">
        <h2>Gia phả có mật khẩu</h2>
        <input type="password" id="shared-pass" placeholder="Nhập mật khẩu" autocomplete="off">
        <button class="btn-cta" id="shared-pass-go">Xem</button>
        <div class="form-error" id="shared-pass-err"></div>
      </div>`;
    const input = app.querySelector("#shared-pass") as HTMLInputElement;
    const err = app.querySelector("#shared-pass-err") as HTMLElement;
    const go = async (): Promise<void> => {
      err.textContent = "";
      const res = await FamilyShareAdapter.getSharedFamilyByToken(
        route.token,
        input.value,
      ).catch((e) => {
        err.textContent = e.message;
        return null;
      });
      if (!res) return;
      if ("passwordRequired" in res) {
        err.textContent = "Mật khẩu không đúng.";
        return;
      }
      renderSnapshotViewer(app, res.snapshot, () => {}, route.token);
    };
    app.querySelector("#shared-pass-go")!.addEventListener("click", go);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void go();
    });
    setTimeout(() => input.focus(), 100);
  };

  FamilyShareAdapter.getSharedFamilyByToken(route.token)
    .then((res) => {
      if (!res) {
        showError("Không tìm thấy gia phả (link sai hoặc đã gỡ chia sẻ).");
      } else if ("passwordRequired" in res) {
        askPassword();
      } else {
        renderSnapshotViewer(app, res.snapshot, () => {}, route.token);
      }
    })
    .catch((e) => showError(e.message));
}

/** Minimal toast for the standalone shared view (no app shell). */
function sharedToast(msg: string): void {
  const el = document.createElement("div");
  el.className = "toast show";
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.left = "50%";
  el.style.bottom = "24px";
  el.style.transform = "translateX(-50%)";
  el.style.zIndex = "3000";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/** A simple choice sheet rendered as a modal. */
function renderActionSheet(
  container: HTMLElement,
  title: string,
  options: Array<{ label: string; run: () => void }>,
): void {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="sheet-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">${escapeHtml(title)}</div>
      </div>
      <div class="modal-body">
        <div class="detail-actions detail-actions-wrap" id="sheet-opts"></div>
      </div>
    </div>`;
  container.appendChild(overlay);
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };
  const list = overlay.querySelector("#sheet-opts") as HTMLElement;
  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      close();
      opt.run();
    });
    list.appendChild(btn);
  }
  overlay.querySelector("#sheet-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
