'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const { toggleCart, getTotalItems } = useCartStore();
  const { toggleSearch } = useUIStore();
  const totalItems = getTotalItems();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wardrobeToast, setWardrobeToast] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMounted(true);
    // Get initial session
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

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

        {/* Center Links */}
        <div className="hidden sm:flex items-center gap-6">
          <a
            href="/studio"
            className={`text-sm font-semibold tracking-widest uppercase transition-colors ${
              isScrolled ? 'text-zinc-400 hover:text-white' : 'text-white/80 hover:text-white drop-shadow-md'
            }`}
          >
            PRINT ON DEMAND
          </a>
        </div>

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

          {/* Auth Controls — Wardrobe always visible, Sign Out auth-only */}
          {isMounted && (
            <>
              {user ? (
                // Logged-in: direct link
                <a
                  href="/profile"
                  className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                    isScrolled ? 'text-zinc-400 hover:text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Wardrobe
                </a>
              ) : (
                // Guest: toast + redirect to login
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => {
                      setWardrobeToast(true);
                      setTimeout(() => setWardrobeToast(false), 2500);
                      setTimeout(() => router.push('/login'), 800);
                    }}
                    className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                      isScrolled ? 'text-zinc-400 hover:text-white' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Wardrobe
                  </button>
                  {wardrobeToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-8 right-0 whitespace-nowrap bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] px-3 py-1.5 rounded-lg shadow-xl z-50"
                    >
                      Please sign in to access your Wardrobe
                    </motion.div>
                  )}
                </div>
              )}

              {/* Sign Out — auth-only */}
              {user && (
                <button
                  onClick={handleSignOut}
                  className={`hidden sm:block text-xs font-semibold uppercase tracking-widest transition-colors ${
                    isScrolled ? 'text-zinc-600 hover:text-red-400' : 'text-white/50 hover:text-red-300'
                  }`}
                >
                  Sign Out
                </button>
              )}
            </>
          )}

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
            {isMounted && totalItems > 0 && (
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
