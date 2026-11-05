/* ─── Studio stashes ───
 * A Studio list page hands the item being opened to its editor through here.
 * sessionStorage is what lets that survive a reload of the editor, but it has
 * the same small limit localStorage does, and a whole module can pass it. So the
 * tab's own memory holds the stash too, and an item too large for sessionStorage
 * still opens: it just has to be opened from the list again after a reload.
 */

const memory = new Map<string, string>();

export function stashSet(key: string, json: string): void {
  memory.set(key, json);
  try {
    sessionStorage.setItem(key, json);
  } catch {
    // An older, smaller stash under this key must not come back after a reload.
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* storage unavailable: nothing was kept */
    }
  }
}

export function stashGet(key: string): string | null {
  const held = memory.get(key);
  if (held !== undefined) return held;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

/** At sign-out. These are other creators' items, and they go with the session. */
export function clearStashes(): void {
  memory.clear();
  try {
    const stashes: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('academy-')) stashes.push(key);
    }
    for (const key of stashes) sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable: nothing was kept */
  }
}
