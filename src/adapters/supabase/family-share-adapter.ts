import type { FamilyTree, Person, SharedSnapshot } from "../../lib/index";
import { buildFamilySnapshot } from "../../lib/index";
import { supabase } from "./client";

const TABLE = "lich_shared_families";

export type PublishedInfo = {
  shareToken: string;
  hasPassword: boolean;
  updatedAt: string;
};

function newToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

/**
 * Cloud sharing of a single family tree (read-only snapshots).
 * Security is enforced by RLS + security-definer RPC (see supabase-shared-schema.sql).
 */
export class FamilyShareAdapter {
  /** Publish (or update) a family snapshot; returns the secret share token. */
  static async publishFamily(
    family: FamilyTree,
    people: Person[],
  ): Promise<string> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) throw new Error("Chưa đăng nhập");

    // Reuse an existing token so previously-shared links keep working.
    const existing = await this.getMyPublishedFamily(family.id);
    const shareToken = existing?.shareToken ?? newToken();

    const { error } = await supabase.from(TABLE).upsert(
      {
        family_id: family.id,
        owner_id: auth.user.id,
        name: family.name,
        payload: buildFamilySnapshot(family, people),
        share_token: shareToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "family_id" },
    );
    if (error) throw new Error(`Đăng tải thất bại: ${error.message}`);
    return shareToken;
  }

  static async unpublishFamily(familyId: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("family_id", familyId);
    if (error) throw new Error(`Gỡ chia sẻ thất bại: ${error.message}`);
  }

  /** Set or clear (empty/null) the link password for a published family. */
  static async setFamilyPassword(
    familyId: string,
    password: string | null,
  ): Promise<void> {
    const { error } = await supabase.rpc("set_shared_family_password", {
      p_family_id: familyId,
      p_pass: password,
    });
    if (error) throw new Error(`Đặt mật khẩu thất bại: ${error.message}`);
  }

  /**
   * Fetch a shared snapshot via the secret link token (anonymous-friendly RPC).
   * Returns { passwordRequired } if a password is needed, or null if not found.
   */
  static async getSharedFamilyByToken(
    token: string,
    password?: string,
  ): Promise<
    { snapshot: SharedSnapshot } | { passwordRequired: true } | null
  > {
    const { data, error } = await supabase.rpc("get_shared_family", {
      p_token: token,
      p_pass: password ?? null,
    });
    if (error) throw new Error(`Không mở được link: ${error.message}`);
    if (!data) return null;
    if ((data as any).error === "password_required") {
      return { passwordRequired: true };
    }
    return { snapshot: data as SharedSnapshot };
  }

  /** Returns publish info for a family owned by the current user, or null. */
  static async getMyPublishedFamily(
    familyId: string,
  ): Promise<PublishedInfo | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("share_token, password_hash, updated_at")
      .eq("family_id", familyId)
      .maybeSingle();
    if (error) throw new Error(`Không đọc được trạng thái: ${error.message}`);
    if (!data) return null;
    return {
      shareToken: data.share_token as string,
      hasPassword: data.password_hash != null,
      updatedAt: data.updated_at as string,
    };
  }
}
