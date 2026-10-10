/* ─── Finishing a stop ───
 *
 * Nothing in this browser can say a lesson is finished. The server keeps that
 * record and adds to it one stop at a time, once the work checks out
 * (backend/src/routes/progress.ts): a quiz's answers are marked against
 * answers it never sends, a challenge's test outputs are compared, and a lab's
 * flags are checked one by one. Every tick on the page comes back from its
 * answer (syncService applyServerRecord).
 *
 * Work with nothing to check is paced to real time on the server
 * (backend/src/utils/pace.ts). When it says "not yet", the completion waits
 * here, on this device, and goes again by itself the moment the server will
 * take it, so moving on to the next lesson loses nothing.
 */

import { useEffect, useState } from 'react';
import { api, ApiError } from './api';
import {
  applyServerRecord,
  isSyncEnabled,
  HYDRATED_EVENT,
  PENDING_COMPLETIONS_KEY,
  type ServerRecord,
} from './syncService';
import { nextScoreTicket } from './serverXp';
import { dayKeyOf } from '../backend/src/shared/streak';
import type { QuizAnswer } from '../backend/src/shared/checks';

export type { QuizAnswer };

/* Mirrors progressService's event name, as syncService does. */
const PROGRESS_EVENT = 'academy-progress-changed';

/** A stop, as the server names it: which container, and which stop in it. */
export type StopRef =
  | { kind: 'module'; slug: string; stopId: string }
  | { kind: 'programming'; language: string; stopId: string }
  | { kind: 'networking'; stopId: string };

/** The work that goes with a stop: a quiz's answers in the order the author
 *  wrote the questions, or what a challenge printed for each of its tests. */
export interface CompletionProof {
  answers?: QuizAnswer[];
  outputs?: string[];
}

export type FailReason =
  /** A quiz below its pass mark, or a challenge with a failing test. */
  | 'not-passed'
  /** The lesson changed on the server since this page loaded it. */
  | 'changed'
  /** Not a published stop: a draft, or something since taken down. */
  | 'unpublished'
  | 'signed-out'
  | 'rate-limited'
  | 'network';

export type CompletionOutcome =
  | { status: 'done' }
  /** Held by the pace clock, and sent again by itself at `readyAt`. */
  | { status: 'waiting'; readyAt: number }
  | { status: 'failed'; reason: FailReason };

export const stopKey = (ref: StopRef): string =>
  ref.kind === 'module'
    ? `module\u0000${ref.slug}\u0000${ref.stopId}`
    : ref.kind === 'programming'
      ? `programming\u0000${ref.language}\u0000${ref.stopId}`
      : `networking\u0000${ref.stopId}`;

const today = () => dayKeyOf(new Date());

/** Why a request the server turned down failed, from its code and status. */
function reasonOf(err: unknown): FailReason {
  if (!(err instanceof ApiError)) return 'network';
  const code = err.body.code;
  if (code === 'NOT_PASSED' || code === 'TESTS_FAILED') return 'not-passed';
  if (code === 'CONTENT_CHANGED') return 'changed';
  if (code === 'UNKNOWN_STOP' || code === 'USE_FLAGS' || err.status === 404) return 'unpublished';
  if (err.status === 401) return 'signed-out';
  if (err.status === 429) return 'rate-limited';
  return 'network';
}

/* ── Waiting on the pace clock ── */

interface Pending {
  ref: StopRef;
  proof: CompletionProof;
  /** When the server said it would take it, on this device's clock. */
  readyAt: number;
}

function readPending(): Pending[] {
  try {
    const raw = localStorage.getItem(PENDING_COMPLETIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (p): p is Pending =>
            !!p && typeof p === 'object' && typeof (p as Pending).readyAt === 'number' && !!(p as Pending).ref
        )
      : [];
  } catch {
    return [];
  }
}

function writePending(list: Pending[]): void {
  try {
    if (list.length) localStorage.setItem(PENDING_COMPLETIONS_KEY, JSON.stringify(list));
    else localStorage.removeItem(PENDING_COMPLETIONS_KEY);
  } catch {
    /* storage unavailable: the page still shows the wait, it just will not survive a reload */
  }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

function putPending(item: Pending): void {
  const key = stopKey(item.ref);
  writePending([...readPending().filter((p) => stopKey(p.ref) !== key), item]);
}

function dropPending(ref: StopRef): void {
  const key = stopKey(ref);
  const list = readPending();
  if (list.some((p) => stopKey(p.ref) === key)) writePending(list.filter((p) => stopKey(p.ref) !== key));
}

/** When a completion waiting on the pace clock goes again, or null when this
 *  stop is not waiting. */
export function getPendingCompletion(ref: StopRef): number | null {
  const key = stopKey(ref);
  return readPending().find((p) => stopKey(p.ref) === key)?.readyAt ?? null;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

/** Wake up for the next completion that falls due. */
function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  const list = readPending();
  if (!list.length || !isSyncEnabled()) return;
  const next = Math.min(...list.map((p) => p.readyAt));
  // A moment past the time, so the server's clock has certainly got there too.
  timer = setTimeout(() => void flushDue(), Math.max(0, next - Date.now()) + 1000);
}

async function flushDue(): Promise<void> {
  timer = null;
  if (flushing || !isSyncEnabled()) return;
  flushing = true;
  try {
    for (const item of readPending().filter((p) => p.readyAt <= Date.now())) {
      await send(item.ref, item.proof, true);
    }
  } finally {
    flushing = false;
    schedule();
  }
}

/** After a sign-in, and whenever the tab comes back into view: a background
 *  tab's timers are held back, so a wait can run long past its time there. */
export function resumePendingCompletions(): void {
  if (readPending().some((p) => p.readyAt <= Date.now())) void flushDue();
  else schedule();
}

if (typeof window !== 'undefined') {
  window.addEventListener(HYDRATED_EVENT, resumePendingCompletions);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') resumePendingCompletions();
  });
}

