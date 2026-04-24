'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';

// =============================================
// Types
// =============================================
type Step = 'form' | 'redirecting' | 'error';

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  city: string;
  province: string;
}

const PAKISTANI_PROVINCES = [
  'Punjab', 'Sindh', 'KPK', 'Balochistan',
  'Islamabad (ICT)', 'Gilgit-Baltistan', 'AJK',
];

function formatPrice(n: number) {
  return `Rs ${n.toLocaleString('en-PK')}`;
}

// =============================================
// Field Component
// =============================================
function Field({
  label, id, type = 'text', placeholder, value, onChange, required = true,
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
        {label}{required && <span className="text-indigo-400 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="bg-zinc-800/60 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white placeholder-zinc-600 text-sm px-4 py-3 rounded-xl transition-colors"
      />
    </div>
  );
}

// =============================================
// Checkout Modal
// =============================================
export default function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, getTotalPrice } = useCartStore();
  const [step, setStep]         = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [form, setForm] = useState<FormData>({
    customerName: '', customerEmail: '', customerPhone: '',
    addressLine1: '', city: '', province: 'Punjab',
  });

  // Reset to form state each time modal opens
  useEffect(() => {
    if (isCheckoutOpen) setStep('form');
  }, [isCheckoutOpen]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = isCheckoutOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCheckoutOpen]);

  function setField(key: keyof FormData) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('redirecting');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            podCustomizations: i.podCustomizations,
          })),
          shipping: form,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.checkoutUrl) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStep('error');
        return;
      }

      // Redirect browser to Safepay hosted checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMsg('Network error. Check your connection and try again.');
      setStep('error');
    }
  }

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="checkout-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1100] bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={() => step === 'form' && closeCheckout()}
      >
        <motion.div
          key="checkout-panel"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* =========== FORM STEP =========== */}
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Checkout</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Estimated total: {formatPrice(getTotalPrice() + 250)}
                      <span className="text-zinc-700 ml-1">(incl. Rs 250 shipping)</span>
                    </p>
                  </div>
                  <button onClick={closeCheckout} className="text-zinc-600 hover:text-white transition-colors p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">

                  {/* Shipping Details */}
                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-semibold">Shipping Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full Name" id="name" placeholder="Ahmed Khan" value={form.customerName} onChange={setField('customerName')} />
                      <Field label="Email" id="email" type="email" placeholder="ahmed@example.com" value={form.customerEmail} onChange={setField('customerEmail')} />
                    </div>
                    <Field label="Phone Number" id="phone" type="tel" placeholder="03XX-XXXXXXX" value={form.customerPhone} onChange={setField('customerPhone')} />
                    <Field label="Address" id="address" placeholder="House #, Street, Area" value={form.addressLine1} onChange={setField('addressLine1')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="City" id="city" placeholder="Lahore" value={form.city} onChange={setField('city')} />
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="province" className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
                          Province<span className="text-indigo-400 ml-0.5">*</span>
                        </label>
                        <select
                          id="province"
                          value={form.province}
                          onChange={(e) => setField('province')(e.target.value)}
                          className="bg-zinc-800/60 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white text-sm px-4 py-3 rounded-xl transition-colors"
                        >
                          {PAKISTANI_PROVINCES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Safepay notice */}
                  <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <p className="text-indigo-300 text-xs font-semibold">Secure Payment via Safepay</p>
                      <p className="text-zinc-500 text-[11px] mt-0.5">You&apos;ll be redirected to Safepay&apos;s secure checkout. Supports JazzCash, EasyPaisa, cards &amp; more.</p>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-zinc-100 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Proceed to Payment
                  </button>
                </form>
              </motion.div>
            )}

            {/* =========== REDIRECTING STEP =========== */}
            {step === 'redirecting' && (
              <motion.div
                key="redirecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 px-6 gap-6 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 border-2 border-zinc-700 border-t-indigo-500 rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">Redirecting to Safepay&hellip;</p>
                  <p className="text-zinc-500 text-xs mt-1">Please do not close this window</p>
                </div>
              </motion.div>
            )}

            {/* =========== ERROR STEP =========== */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 px-8 gap-5 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Order Failed</h3>
                <p className="text-zinc-400 text-sm max-w-xs">{errorMsg}</p>
                <button
                  onClick={() => setStep('form')}
                  className="px-8 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-200 transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
