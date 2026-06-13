import type { Person, Gender, PartialDate } from "../../core/models/types";

export type SuggestionKind =
  | "add_child"
  | "add_spouse"
  | "add_parent"
  | "edit";

/** Personal info carried by a suggestion (structurally same as the UI form). */
export type SuggestionForm = {
  name: string;
  gender: Gender;
  birthDate: PartialDate | null;
  isDeceased: boolean;
  deathDate: PartialDate | null;
  aliasName: string;
  altNames: string;
  homeland: string;
  burialPlace: string;
  titles: string;
  notes: string;
};

export type SuggestionPayload = {
  kind: SuggestionKind;
  /** Person the suggestion is anchored to (parent for adds, target for edit). */
  targetId: string;
  form: SuggestionForm;
};

const KIND_LABEL: Record<SuggestionKind, string> = {
  add_child: "Thêm con cho",
  add_spouse: "Thêm vợ/chồng cho",
  add_parent: "Thêm cha/mẹ cho",
  edit: "Sửa thông tin",
};

/** Human-readable description of a suggestion (Vietnamese). */
export function describeSuggestion(
  payload: SuggestionPayload,
  peopleById: Map<string, Person>,
): string {
  const target = peopleById.get(payload.targetId);
  const targetName = target ? target.name : "(không rõ)";
  if (payload.kind === "edit") {
    return `Sửa thông tin "${targetName}" → "${payload.form.name}"`;
  }
  return `${KIND_LABEL[payload.kind]} "${targetName}": "${payload.form.name}"`;
}
