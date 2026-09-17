import React, { useLayoutEffect, useRef, useState } from 'react';

// Remember decoded covers across filtering and route changes, without retaining
// image elements or letting a long browsing session grow the cache indefinitely.
const decodedCovers = new Set<string>();
function rememberCover(src: string) {
  decodedCovers.add(src);
  if (decodedCovers.size > 200) decodedCovers.delete(decodedCovers.values().next().value!);
}

type ImageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  src?: string;
  alt: string;
  fallback: React.ReactNode;
  imageClassName?: string;
};

/** Keep the card's dimensions while its actual cover loads and decodes. */
function ImageCardContent({
  src,
  alt,
  fallback,
  imageClassName = '',
  children,
  ...props
}: ImageCardProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    () => !src || decodedCovers.has(src) ? 'ready' : 'loading',
  );
  const image = useRef<HTMLImageElement>(null);
  const pending = status === 'loading';

  useLayoutEffect(() => {
    const element = image.current;
    if (!src || !element) return;
    let cancelled = false;
    let decoding = false;
    const fail = () => {
      if (!cancelled) {
        decodedCovers.delete(src);
        setStatus('error');
      }
    };
    const loaded = async () => {
      if (decoding) return;
      decoding = true;
      try {
        await element.decode();
        if (!cancelled) {
          rememberCover(src);
          setStatus('ready');
        }
      } catch {
        fail();
      }
    };
    element.addEventListener('load', loaded);
    element.addEventListener('error', fail);
    // Cached images can finish before listeners are attached.
    if (element.complete) {
      if (element.naturalWidth > 0) void loaded();
      else fail();
    }
    return () => {
      cancelled = true;
      element.removeEventListener('load', loaded);
      element.removeEventListener('error', fail);
    };
  }, [src]);

  return (
    <div
      {...props}
      aria-label={props['aria-label'] ?? alt}
      aria-busy={pending}
      aria-disabled={pending || props['aria-disabled'] || undefined}
      tabIndex={pending ? -1 : props.tabIndex}
      onClick={pending ? undefined : props.onClick}
      onKeyDown={pending ? undefined : props.onKeyDown}
    >
      <div
        className="absolute inset-0"
        style={{ opacity: pending ? 0 : 1 }}
        aria-hidden={pending || undefined}
        inert={pending}
      >
        {fallback}
        {src && status !== 'error' && (
          <img
            ref={image}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
          />
        )}
        {children}
      </div>
      {pending && (
        <div aria-hidden="true" data-card-skeleton className="absolute inset-0 bg-[#121a2a] p-4 motion-safe:animate-pulse">
          <div className="h-5 w-24 rounded-md bg-[#263248]" />
          <div className="absolute inset-x-4 bottom-4 space-y-3">
            <div className="h-5 w-3/4 rounded bg-[#263248]" />
            <div className="h-3 w-1/2 rounded bg-[#263248]" />
            <div className="h-3 w-1/3 rounded bg-[#263248]" />
          </div>
        </div>
      )}
    </div>
  );
}

// A replacement cover starts its own lifecycle; late events from the previous
// cover cannot reveal it prematurely. Ordinary rerenders keep the same instance.
export default function ImageCard(props: ImageCardProps) {
  return <ImageCardContent key={props.src || ''} {...props} />;
}
