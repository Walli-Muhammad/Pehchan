'use client';

import { useCartStore } from '@/store/cart';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Navbar() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  const { scrollY } = useScroll();
  // Subtly increase background opacity on scroll
  const bgOpacity = useTransform(scrollY, [0, 80], [0.3, 0.75]);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[980] backdrop-blur-md border-b border-white/5"
      style={{ backgroundColor: `rgba(9, 9, 11, ${bgOpacity})` } as React.CSSProperties}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-10">

        {/* Brand */}
        <a
          href="/"
          className="text-white font-black uppercase tracking-[0.2em] text-lg md:text-xl select-none"
        >
          Pehchan
        </a>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Cart button */}
          <button
            onClick={toggleCart}
            aria-label="Open cart"
            data-cursor="cart"
            className="relative flex items-center gap-2.5 text-zinc-300 hover:text-white transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-sm font-medium tracking-wider hidden sm:block">
              Cart
            </span>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-2 -right-2 sm:relative sm:top-auto sm:right-auto bg-indigo-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center tabular-nums"
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
