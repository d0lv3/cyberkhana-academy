import React, { useCallback, useEffect, useRef, useState } from 'react';
import FeedbackDialog from './FeedbackDialog';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  flushPendingFeedback,
  markFeedbackAsked,
  submitFeedback,
  wasFeedbackAsked,
  type FeedbackContext,
  type Rating,
} from '../../services/feedbackService';

type Trigger = (context: FeedbackContext, delayMs?: number) => void;
let trigger: Trigger | null = null;

/**
 * Ask the learner to rate what they just finished.
 *
 * Fire and forget, from wherever completion actually happens. Requests are
 * dropped when the learner has already answered about this content, when a
 * dialog is already up, or when the host is not mounted, so callers never have
 * to guard. Requires <FeedbackHost /> mounted once at the app root.
 */
export function requestFeedback(context: FeedbackContext, delayMs?: number): void {
  trigger?.(context, delayMs);
}

/* Completion is its own moment: the tick lands, the next-lesson card appears.
   The dialog waits for that to register before covering it. */
const DEFAULT_DELAY = 900;

const FeedbackHost: React.FC = () => {
  const { lang } = useLang();
  const { isAuthenticated } = useAuth();
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Read inside the trigger, which is registered once and must not go stale. */
  const openRef = useRef(false);

  useEffect(() => {
    trigger = (ctx, delayMs) => {
      if (openRef.current || timerRef.current) return;
      if (wasFeedbackAsked(ctx.track, ctx.contextId)) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        openRef.current = true;
        setContext(ctx);
      }, delayMs ?? DEFAULT_DELAY);
    };
    return () => {
      trigger = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  /* Answers that never reached the server, retried once the session is back. */
  useEffect(() => {
    if (!isAuthenticated) return;
    flushPendingFeedback().catch(() => {
      /* still offline; the queue keeps until next time */
    });
  }, [isAuthenticated]);

  const dismiss = useCallback(() => {
    /* Waving the dialog away is an answer of its own: asking again about the
       same lesson would be nagging, not collecting. */
    setContext((current) => {
      if (current) markFeedbackAsked(current.track, current.contextId);
      return null;
    });
    openRef.current = false;
  }, []);

  const handleSubmit = useCallback(
    async (rating: Rating, comment: string) => {
      if (!context) return false;
      try {
        await submitFeedback({ ...context, rating, comment, lang });
        return true;
      } catch {
        /* submitFeedback has already queued it for retry. */
        return false;
      }
    },
    [context, lang]
  );

  if (!context) return null;

  return (
    <FeedbackDialog
      key={`${context.track}:${context.contextId}`}
      context={context}
      onSubmit={handleSubmit}
      onDismiss={dismiss}
    />
  );
};

export default FeedbackHost;
