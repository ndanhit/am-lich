import type { Person, FamilyTreeNode, GenerationFilter } from "../../lib/index";
import { searchPeople, availableGenerations } from "../../lib/index";
import { GENDER_LABELS } from "../types";
import type { AppState } from "../state";

/** Search & filter members of the current family tree. */
export function renderSearchPeople(
  container: HTMLElement,
  state: AppState,
  onSelect: (person: Person) => void,
): void {
  const depthById = buildDepthMap(state.getFamilyTree());
  const gens = availableGenerations(state.getPeople());
  const genOptions = [
    `<option value="all">Tất cả các đời</option>`,
    ...gens.map((g) => `<option value="${g}">Đời ${g}</option>`),
  ].join("");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-btn" id="search-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Tìm thành viên</div>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <input type="text" id="search-input" placeholder="Nhập tên..." autocomplete="off">
        </div>
        <div class="form-group">
          <select id="search-gen" class="date-select" aria-label="Lọc theo đời">
            ${genOptions}
          </select>
        </div>
        <div class="search-results" id="search-results"></div>
      </div>
    </div>
  `;
  container.appendChild(overlay);

  const input = overlay.querySelector("#search-input") as HTMLInputElement;
  const results = overlay.querySelector("#search-results") as HTMLElement;
  const genSelect = overlay.querySelector("#search-gen") as HTMLSelectElement;
  let generation: GenerationFilter = "all";

  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };

  const render = (): void => {
    const matches = searchPeople(state.getPeople(), {
      query: input.value,
      generation,
    });
    results.innerHTML = "";
    if (matches.length === 0) {
      results.innerHTML = `<div class="detail-empty">Không tìm thấy thành viên.</div>`;
      return;
    }
    for (const p of matches) {
      const row = document.createElement("button");
      row.className = "search-result";
      const depth = depthById.get(p.id);
      const meta: string[] = [GENDER_LABELS[p.gender]];
      if (depth != null) meta.push(`đời ${depth + 1}`);
      if (p.isDeceased || p.deathLunar != null) meta.push("đã mất");
      row.innerHTML = `
        <span class="search-result-name">${escapeHtml(p.name)}</span>
        <span class="search-result-meta">${meta.join(" · ")}</span>
      `;
      row.addEventListener("click", () => {
        close();
        onSelect(p);
      });
      results.appendChild(row);
    }
  };

  input.addEventListener("input", render);
  genSelect.addEventListener("change", () => {
    generation = genSelect.value === "all" ? "all" : Number(genSelect.value);
    render();
  });

  overlay.querySelector("#search-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  render();
  setTimeout(() => input.focus(), 100);
}

function buildDepthMap(roots: FamilyTreeNode[]): Map<string, number> {
  const map = new Map<string, number>();
  const visit = (node: FamilyTreeNode): void => {
    map.set(node.person.id, node.depth);
    node.children.forEach(visit);
  };
  roots.forEach(visit);
  return map;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
