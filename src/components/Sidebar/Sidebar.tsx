'use client';
import { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getCategories, type Category } from '@/actions/admin';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    getCategories().then((data) => {
      if (mounted) setCategories(data);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 z-[1001] w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col shadow-2xl"
          >
            {/* Header / Auth */}
            <div className="flex flex-col gap-4 p-6 border-b border-zinc-900">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-[0.2em] text-white">Menu</span>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-500">Signed in as</span>
                  <span className="text-sm font-medium text-white truncate">{user.email}</span>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-2 uppercase tracking-widest font-semibold"
                  >
                    Account Settings &rarr;
                  </Link>
                </div>
              ) : (
                <div className="mt-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="block w-full py-3 px-4 bg-white text-black text-center text-sm font-semibold uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-colors"
                  >
                    Login / Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto py-6 px-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-4 px-2">
                Shop by Category
              </p>
              <div className="flex flex-col">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={onClose}
                    className="px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 hover:translate-x-1 transition-all rounded-xl"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-900 mt-auto">
              <div className="flex flex-col gap-4">
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  Support
                </Link>
                <Link
                  href="/contact#faq"
                  onClick={onClose}
                  className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  FAQ
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
