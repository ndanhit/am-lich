export type ShareLinkParts = {
  familyId: string;
  token: string;
};

/** Hash fragment for a shared family link, e.g. "#/share/<id>?t=<token>". */
export function buildShareHash(familyId: string, token: string): string {
  return `#/share/${encodeURIComponent(familyId)}?t=${encodeURIComponent(token)}`;
}

/** Parse a share hash fragment; returns null when it is not a share route. */
export function parseShareHash(hash: string): ShareLinkParts | null {
  const m = hash.match(/^#\/share\/([^?]+)\?t=(.+)$/);
  if (!m) return null;
  const familyId = decodeURIComponent(m[1]);
  const token = decodeURIComponent(m[2]);
  if (!familyId || !token) return null;
  return { familyId, token };
}
