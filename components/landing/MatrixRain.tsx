import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CHARS =
  'アァカサタナハマヤラワ0123456789ABCDEFGHIJKLMNPRSTUVXYZ#$%&*<>/\\|=+CYBERKHANA{}';

interface MatrixRainProps {
  active: boolean;
  onDone: () => void;
  /** How long the rain runs before fading out (ms). */
  duration?: number;
}

/**
 * Full-viewport "hacker mode" overlay: green katakana/ASCII glyphs rain from the
 * top of the screen for a few seconds, then fade out. Rendered to document.body
 * so no transformed ancestor can clip it. Pointer-events-none — the page stays
 * usable and it auto-dismisses.
 */
const MatrixRain: React.FC<MatrixRainProps> = ({ active, onDone, duration = 6000 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];
    let running = true;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = new Array(columns).fill(0).map(() => Math.random() * -50);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      // translucent wash to leave fading trails
      ctx.fillStyle = 'rgba(5,8,14,0.10)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        // bright leading glyph, brand-green trail
        ctx.fillStyle =
          Math.random() > 0.97 ? '#eafff0' : Math.random() > 0.5 ? '#9fef00' : '#00a859';
        ctx.fillText(ch, x, y);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = Math.random() * -20;
        drops[i] += 1;
      }
      if (running) raf = requestAnimationFrame(draw);
    };
    draw();

    const timer = window.setTimeout(() => {
      running = false;
      onDoneRef.current();
    }, duration);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [active, duration]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[300] pointer-events-none"
          style={{ background: 'rgba(5,8,14,0.4)' }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MatrixRain;