/* ── Sending ── */

async function send(ref: StopRef, proof: CompletionProof, queued: boolean): Promise<CompletionOutcome> {
  if (!isSyncEnabled()) return { status: 'failed', reason: 'signed-out' };
  const ticket = nextScoreTicket();
  try {
    const result = await api.post<ServerRecord>('/progress/complete', { stop: ref, ...proof, day: today() });
    dropPending(ref);
    applyServerRecord(ticket, result);
    return { status: 'done' };
  } catch (err) {
    if (err instanceof ApiError && err.status === 429 && err.body.code === 'PACE') {
      /* Timed on this device's clock from how long the server said, rather
         than its own timestamp, which a skewed clock here would misread. */
      const seconds = Math.max(1, Number(err.body.retryInSeconds) || 60);
      const readyAt = Date.now() + seconds * 1000;
      putPending({ ref, proof, readyAt });
      schedule();
      return { status: 'waiting', readyAt };
    }
    const reason = reasonOf(err);
    if (queued && (reason === 'network' || reason === 'rate-limited')) {
      // Still worth sending: try again in a minute rather than dropping it.
      putPending({ ref, proof, readyAt: Date.now() + 60_000 });
      return { status: 'waiting', readyAt: Date.now() + 60_000 };
    }
    dropPending(ref);
    return { status: 'failed', reason };
  }
}

/** Ask the server to record a stop, with whatever work it takes. */
export function completeStop(ref: StopRef, proof: CompletionProof = {}): Promise<CompletionOutcome> {
  return send(ref, proof, false);
}

/* ── One quiz answer ── */

export interface AnswerCheck {
  correct: boolean;
  /** The right option, in the author's order, when a pick was wrong. */
  correctIndex?: number;
  /** The right answer, when a typed one was wrong. */
  answer?: string;
  /** The same in Arabic, on a question that is asked in both languages. */
  answerAr?: string;
}

/** Mark one answer, for the feedback after each question. Records nothing. */
export async function checkQuizAnswer(
  ref: StopRef,
  question: number,
  count: number,
  answer: QuizAnswer
): Promise<AnswerCheck | { failed: FailReason }> {
  try {
    return await api.post<AnswerCheck>('/progress/check', { stop: ref, question, count, answer });
  } catch (err) {
    return { failed: reasonOf(err) };
  }
}

/* ── One lab flag ── */

export interface FlagCheck {
  correct: boolean;
  /** Every flag of this lab the server has accepted so far. */
  solved: string[];
}

/** Check one flag. The last one records the lab, and the answer says so. */
export async function submitLabFlag(
  ref: Extract<StopRef, { kind: 'module' }>,
  flagId: string,
  value: string
): Promise<FlagCheck | { failed: FailReason }> {
  if (!isSyncEnabled()) return { failed: 'signed-out' };
  const ticket = nextScoreTicket();
  try {
    const result = await api.post<FlagCheck & ServerRecord>('/progress/flag', {
      stop: ref,
      flagId,
      value,
      day: today(),
    });
    // Present only when the lab is complete: the server settled the account.
    if (typeof result.xp === 'number') applyServerRecord(ticket, result);
    return { correct: result.correct, solved: Array.isArray(result.solved) ? result.solved : [] };
  } catch (err) {
    return { failed: reasonOf(err) };
  }
}

/* ── For pages ── */

function pendingIn(kind: StopRef['kind'], container: string): string[] {
  return readPending()
    .map((p) => p.ref)
    .filter((ref) =>
      ref.kind !== kind
        ? false
        : ref.kind === 'module'
          ? ref.slug === container
          : ref.kind === 'programming'
            ? ref.language === container
            : true
    )
    .map((ref) => ref.stopId);
}

/** The stops of one module, language or the networking track that are
 *  waiting on the pace clock, kept current. `container` is the module slug or
 *  language slug, and ignored for networking. */
export function usePendingStops(kind: StopRef['kind'], container = ''): string[] {
  const [ids, setIds] = useState<string[]>(() => pendingIn(kind, container));
  useEffect(() => {
    const refresh = () =>
      setIds((prev) => {
        const next = pendingIn(kind, container);
        return next.length === prev.length && next.every((id, i) => id === prev[i]) ? prev : next;
      });
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [kind, container]);
  return ids;
}

/** When this stop's waiting completion goes again, kept current. */
export function usePendingCompletion(ref: StopRef | null): number | null {
  const key = ref ? stopKey(ref) : '';
  const read = () => (ref ? getPendingCompletion(ref) : null);
  const [readyAt, setReadyAt] = useState<number | null>(read);
  useEffect(() => {
    const refresh = () => setReadyAt(read());
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return readyAt;
}
