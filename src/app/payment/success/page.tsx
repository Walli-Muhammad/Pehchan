'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ConfirmedOrder {
  id: string;
  total_pkr: number;
  status: string;
  created_at: string;
}

type PageState = 'confirming' | 'success' | 'error';

// Inner component uses useSearchParams — must be inside <Suspense>
function PaymentSuccessContent() {
  const searchParams   = useSearchParams();
  // Safepay appends ?beacon=<token> on redirect_url callbacks
  const tracker        = searchParams.get('beacon') ?? searchParams.get('tracker') ?? searchParams.get('reference') ?? '';
  const { clearCart }  = useCartStore();
  const [state, setState]   = useState<PageState>('confirming');
  const [order, setOrder]   = useState<ConfirmedOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const confirmed = useRef(false); // prevent double-fire in dev StrictMode

  useEffect(() => {
    if (!tracker || confirmed.current) return;
    confirmed.current = true;

    async function confirmOrder() {
      try {
        const res = await fetch(`/api/confirm-order?tracker=${encodeURIComponent(tracker)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrorMsg(data.error ?? 'Something went wrong. Your payment may still have been processed — please contact support.');
          setState('error');
          return;
        }

        clearCart(); // wipe the Zustand cart after successful server write
        setOrder(data.order);
        setState('success');
      } catch {
        setErrorMsg('Network error while confirming your order. Please do not pay again — contact support with your tracker.');
        setState('error');
      }
    }

    confirmOrder();
  }, [tracker, clearCart]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 pt-20 pb-20">
      <div className="w-full max-w-md">

        {/* ─── CONFIRMING ─── */}
        {state === 'confirming' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-12 h-12 border-2 border-zinc-800 border-t-indigo-500 rounded-full"
            />
            <div>
              <p className="text-white font-semibold text-lg">Confirming your payment&hellip;</p>
              <p className="text-zinc-500 text-sm mt-1">Please wait, this only takes a moment.</p>
            </div>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {state === 'success' && order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="flex flex-col items-center gap-7 text-center"
          >
            {/* Animated Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2">Payment Successful</p>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Order Placed!</h1>
              <p className="text-zinc-400 text-sm">Thank you for shopping with Pehchan. Your custom tee is on its way! 🎉</p>
            </div>

            {/* Order Summary Card */}
            <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Order ID</span>
                <span className="text-zinc-200 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}…</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Total Paid</span>
                <span className="text-white font-bold">Rs {order.total_pkr.toLocaleString('en-PK')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400 font-semibold capitalize">{order.status.replace('_', ' ')}</span>
              </div>
              {tracker && (
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="text-zinc-500">Safepay Tracker</span>
                  <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[160px]">{tracker}</span>
                </div>
              )}
            </div>

            <p className="text-zinc-600 text-xs">
              A confirmation email has been sent. Your order will be ready in 3–5 business days.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                href="/profile"
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-full text-center transition-all"
              >
                View in Wardrobe
              </Link>
              <Link
                href="/"
                className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm rounded-full text-center transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        )}

        {/* ─── ERROR ─── */}
        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">{errorMsg}</p>
            </div>

            {tracker && (
              <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-4 text-left">
                <p className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Reference for Support</p>
                <p className="text-zinc-300 font-mono text-xs break-all">{tracker}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href="mailto:hello@pehchan.pk"
                className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm rounded-full text-center transition-all"
              >
                Contact Support
              </a>
              <Link
                href="/"
                className="flex-1 py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-full text-center transition-all"
              >
                Back to Store
              </Link>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Default export wraps in Suspense so useSearchParams() is allowed
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
