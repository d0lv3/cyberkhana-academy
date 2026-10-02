/** Only an internal route can be a post-login destination. */
export function safeLoginDestination(value: string | null): string {
  if (!value || !/^\/(?!\/)[^\\\s\u0000-\u001f]*$/.test(value)) return '/dashboard';
  const path = value.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/login') return '/dashboard';
  return value;
}

export function loginPath(destination: string): string {
  return `/login?next=${encodeURIComponent(safeLoginDestination(destination))}`;
}
