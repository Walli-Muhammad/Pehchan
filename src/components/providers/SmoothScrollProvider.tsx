'use client';

import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    // 1. Initialise Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // 2. Sync Lenis scroll position → GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 3. Drive Lenis via GSAP ticker (single rAF loop)
    const rafUpdate = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(rafUpdate);
    gsap.ticker.lagSmoothing(0); // prevent GSAP lag on tab switch

    return () => {
      lenis.destroy();
      gsap.ticker.remove(rafUpdate);
    };
  }, []);

  // No wrapper div, no motion.div, no AnimatePresence.
  // Previously, the motion.div with `filter: blur(0px)` was creating a new CSS
  // stacking context during hydration, trapping GSAP animations and making
  // the Hero + Cursor invisible until a hard refresh.
  return <>{children}</>;
}
