'use client';

import { useCartStore } from '@/store/cart';

export default function CartToggle() {
  const { toggleCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <button
      onClick={toggleCart}
      aria-label="Open cart"
      className="fixed top-6 right-6 z-[980] flex items-center gap-2 bg-zinc-900/80 backdrop-blur border border-zinc-700/50 text-white px-4 py-2.5 rounded-full hover:bg-zinc-800 transition-all"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <span className="text-sm font-medium tracking-wide">Cart</span>
      {totalItems > 0 && (
        <span className="bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
          {totalItems}
        </span>
      )}
    </button>
  );
}
