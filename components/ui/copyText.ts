/** Put text on the clipboard. Resolves false when the browser refuses, so the
 *  caller never claims a copy that did not happen. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* Refused (a permissions policy, an unfocused frame): try the old path. */
  }
  /* The async clipboard API also needs a secure context, so a site served over
     plain http (a LAN preview, say) lands here rather than silently doing
     nothing. */
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:absolute;left:-9999px;top:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
