/** Absolute address of a recipe's detail, which opens that recipe in the app. */
export function shareLink(origin: string, recipeId: string): string {
  return `${origin}/recipes/${encodeURIComponent(recipeId)}`;
}

/**
 * What the share menu receives. With a photo the link travels inside `text`, because some receiving apps drop
 * `url` when a file is attached; without it, `url` carries the link.
 */
export function buildShare(title: string, link: string, photo?: File): ShareData {
  return photo
    ? { title, text: `${title}\n${link}`, files: [photo] }
    : { title, text: title, url: link };
}
