'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Spline from '@splinetool/react-spline';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const splineContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Escape early if SSR
    if (typeof window === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Using gsap.context for easy cleanup (critical in React strict-mode)
    const ctx = gsap.context(() => {
      // 1. Initial Load Stagger Animation for the Headline
      const chars = headlineRef.current?.querySelectorAll('.char');
      
      if (chars) {
        gsap.fromTo(
          chars,
          { opacity: 0, y: 120, rotateX: -90 },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 1.4,
            stagger: 0.04,
            ease: 'expo.out',
            delay: 0.3,
          }
        );
      }

      // 2. Fade in and Scale the Spline container to simulate "boot up"
      gsap.fromTo(
        splineContainerRef.current,
        { opacity: 0, scale: 0.8 },
        { 
            opacity: 1, 
            scale: 1, 
            duration: 2, 
            ease: 'power3.out', 
            delay: 0.8 
        }
      );

      // 3. Scroll-Linked Timeline Setup
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%', // Keep it pinned for 1.5x viewport height
          scrub: 1.5,    // Smoother Scrub value
          pin: true,     // Locks it in place
          anticipatePin: 1, // Prevents jitters on enter 
        },
      });

      // Immersive scrub-out for text
      tl.to(headlineRef.current, {
        y: -250,
        opacity: 0,
        scale: 0.85,
      }, 0);

      // Immersive "dive-in" effect for the 3D scene 
      tl.to(splineContainerRef.current, {
        y: 100,      
        scale: 2.5,  // Dramatic zoom 
      }, 0);

    }, sectionRef);

    // Clean up timeline and ScrollTriggers on unmount
    return () => ctx.revert();
  }, []);

  // Simple Utility to wrap letters for the GSAP stagger
  const splitText = (text: string) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="char inline-block will-change-transform"
        style={{ transformOrigin: 'top center' }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-zinc-950"
    >
      {/* 3D Spline Interactive Backdrop */}
      <div
        ref={splineContainerRef}
        className="absolute inset-0 -z-10 flex items-center justify-center opacity-0 pointer-events-auto mix-blend-screen"
      >
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
      </div>

      {/* Typography Overlay */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center justify-center text-center">
        <h1
          ref={headlineRef}
          className="overflow-hidden text-[12vw] font-black uppercase leading-[0.8] tracking-tighter text-white sm:text-[10vw]"
          style={{ perspective: '1000px' }}
        >
          {splitText('Built Different')}
        </h1>
        <p className="mt-8 max-w-lg tracking-wide text-zinc-400 font-light px-4 opacity-80 md:text-xl">
          An interactive e-commerce experience crafted with next-level precision.
        </p>
      </div>
    </section>
  );
}
