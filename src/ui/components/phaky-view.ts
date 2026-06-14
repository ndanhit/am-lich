import type { Person, FamilyTree, PhaKyEntry } from "../../lib/index";
import { buildPhaKy, formatPartialDate } from "../../lib/index";

/**
 * Render a read-only "phả ký" — a read-friendly narrative of the family tree
 * grouped by generation, shown on screen (no printing).
 */
export function renderPhaKyView(
  container: HTMLElement,
  family: FamilyTree,
  people: Person[],
): void {
  const entries = buildPhaKy(people);

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open phaky-overlay";
  overlay.innerHTML = `
    <div class="modal-content phaky-modal">
      <div class="modal-header">
        <button class="close-btn" id="phaky-close" aria-label="Đóng">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="modal-title-text">Phả ký</div>
      </div>
      <div class="modal-body" id="phaky-body"></div>
    </div>
  `;
  container.appendChild(overlay);

  // Wire close handlers BEFORE rendering the body so the overlay can never get
  // stuck on screen even if document rendering throws.
  const close = (): void => {
    overlay.classList.remove("open");
    setTimeout(() => overlay.remove(), 300);
  };
  overlay.querySelector("#phaky-close")!.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  const body = overlay.querySelector("#phaky-body") as HTMLElement;
  body.appendChild(renderPhaKyDocument(family, entries));
}

/** Build the print-friendly phả ký document body (shared by viewer & owner). */
export function renderPhaKyDocument(
  family: FamilyTree,
  entries: PhaKyEntry[],
): HTMLElement {
  const doc = document.createElement("div");
  doc.className = "phaky-doc";

  const generations = entries.length
    ? entries[entries.length - 1].generation
    : 0;

  const header = document.createElement("div");
  header.className = "phaky-doc-header";
  header.innerHTML = `
    <h1 class="phaky-title">Phả ký dòng họ ${escapeHtml(family.name)}</h1>
    ${(family.description ?? "").trim() ? `<p class="phaky-desc">${escapeHtml(family.description)}</p>` : ""}
    <p class="phaky-meta">${entries.length} thành viên huyết thống · ${generations} đời</p>
  `;
  doc.appendChild(header);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "detail-empty";
    empty.textContent = "Chưa có thành viên nào trong gia phả.";
    doc.appendChild(empty);
    return doc;
  }

  let currentGen = 0;
  let genBlock: HTMLElement | null = null;
  for (const entry of entries) {
    if (entry.generation !== currentGen) {
      currentGen = entry.generation;
      genBlock = document.createElement("div");
      genBlock.className = "phaky-gen";
      const h = document.createElement("h2");
      h.className = "phaky-gen-title";
      h.textContent = `Đời thứ ${currentGen}`;
      genBlock.appendChild(h);
      doc.appendChild(genBlock);
    }
    genBlock!.appendChild(renderEntry(entry));
  }

  return doc;
}

function renderEntry(entry: PhaKyEntry): HTMLElement {
  const { person, parentName, spouseName } = entry;
  const el = document.createElement("div");
  el.className = "phaky-entry";

  const parts: string[] = [];
  const genderLabel =
    person.gender === "male"
      ? "Nam"
      : person.gender === "female"
        ? "Nữ"
        : "";
  if (genderLabel) parts.push(genderLabel);
  if ((person.aliasName ?? "").trim())
    parts.push(`tự ${escapeHtml(person.aliasName)}`);
  if (person.birthDate)
    parts.push(`sinh ${formatPartialDate(person.birthDate)}`);
  if (person.isDeceased) {
    parts.push(
      person.deathDate
        ? `mất ${formatPartialDate(person.deathDate)}`
        : "đã mất",
    );
  }
  if (parentName) parts.push(`con của ${escapeHtml(parentName)}`);
  if (spouseName) parts.push(`vợ/chồng: ${escapeHtml(spouseName)}`);
  if ((person.homeland ?? "").trim())
    parts.push(`quê ${escapeHtml(person.homeland)}`);
  if ((person.titles ?? "").trim()) parts.push(escapeHtml(person.titles));

  const notes = (person.notes ?? "").trim();
  el.innerHTML = `
    <span class="phaky-entry-name">${escapeHtml(person.name)}</span>
    ${parts.length ? `<span class="phaky-entry-detail"> — ${parts.join("; ")}</span>` : ""}
    ${notes ? `<div class="phaky-entry-notes">${escapeHtml(person.notes)}</div>` : ""}
  `;
  return el;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
