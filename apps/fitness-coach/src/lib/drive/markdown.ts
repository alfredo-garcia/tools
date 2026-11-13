/**
 * Splits a knowledge-base Markdown item into its YAML frontmatter and its `## ` sections.
 */
export type SplitItem = { frontmatter: string; sections: Map<string, string> };

/** Returns null when the file has no `---` frontmatter block. */
export function splitItem(content: string): SplitItem | null {
  const text = content.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 3);
  if (end === -1) return null;
  const after = text.indexOf("\n", end + 4);
  const frontmatter = text.slice(4, end + 1);
  const body = after === -1 ? "" : text.slice(after + 1);
  return { frontmatter, sections: parseSections(body) };
}

/** `## Heading` → trimmed Markdown text until the next `## ` heading. Keys are the headings. */
export function parseSections(body: string): Map<string, string> {
  const out = new Map<string, string>();
  let current: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (current !== null) out.set(current, lines.join("\n").trim());
  };
  for (const line of body.split("\n")) {
    const m = /^## (.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = m[1];
      lines = [];
    } else if (current !== null) {
      lines.push(line);
    }
  }
  flush();
  return out;
}
