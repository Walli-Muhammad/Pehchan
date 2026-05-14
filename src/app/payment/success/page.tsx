'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

function SuccessContent() {
  const searchParams = useSearchParams();
  const shortId      = searchParams.get('id');
  const method       = searchParams.get('method'); // 'cod' | 'whatsapp'
  const isWhatsApp   = method === 'whatsapp';

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="flex flex-col items-center gap-7 text-center w-full max-w-md"
      >
        {/* Icon */}
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
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2">Order Confirmed</p>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            {isWhatsApp ? 'Almost Done!' : 'Order Placed!'}
          </h1>
          {shortId && (
            <p className="text-zinc-500 text-sm mt-1">
              Reference: <span className="text-zinc-300 font-mono">#{shortId.toUpperCase()}</span>
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-sm text-left flex flex-col gap-3">
          {isWhatsApp ? (
            <>
              <p className="text-zinc-300 font-semibold">What happens next:</p>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">1.</span>
                <p className="text-zinc-400">You should see WhatsApp open with a pre-filled message. <strong className="text-white">Send it to us.</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">2.</span>
                <p className="text-zinc-400">We&apos;ll reply with a <strong className="text-white">JazzCash / EasyPaisa payment request</strong> within minutes.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">3.</span>
                <p className="text-zinc-400">Once payment is confirmed, your order goes into production. <strong className="text-white">3–5 business days</strong> to your door.</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-zinc-300 font-semibold">What happens next:</p>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">1.</span>
                <p className="text-zinc-400">Our team will <strong className="text-white">confirm your order via WhatsApp</strong> before dispatch.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">2.</span>
                <p className="text-zinc-400">Your order is packed and dispatched within <strong className="text-white">3–5 business days.</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold shrink-0">3.</span>
                <p className="text-zinc-400"><strong className="text-white">Pay the rider</strong> when your order arrives. Easy!</p>
              </div>
            </>
          )}
        </div>

        <p className="text-zinc-600 text-xs">
          A confirmation email has been sent. Questions?{' '}
          <a href="https://wa.me/923291881033" className="text-indigo-400 hover:underline">WhatsApp us</a>
          {' '}or{' '}
          <a href="mailto:Pehchan.help@gmail.com" className="text-indigo-400 hover:underline">email us</a>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/"
            className="flex-1 py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-full text-center transition-all">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
