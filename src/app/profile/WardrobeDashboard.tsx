'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';

interface SavedDesign {
  id: string;
  image_snapshot: string;
  size: string | null;
  color_label: string | null;
  created_at: string;
}

interface Order {
  id: string;
  created_at: string;
  total_pkr: number;
  status: string;
  customer_name: string;
}

interface Props {
  user: { email: string; name: string | null };
  savedDesigns: SavedDesign[];
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-amber-500/10 text-amber-400 border-amber-500/20',
  payment_received: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing:       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  shipped:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
  refunded:         'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function WardrobeDashboard({ user, savedDesigns, orders }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [designs, setDesigns] = useState<SavedDesign[]>(savedDesigns);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteDesign = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('saved_designs').delete().eq('id', id);
    if (!error) {
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    }
    setDeletingId(null);
  };

  // Derive greeting name from email prefix or full name
  const greeting = user.name ?? user.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-28 pb-20 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Escape hatch */}
        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors mb-8 inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Store
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-1">My Wardrobe</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Hey, <span className="text-indigo-400">{greeting}</span> 👋
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 rounded-full transition-all duration-300"
          >
            {signingOut ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            Sign Out
          </button>
        </div>

        {/* ─── Saved Designs ─── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold uppercase tracking-widest">
              Saved Designs
              <span className="ml-3 text-xs font-normal text-zinc-600">({designs.length})</span>
            </h2>
            <Link
              href="/studio"
              className="text-xs font-semibold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/50 px-3 py-1.5 rounded-full transition-all"
            >
              + New Design
            </Link>
          </div>

          {designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-300 mb-1">Your wardrobe is empty</h3>
              <p className="text-zinc-600 text-sm mb-5">Create a custom design and save it here</p>
              <Link
                href="/studio"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-full transition-all"
              >
                Open Design Studio
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {designs.map((design) => (
                <div
                  key={design.id}
                  className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300"
                >
                  {/* Design Thumbnail */}
                  <div className="aspect-square relative bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={design.image_snapshot}
                      alt="Saved design"
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  {/* Meta */}
                  <div className="p-3 border-t border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <div>
                        {design.size && (
                          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                            Size {design.size}
                            {design.color_label ? ` · ${design.color_label}` : ''}
                          </span>
                        )}
                        <p className="text-[10px] text-zinc-700 mt-0.5">
                          {new Date(design.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        disabled={deletingId === design.id}
                        className="text-zinc-700 hover:text-red-400 transition-colors"
                        title="Delete design"
                      >
                        {deletingId === design.id ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Hover: Add to Cart overlay */}
                  <Link
                    href="/studio"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 px-4 py-2 rounded-full">
                      Recreate in Studio
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Order History ─── */}
        <section>
          <h2 className="text-lg font-bold uppercase tracking-widest mb-6">
            Order History
            <span className="ml-3 text-xs font-normal text-zinc-600">({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">No orders yet. Browse the store to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] ?? STATUS_COLORS['pending']}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-zinc-200">
                      Rs {order.total_pkr.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
