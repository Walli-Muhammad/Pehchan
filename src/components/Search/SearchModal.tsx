'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/ui';
import { supabase, type Product } from '@/lib/supabase';

export default function SearchModal() {
  const { isSearchOpen, closeSearch, toggleSearch } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      // Small timeout to allow animation to start before capturing focus
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  // Global Cmd/Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape') {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch, closeSearch]);

  // Live search debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('title', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setIsLoading(false);
    };

    const debounceId = setTimeout(fetchResults, 250);
    return () => clearTimeout(debounceId);
  }, [query]);

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSearch}
            className="fixed inset-0 z-[990] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[991] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Search Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-zinc-500 text-lg"
                />
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px] font-medium tracking-widest">
                  ESC
                </div>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {!query.trim() && (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">
                    Search by product title or keyword...
                  </div>
                )}
                
                {isLoading && query.trim() && (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500 flex justify-center items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                    </svg>
                    Searching...
                  </div>
                )}

                {!isLoading && query.trim() && results.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">
                    No products found for &quot;{query}&quot;
                  </div>
                )}

                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      closeSearch();
                      // Next steps: Route to specific product detail view when built
                      // e.g. router.push(`/?product=${product.id}`) or dispatch action
                      document.getElementById(product.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800/50 transition-colors text-left group"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded object-cover border border-zinc-800" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{product.title}</h4>
                      <p className="text-zinc-400 text-sm">Rs {product.base_price.toLocaleString()}</p>
                    </div>
                    {product.is_pod && (
                      <span className="shrink-0 text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
                        POD
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
