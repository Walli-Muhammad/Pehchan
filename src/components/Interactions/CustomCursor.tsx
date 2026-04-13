'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverText, setHoverText] = useState('');

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorTarget = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorTarget) {
        setIsHovered(true);
        setHoverText(cursorTarget.getAttribute('data-cursor') ?? '');
      } else {
        setIsHovered(false);
        setHoverText('');
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  // Don't render on touch/coarse pointer devices
  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
    return null;
  }

  return (
    <motion.div
      // ─── NO mix-blend-difference: using a solid white fill so the 
      // cursor is always visible on the dark zinc-950 product grid background.
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center"
      style={{
        translateX: '-50%',
        translateY: '-50%',
        x: cursorXSpring,
        y: cursorYSpring,
      }}
    >
      <motion.div
        animate={{
          width: isHovered ? 80 : 32,
          height: isHovered ? 80 : 32,
          backgroundColor: 'rgba(255, 255, 255, 1)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center justify-center rounded-full text-black font-semibold text-[10px] tracking-widest overflow-hidden"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered && hoverText ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className="whitespace-nowrap select-none"
        >
          {hoverText.toUpperCase()}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
