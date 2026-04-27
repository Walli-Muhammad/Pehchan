'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useScrambleText } from '@/hooks/useScrambleText';
import { motion } from 'framer-motion';
import { Star, Shirt, Truck } from 'lucide-react';

export default function Hero() {
  const sectionRef     = useRef<HTMLElement>(null);
  const videoWrapRef   = useRef<HTMLDivElement>(null);
  const headlineRef    = useRef<HTMLDivElement>(null);
  const statsRef       = useRef<HTMLDivElement>(null);

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
      gsap.set(statsRef.current,      { opacity: 0, y: 50, pointerEvents: 'none' });

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

      // Stats: fade in and drift up as the headline fades out
      tl.to(statsRef.current, {
        opacity: 1,
        y:       0,
        pointerEvents: 'auto',
        ease:    'none',
      }, 0.2); // slight delay so it starts appearing after scroll begins

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

      {/* ── Animated Scroll Stats & Social Proof ── */}
      <div
        ref={statsRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4"
      >
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mt-20"
        >
          {/* Stat 1 */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400 drop-shadow-md" />
            <span className="text-white font-bold text-center text-sm uppercase tracking-wider">10K+ Satisfied Customers</span>
          </div>
          {/* Stat 2 */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col items-center gap-3">
            <Shirt className="w-8 h-8 text-indigo-400 drop-shadow-md" />
            <span className="text-white font-bold text-center text-sm uppercase tracking-wider">Premium Print Quality</span>
          </div>
          {/* Stat 3 */}
          <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-xl p-6 flex flex-col items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-400 drop-shadow-md" />
            <span className="text-white font-bold text-center text-sm uppercase tracking-wider">Nationwide Delivery</span>
          </div>
        </motion.div>

        {/* Floating Reviews */}
        <div className="flex flex-col sm:flex-row gap-6 mt-12">
          {/* Review 1 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 max-w-xs shadow-2xl cursor-default"
          >
            <div className="flex text-yellow-400 mb-2">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-zinc-300 text-sm italic mb-3">&quot;The fabric quality is unreal. Print hasn&apos;t faded after 10 washes.&quot;</p>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">— Ali T.</p>
          </motion.div>

          {/* Review 2 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-zinc-950/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 max-w-xs shadow-2xl cursor-default sm:mt-8"
          >
            <div className="flex text-yellow-400 mb-2">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <p className="text-zinc-300 text-sm italic mb-3">&quot;Best custom shirts in Pakistan. Fast delivery and premium feel.&quot;</p>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">— Sara M.</p>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none">
        <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-400">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-400 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
