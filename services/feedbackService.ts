/* ─── Feedback Service ───
 * Learners rate a module or lesson the moment they finish it; creators read
 * the answers in the Content Studio.
 *
 * Unlike progress and creator content, feedback is NOT mirrored into
 * localStorage as a source of truth: the whole point is that a creator on
 * another machine reads what a learner wrote here, and only the server can
 * carry that. localStorage holds two things instead:
 *   · which prompts this learner has already answered or waved away, so the
 *     dialog never asks twice about the same lesson
 *   · answers that could not reach the server, retried on the next boot
 */

import { api } from './api';

export const FEEDBACK_TRACKS = ['programming', 'networking', 'os-modules'] as const;
export type FeedbackTrack = (typeof FEEDBACK_TRACKS)[number];

export type Rating = 1 | 2 | 3 | 4 | 5;

/** What the dialog is asking about. */
export interface FeedbackContext {
  track: FeedbackTrack;
  /** Id of the finished module / lesson. */
  contextId: string;
  contextTitle: string;
  /** Short qualifier: the language name, the pillar, the module a lesson sits in. */
  contextSub?: string;
}

export interface FeedbackDraft extends FeedbackContext {
  rating: Rating;
  comment: string;
  lang: 'en' | 'ar';
}

/** One learner's answer, as the studio reads it back. */
export interface FeedbackEntry {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  contextId: string;
  contextTitle: string;
  contextSub?: string;
  lang: 'en' | 'ar';
  createdAt: string;
}

export interface TrackSummary {
  total: number;
  average: number;
  /** Counts for ratings 1 to 5, in that order. */
  distribution: number[];
}

export type FeedbackSummary = Record<FeedbackTrack, TrackSummary>;

const ANSWERED_KEY = 'academy-feedback-answered';
const PENDING_KEY = 'academy-feedback-pending';
/** Enough history that nobody is asked twice, bounded so it cannot grow forever. */
const ANSWERED_LIMIT = 300;
const PENDING_LIMIT = 30;

const emptySummary = (): TrackSummary => ({ total: 0, average: 0, distribution: [0, 0, 0, 0, 0] });

export function emptyFeedbackSummary(): FeedbackSummary {
  return {
    programming: emptySummary(),
    networking: emptySummary(),
    'os-modules': emptySummary(),
  };
}

/* ── local bookkeeping ── */

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: unknown[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota, and a dropped prompt-history entry only costs one extra ask */
  }
}

const contextKey = (track: FeedbackTrack, contextId: string) => `${track}:${contextId}`;

/** Has this learner already answered, or waved away, the prompt for this content? */
export function wasFeedbackAsked(track: FeedbackTrack, contextId: string): boolean {
  return readList<string>(ANSWERED_KEY).includes(contextKey(track, contextId));
}

/** Remember that we asked, whether or not an answer came back. */
export function markFeedbackAsked(track: FeedbackTrack, contextId: string): void {
  const key = contextKey(track, contextId);
  const list = readList<string>(ANSWERED_KEY).filter((k) => k !== key);
  list.push(key);
  writeList(ANSWERED_KEY, list.slice(-ANSWERED_LIMIT));
}

/* ── submission ── */

function queuePending(draft: FeedbackDraft): void {
  const key = contextKey(draft.track, draft.contextId);
  const pending = readList<FeedbackDraft>(PENDING_KEY).filter(
    (d) => contextKey(d.track, d.contextId) !== key
  );
  pending.push(draft);
  writeList(PENDING_KEY, pending.slice(-PENDING_LIMIT));
}

async function postFeedback(draft: FeedbackDraft): Promise<void> {
  await api.post('/feedback', {
    track: draft.track,
    rating: draft.rating,
    comment: draft.comment.trim().slice(0, 2000),
    contextId: draft.contextId,
    contextTitle: draft.contextTitle,
    ...(draft.contextSub ? { contextSub: draft.contextSub } : {}),
    lang: draft.lang,
  });
}

/**
 * Send one answer. The prompt is marked answered either way: a learner who
 * took the time to write something should not be asked again because their
 * connection dropped, and the queued copy is retried on the next boot.
 */
export async function submitFeedback(draft: FeedbackDraft): Promise<void> {
  markFeedbackAsked(draft.track, draft.contextId);
  try {
    await postFeedback(draft);
  } catch (err) {
    queuePending(draft);
    throw err;
  }
}

/** Retry answers that never made it. Called once, after a session is restored. */
export async function flushPendingFeedback(): Promise<void> {
  const pending = readList<FeedbackDraft>(PENDING_KEY);
  if (pending.length === 0) return;

  const stillPending: FeedbackDraft[] = [];
  for (const draft of pending) {
    try {
      await postFeedback(draft);
    } catch {
      stillPending.push(draft);
    }
  }
  writeList(PENDING_KEY, stillPending);
}

/* ── studio reads ── */

export async function fetchFeedbackSummary(): Promise<FeedbackSummary> {
  const { summary } = await api.get<{ summary: Partial<FeedbackSummary> }>('/feedback/summary');
  const result = emptyFeedbackSummary();
  for (const track of FEEDBACK_TRACKS) {
    const t = summary?.[track];
    if (t) result[track] = { ...emptySummary(), ...t };
  }
  return result;
}

export const FEEDBACK_PAGE_SIZE = 100;

/** One page of responses, newest first. `total` counts every response on the
 *  track, not just this page, so a caller knows when there is more to fetch. */
export async function fetchFeedback(
  track: FeedbackTrack,
  skip = 0,
  limit = FEEDBACK_PAGE_SIZE
): Promise<{ total: number; entries: FeedbackEntry[] }> {
  return api.get<{ total: number; entries: FeedbackEntry[] }>(
    `/feedback?track=${encodeURIComponent(track)}&skip=${skip}&limit=${limit}`
  );
}
