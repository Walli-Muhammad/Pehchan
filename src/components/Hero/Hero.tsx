'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScrambleText } from '@/hooks/useScrambleText';

export default function Hero() {
  const sectionRef     = useRef<HTMLElement>(null);
  const videoWrapRef   = useRef<HTMLDivElement>(null);
  const headlineRef    = useRef<HTMLDivElement>(null);

  // Auto-decoding cipher — runs purely in JS, no GSAP dependency
  const decodedText = useScrambleText('PEHCHAN', 2000, 500);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── 1. Set initial invisible state with gsap.set (instant, no tween) ──
      // Using gsap.set + gsap.to (not fromTo) means ctx.revert() restores
      // elements to their CSS values (no opacity-0 class = stays visible if GSAP fails).
      gsap.set(videoWrapRef.current,  { opacity: 0, scale: 1.1, filter: 'blur(10px)' });
      gsap.set(headlineRef.current,   { opacity: 0, y: 35 });

      // ── 2. Boot-up load-in animations ──
      gsap.to(videoWrapRef.current, {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 2.2, ease: 'power3.out',
      });
      gsap.to(headlineRef.current, {
        opacity: 1, y: 0,
        duration: 1.4, ease: 'expo.out', delay: 0.5,
      });

      // ── 3. Scroll-pinned scrub timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger:         sectionRef.current,
          start:           'top top',
          end:             '+=120%',   // pin for 1.2× viewport scroll
          scrub:           1.2,
          pin:             true,
          anticipatePin:   1,
          // invalidateOnRefresh recalculates positions on resize/Lenis refresh
          invalidateOnRefresh: true,
        },
      });

      // Video: subtly zooms in and gets a tiny blur — never goes dark
      tl.to(videoWrapRef.current, {
        scale:   1.12,
        filter:  'blur(4px)',
        opacity: 0.75,
        ease:    'none',
      }, 0);

      // Headline: fades out and drifts up — uses 'none' ease so it's very gradual
      tl.to(headlineRef.current, {
        opacity: 0,
        y:       -90,
        scale:   0.96,
        ease:    'none',  // linear across the full scroll distance — not aggressive
      }, 0);

    }, sectionRef); // scope all selectors to this section

    // Refresh ScrollTrigger after Lenis initialises (which happens async in SmoothScrollProvider)
    const rafId = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(rafId);
      ctx.revert(); // kills ALL tweens and ScrollTriggers in this context
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      // No opacity-0 class here — GSAP's gsap.set() handles the initial invisible state.
      // If GSAP ever fails to fire, elements stay fully visible (safe fallback).
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      {/* ── Cinematic Video Background ── */}
      <div
        ref={videoWrapRef}
        className="absolute inset-0 z-0 origin-center"
        style={{ willChange: 'transform, filter, opacity' }}
      >
        <video
          src="/hero-bg.mp4"
          autoPlay loop muted playsInline preload="auto"
          className="w-full h-full object-cover"
        />
        {/* Subtle vignette — just enough to keep text legible */}
        <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/65" />
      </div>

      {/* ── Typography Overlay ── */}
      <div
        ref={headlineRef}
        className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center px-4"
      >
        <h1
          className="text-[14vw] sm:text-[12vw] font-black tracking-[0.05em] text-white drop-shadow-2xl leading-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {decodedText}
        </h1>
        <p className="mt-4 md:mt-8 max-w-sm text-xs md:text-base tracking-[0.4em] uppercase text-zinc-300 font-light">
          Premium E-Commerce Experience
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-400">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-400 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
