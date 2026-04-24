"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ConfirmedOrder {
  id: string;
  total_pkr: number;
  status: string;
  created_at: string;
}

// ─── Inner component — must live inside <Suspense> ────────────────────────────
function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("beacon") || searchParams.get("tracker");

  console.log("[SuccessUI] Mounted. Token:", token);
  console.log("[SuccessUI] All URL params:", Object.fromEntries(searchParams.entries()));

  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      console.error("[SuccessUI] No token found in URL — cannot confirm order.");
      setErrorMsg("No payment reference found. If you completed payment, contact support.");
      setStatus("error");
      return;
    }

    console.log("[SuccessUI] Calling /api/confirm-order?beacon=" + token);

    fetch("/api/confirm-order?beacon=" + encodeURIComponent(token))
      .then((res) => {
        console.log("[SuccessUI] fetch response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("[SuccessUI] confirm-order response body:", data);
        if (data.success) {
          clearCart();
          setOrder(data.order);
          setStatus("success");
        } else {
          setErrorMsg(data.error || "Order confirmation failed.");
          setStatus("error");
        }
      })
      .catch((err) => {
        console.error("[SuccessUI] fetch error:", err);
        setErrorMsg("Network error. Do not pay again — contact support with token: " + token);
        setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 text-center px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-12 h-12 border-2 border-zinc-800 border-t-indigo-500 rounded-full"
        />
        <div>
          <p className="text-white font-semibold text-lg">Confirming your payment&hellip;</p>
          <p className="text-zinc-500 text-sm mt-1">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 w-full max-w-md"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">{errorMsg}</p>
          </div>
          {token && (
            <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-5 py-4 text-left">
              <p className="text-xs uppercase tracking-widest text-zinc-600 mb-1">Reference for Support</p>
              <p className="text-zinc-300 font-mono text-xs break-all">{token}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <a href="mailto:hello@pehchan.pk"
              className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-sm rounded-full text-center transition-all">
              Contact Support
            </a>
            <Link href="/"
              className="flex-1 py-3.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm rounded-full text-center transition-all">
              Back to Store
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center px-4 pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="flex flex-col items-center gap-7 text-center w-full max-w-md"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
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

        {/* Order summary card */}
        {order && (
          <div className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Order ID</span>
              <span className="text-zinc-200 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}…</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Total Paid</span>
              <span className="text-white font-bold">Rs {order.total_pkr.toLocaleString("en-PK")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="text-emerald-400 font-semibold capitalize">{order.status.replace("_", " ")}</span>
            </div>
            {token && (
              <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                <span className="text-zinc-500">Safepay Beacon</span>
                <span className="text-zinc-500 font-mono text-[11px] truncate max-w-[160px]">{token}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-zinc-600 text-xs">
          A confirmation email has been sent. Your order will be ready in 3–5 business days.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/profile"
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-full text-center transition-all">
            View in Wardrobe
          </Link>
          <Link href="/"
            className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm rounded-full text-center transition-all">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Default export — wraps SuccessContent in Suspense ───────────────────────
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
