import { useEffect, useRef } from 'react';

/**
 * Send a scrolling pane back to the top whenever the thing it is showing changes.
 *
 * The lesson viewers keep one component mounted and swap the slug or the active
 * lecture underneath it. The scroll container has no reason to reset on its own,
 * so a student who read to the bottom of one lesson lands halfway down the body
 * of the next one. Pass whatever identifies the current item as `key`.
 */
export function useScrollToTop<T extends HTMLElement = HTMLDivElement>(key: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    // 'auto', not 'smooth': this is a jump between documents, not a movement
    // within one, and it must also beat any inherited scroll-behavior.
    ref.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [key]);

  return ref;
}

export default useScrollToTop;
