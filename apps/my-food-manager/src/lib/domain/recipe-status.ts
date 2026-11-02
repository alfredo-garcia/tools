import { timestampWithOffset } from "./pantry-ops";

/**
 * The only edit the app makes to a recipe file (ADR 004): a rated recipe that is `to-try` or `discarded` becomes
 * `tried`. Only the `status` and `updated` lines of the frontmatter change; the rest of the file stays byte for byte.
 * A missing, `tried` or unknown status needs no change.
 */
export function markRecipeTried(text: string, now: Date): { text: string; changed: boolean } {
  const lines = text.split("\n");
  if (lines[0]?.replace(/\r$/, "") !== "---") return { text, changed: false };
  const end = lines.findIndex((l, i) => i > 0 && l.replace(/\r$/, "") === "---");
  if (end < 0) return { text, changed: false };

  const at = lines.findIndex((l, i) => i > 0 && i < end && /^status:/.test(l));
  if (at < 0) return { text, changed: false };
  const value = lines[at]
    .replace(/^status:/, "")
    .replace(/\s+#.*$/, "")
    .trim()
    .replace(/^["']|["']$/g, "");
  if (value !== "to-try" && value !== "discarded") return { text, changed: false };

  const eol = lines[at].endsWith("\r") ? "\r" : "";
  lines[at] = `status: tried${eol}`;
  const updated = `updated: ${timestampWithOffset(now)}${eol}`;
  const up = lines.findIndex((l, i) => i > 0 && i < end && /^updated:/.test(l));
  if (up >= 0) lines[up] = updated;
  else lines.splice(end, 0, updated);
  return { text: lines.join("\n"), changed: true };
}
