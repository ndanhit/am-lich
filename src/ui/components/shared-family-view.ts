import type {
  Person,
  SharedSnapshot,
  ShareLinkParts,
  LunarEvent,
  QuickMemo,
  FamilyTree,
} from "../../lib/index";
import { computeBranchInsights, generationOf } from "../../lib/index";
import type { StorageAdapter } from "../../adapters/storage/local-storage-adapter";
import { FamilyShareAdapter } from "../../adapters/supabase/family-share-adapter";
import { AppState } from "../state";
import { renderFamilyTree } from "./family-tree";
import { renderPersonDetail, closeDetailPanel } from "./person-detail";
import { renderSearchPeople } from "./search-people";
import { renderGioList } from "./gio-list";
import { renderKinshipView } from "./kinship-view";

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
): void {
  const state = new AppState(new SnapshotAdapter(snapshot));
  state.setCurrentTree(snapshot.family.id);

  app.innerHTML = `
    <div class="shared-banner">Đang xem gia phả được chia sẻ — chỉ đọc</div>
    <main id="shared-view"></main>
    <div id="shared-detail"></div>
    <div id="shared-modal"></div>
    <div id="shared-backdrop" class="backdrop"></div>
  `;
  const view = app.querySelector("#shared-view") as HTMLElement;
  const detail = app.querySelector("#shared-detail") as HTMLElement;
  const modal = app.querySelector("#shared-modal") as HTMLElement;
  const backdrop = app.querySelector("#shared-backdrop") as HTMLElement;

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
  );
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
      renderSnapshotViewer(app, res.snapshot);
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
        renderSnapshotViewer(app, res.snapshot);
      }
    })
    .catch((e) => showError(e.message));
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
