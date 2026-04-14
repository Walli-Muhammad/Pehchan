'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverText, setHoverText] = useState('');
  const [visible, setVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Effect 1: Mark client-side mount. The cursor div renders only after this.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect 2: Boot the rAF tracking loop — only after the cursor div is in the DOM.
  useEffect(() => {
    if (!isMounted) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let rafId: number;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.12);
      currentY = lerp(currentY, targetY, 0.12);
      if (cursorRef.current) {
        cursorRef.current.style.left = `${currentX}px`;
        cursorRef.current.style.top  = `${currentY}px`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null;
      if (el) {
        setIsHovered(true);
        setHoverText(el.getAttribute('data-cursor') ?? '');
      } else {
        setIsHovered(false);
        setHoverText('');
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(rafId);
    };
  }, [isMounted]); // re-runs only when isMounted flips to true

  // Don't render on server (SSR) or before client mount — prevents hydration mismatch
  if (!isMounted) return null;

  return (
    <div
      ref={cursorRef}
      // Position driven by rAF → style.left + style.top (no framer transform conflict)
      // -translate-x/y is pure CSS centering — no competing transform
      className="pointer-events-none fixed top-0 left-0 z-[99999] -translate-x-1/2 -translate-y-1/2"
      style={{ willChange: 'left, top' }}
    >
      {/* Framer motion only animates size and opacity — no position transforms */}
      <motion.div
        animate={{
          width:   isHovered ? 80 : 32,
          height:  isHovered ? 80 : 32,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="flex items-center justify-center rounded-full bg-white text-black select-none font-bold text-[10px] tracking-widest overflow-hidden"
        style={{
          // High-contrast outline so cursor is visible on both dark and bright video backgrounds
          boxShadow: '0 0 0 2px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <motion.span
          animate={{ opacity: isHovered && hoverText ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="whitespace-nowrap"
        >
          {hoverText.toUpperCase()}
        </motion.span>
      </motion.div>
    </div>
  );
}
