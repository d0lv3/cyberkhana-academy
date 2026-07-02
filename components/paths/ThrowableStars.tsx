import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  green: boolean;
}

interface ThrowableStarsProps {
  /** How many stars to scatter. */
  count?: number;
}

const FRICTION = 0.985; // per-frame velocity decay after a throw
const RESTITUTION = 0.72; // energy kept when bouncing off an edge
const MAX_SPEED = 34; // clamp throw speed (px per ~16ms frame)

/**
 * A thin overlay of small stars the user can grab and fling around. The layer
 * itself is click-through (pointer-events: none) so the cubes underneath stay
 * interactive; only the star dots capture the pointer. Motion is a light
 * physics loop — throw velocity carries over on release, decays with friction,
 * and bounces off the panel edges.
 */
const ThrowableStars: React.FC<ThrowableStarsProps> = ({ count = 20 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const starsRef = useRef<Star[]>([]);
  const dragRef = useRef<{ idx: number; lastT: number } | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect0 = el.getBoundingClientRect();
    const w0 = rect0.width || 800;
    const h0 = rect0.height || 600;
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w0,
      y: Math.random() * h0,
      vx: 0,
      vy: 0,
      r: 1.6 + Math.random() * 2.2,
      green: Math.random() > 0.35,
    }));

    // Paint initial positions/sizes/colors.
    starsRef.current.forEach((s, i) => {
      const node = nodeRefs.current[i];
      if (!node) return;
      node.style.width = `${s.r * 2}px`;
      node.style.height = `${s.r * 2}px`;
      node.style.marginLeft = `${-s.r}px`;
      node.style.marginTop = `${-s.r}px`;
      node.style.background = s.green ? '#7ef0b0' : '#eafff4';
      node.style.boxShadow = s.green
        ? '0 0 7px 1px rgba(0,168,89,0.65)'
        : '0 0 5px 1px rgba(126,240,176,0.4)';
      node.style.transform = `translate(${s.x}px, ${s.y}px)`;
    });

    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(32, t - last) / 16;
      last = t;
      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const drag = dragRef.current;

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        if (!drag || drag.idx !== i) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vx *= FRICTION;
          s.vy *= FRICTION;
          if (s.x < s.r) {
            s.x = s.r;
            s.vx = Math.abs(s.vx) * RESTITUTION;
          } else if (s.x > w - s.r) {
            s.x = w - s.r;
            s.vx = -Math.abs(s.vx) * RESTITUTION;
          }
          if (s.y < s.r) {
            s.y = s.r;
            s.vy = Math.abs(s.vy) * RESTITUTION;
          } else if (s.y > h - s.r) {
            s.y = h - s.r;
            s.vy = -Math.abs(s.vy) * RESTITUTION;
          }
          if (Math.abs(s.vx) < 0.02) s.vx = 0;
          if (Math.abs(s.vy) < 0.02) s.vy = 0;
        }
        const node = nodeRefs.current[i];
        if (node) node.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count]);

  const localPoint = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const s = starsRef.current[i];
    s.vx = 0;
    s.vy = 0;
    dragRef.current = { idx: i, lastT: performance.now() };
  };

  const onMove = (i: number) => (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.idx !== i) return;
    const s = starsRef.current[i];
    const p = localPoint(e);
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastT);
    // Track pointer velocity so the release becomes a throw.
    s.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ((p.x - s.x) / dt) * 16));
    s.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, ((p.y - s.y) / dt) * 16));
    s.x = p.x;
    s.y = p.y;
    drag.lastT = now;
  };

  const onUp = (i: number) => (e: React.PointerEvent) => {
    if (dragRef.current?.idx === i) dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          onPointerDown={onDown(i)}
          onPointerMove={onMove(i)}
          onPointerUp={onUp(i)}
          onPointerCancel={onUp(i)}
          className="pointer-events-auto absolute left-0 top-0 rounded-full"
          style={{
            background: '#eafff4',
            boxShadow: '0 0 6px 1px rgba(0,168,89,0.55)',
            cursor: 'grab',
            touchAction: 'none',
          }}
        />
      ))}
    </div>
  );
};

export default ThrowableStars;
