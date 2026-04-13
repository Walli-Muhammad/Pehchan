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
    // Check if on a desktop device
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Look for the closest parent with data-cursor attribute
      const cursorTarget = target.closest('[data-cursor]') as HTMLElement;
      
      if (cursorTarget) {
        setIsHovered(true);
        setHoverText(cursorTarget.getAttribute('data-cursor') || '');
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

  // Hide entirely if we aren't on a fine pointer device (prevents bugging out on mobile)
  if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex flex-col items-center justify-center mix-blend-difference"
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
          backgroundColor: isHovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 1)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center justify-center rounded-full text-black font-semibold text-[10px] sm:text-xs tracking-widest overflow-hidden"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered && hoverText ? 1 : 0 }}
          className="whitespace-nowrap"
        >
          {hoverText.toUpperCase()}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
