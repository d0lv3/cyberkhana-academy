/* ─── The server's figure for XP ───
 *
 * The server is the one scorer whose number counts: the leaderboard and
 * public profiles show what it stored. This holds the last figure it gave and
 * the completions it gave it for, so xpService can show exactly that figure,
 * plus whatever this browser has completed since (services/xpService.ts).
 *
 * Kept apart from syncService, which sets it, and xpService, which reads it,
 * because xpService reaches syncService through progressService and importing
 * either from the other would close a cycle. It imports nothing for the same
 * reason.
 */

/* Mirrors progressService's event name, as syncService does. */
const PROGRESS_EVENT = 'academy-progress-changed';

/** The completions a figure was scored from, per container. */
export interface ScoredCompletions {
  programming: ReadonlyMap<string, ReadonlySet<string>>;
  osModules: ReadonlyMap<string, ReadonlySet<string>>;
  networking: ReadonlySet<string>;
}

export interface ServerXp {
  /** Lifetime XP: the content, plus what an admin awarded and the streak paid. */
  xp: number;
  /** The all-time board's figure, and the reset it counts from; `since` is
   *  null when the board counts everything, as it does until a reset. */
  board: { xp: number; since: string | null };
  scored: ScoredCompletions;
}

let current: ServerXp | null = null;

/* Replies can land out of order: two pushes in flight, or one still in flight
   when the account signs out. Each request takes a ticket before it is sent,
   and only a reply newer than the last one taken in is kept. */
let issued = 0;
let accepted = 0;

/** Take before sending the request whose reply will be handed to setServerXp. */
export function nextScoreTicket(): number {
  return ++issued;
}

const idSet = (value: unknown): Set<string> =>
  new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

function idSets(record: unknown): Map<string, Set<string>> {
  const sets = new Map<string, Set<string>>();
  if (record && typeof record === 'object' && !Array.isArray(record)) {
    for (const [key, ids] of Object.entries(record)) sets.set(key, idSet(ids));
  }
  return sets;
}

function announce(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/**
 * Keep the server's figure, with the completions it was scored from: the
 * snapshot a push sent, or the progress a pull returned. A missing figure
 * (an older server) leaves what is held alone.
 */
export function setServerXp(
  ticket: number,
  xp: unknown,
  board: unknown,
  completions: { programming?: unknown; osModules?: unknown; networking?: unknown } | null | undefined
): void {
  if (ticket <= accepted || typeof xp !== 'number' || !Number.isFinite(xp)) return;
  accepted = ticket;
  const reported = (board ?? {}) as { xp?: unknown; since?: unknown };
  current = {
    xp: Math.max(0, Math.round(xp)),
    board: {
      xp: typeof reported.xp === 'number' && Number.isFinite(reported.xp) ? Math.max(0, reported.xp) : xp,
      since: typeof reported.since === 'string' ? reported.since : null,
    },
    scored: {
      programming: idSets(completions?.programming),
      osModules: idSets(completions?.osModules),
      networking: idSet(completions?.networking),
    },
  };
  announce();
}

/** Has a reply newer than this request's already been taken in? Then what
 *  this one carries is the older picture of the record. */
export function isOvertaken(ticket: number): boolean {
  return accepted > ticket;
}

export function getServerXp(): ServerXp | null {
  return current;
}

/** The account is going: drop its figure, and any reply still on its way. */
export function forgetServerXp(): void {
  accepted = ++issued;
  if (!current) return;
  current = null;
  announce();
}
