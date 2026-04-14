'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function Navbar() {
  const { toggleCart, getTotalItems } = useCartStore();
  const { toggleSearch } = useUIStore();
  const totalItems = getTotalItems();

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    
    // Check if scrolled past top to add background
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    // Hide on scroll down, show on scroll up
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-150%", opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-6 left-0 right-0 z-[980] flex justify-center px-4 pointer-events-none"
    >
      <div 
        className={`pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500 ease-out border ${
          isScrolled 
            ? 'w-full max-w-2xl bg-[#09090b]/70 backdrop-blur-md border-white/10 shadow-2xl' 
            : 'w-full max-w-7xl bg-transparent border-transparent'
        }`}
      >
        {/* Brand */}
        <a
          href="/"
          className={`font-black uppercase tracking-[0.2em] transition-all ${
            isScrolled ? 'text-sm' : 'text-lg md:text-xl text-white drop-shadow-lg'
          }`}
        >
          Pehchan
        </a>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* CmdK Search Trigger */}
          <button
            onClick={toggleSearch}
            data-cursor="search"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
              isScrolled ? 'hover:bg-white/10 text-zinc-300 hover:text-white' : 'text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="hidden sm:flex items-center gap-1 opacity-70">
              <span className="text-[10px] font-bold tracking-widest uppercase">Cmd</span>
              <span className="text-[10px] font-bold">K</span>
            </div>
          </button>

          <div className="w-px h-4 bg-white/20 mx-1 hidden sm:block" />

          {/* Cart button */}
          <button
            onClick={toggleCart}
            aria-label="Open cart"
            data-cursor="cart"
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors group ${
              isScrolled ? 'hover:bg-white/10 text-zinc-300 hover:text-white' : 'text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm'
            }`}
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs font-semibold tracking-wider hidden sm:block uppercase">
              Cart
            </span>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-1 -right-1 sm:relative sm:top-auto sm:right-auto bg-indigo-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center tabular-nums"
              >
                {totalItems}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
