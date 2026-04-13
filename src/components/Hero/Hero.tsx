'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Spline from '@splinetool/react-spline';

// High-quality interactive Spline apparel/T-shirt model
const SPLINE_URL = 'https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const splineContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ── 1. Staggered text reveal on load ──
      const chars = headlineRef.current?.querySelectorAll('.char');

      if (chars?.length) {
        gsap.fromTo(
          chars,
          { opacity: 0, y: 100, rotateX: -80 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.2,
            stagger: 0.035,
            ease: 'expo.out',
            delay: 0.5,
          }
        );
      }

      // ── 2. Spline model boot-up animation ──
      gsap.fromTo(
        splineContainerRef.current,
        { opacity: 0, scale: 0.85, filter: 'blur(20px)' },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 2.2,
          ease: 'power3.out',
          delay: 0.2,
        }
      );

      // ── 3. Scroll-pinned scrub timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%',   // pin for 1.5x viewport height of scrolling
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          // Push the pin spacer BELOW the fixed Navbar (72px)
          pinnedContainer: sectionRef.current ?? undefined,
        },
      });

      // Text floats up and fades out
      tl.to(headlineRef.current, {
        y: -220,
        opacity: 0,
        scale: 0.88,
        ease: 'none',
      }, 0);

      // 3D scene dramatically zooms toward viewer as a "dive in" effect
      tl.to(splineContainerRef.current, {
        scale: 2.8,
        y: 80,
        ease: 'none',
      }, 0);

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Wrap each character in a span for GSAP stagger targeting
  const splitText = (text: string) =>
    text.split('').map((char, i) => (
      <span
        key={i}
        className="char inline-block will-change-transform"
        style={{ transformOrigin: 'top center' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  return (
    <section
      ref={sectionRef}
      // h-screen fills the entire viewport INCLUDING behind the transparent navbar
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-zinc-950"
    >
      {/* ── 3D Spline Backdrop ──
          Positioned absolute, fills the entire section.
          z-0 sits behind the text overlay (z-10).
          pointer-events-auto lets users interact with the 3D model.
      ── */}
      <div
        ref={splineContainerRef}
        className="absolute inset-0 z-0 flex items-center justify-center opacity-0"
        style={{ willChange: 'transform, opacity, filter' }}
      >
        {/* Scale the canvas up so the t-shirt fills the hero viewport */}
        <div className="w-full h-full scale-[1.15] origin-center">
          <Spline scene={SPLINE_URL} />
        </div>
      </div>

      {/* ── Gradient vignette to ground the 3D scene ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-zinc-950/60 via-transparent to-zinc-950/80" />

      {/* ── Typography Overlay ── */}
      <div
        ref={headlineRef}
        className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center px-4"
        style={{ perspective: '1200px' }}
      >
        <h1 className="text-[13vw] sm:text-[10vw] md:text-[9vw] font-black uppercase leading-[0.82] tracking-tighter text-white drop-shadow-2xl">
          {splitText('Built')}
          <br />
          {splitText('Different')}
        </h1>
        <p className="mt-6 md:mt-10 max-w-md text-sm md:text-lg tracking-widest uppercase text-zinc-400 font-light opacity-0 animate-[fadeIn_1s_1.8s_forwards]">
          Premium Streetwear · Made in Pakistan
        </p>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-600">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-zinc-600 to-transparent animate-pulse" />
      </div>
    </section>
  );
}
