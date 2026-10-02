export interface CodeDraft {
  code: string;
  stdin: string;
}

const PREFIX = 'academy-code-draft:';

export function codeDraftKey(accountId: string, lessonId: string): string {
  return `${PREFIX}${encodeURIComponent(accountId)}:${encodeURIComponent(lessonId)}`;
}

export function readCodeDraft(key: string | null): CodeDraft | null {
  if (!key) return null;
  try {
    const draft = JSON.parse(localStorage.getItem(key) ?? 'null');
    return draft && typeof draft.code === 'string' && typeof draft.stdin === 'string'
      ? { code: draft.code, stdin: draft.stdin }
      : null;
  } catch {
    return null;
  }
}

/** Save at the edit itself, so navigating or refreshing immediately loses nothing. */
export function writeCodeDraft(key: string | null, draft: CodeDraft): boolean {
  if (!key) return false;
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearCodeDraft(key: string | null): void {
  if (!key) return;
  try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}

export function clearAccountCodeDrafts(accountId: string): void {
  const prefix = `${PREFIX}${encodeURIComponent(accountId)}:`;
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    for (const key of keys) if (key?.startsWith(prefix)) localStorage.removeItem(key);
  } catch { /* Nothing accessible to remove. */ }
}
