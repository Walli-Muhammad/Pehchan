'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';

// =============================================
// Types
// =============================================
type Gateway = 'jazzCash' | 'easyPaisa' | 'xpay';
type Step = 'form' | 'processing' | 'success' | 'error';

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

const GATEWAYS: { id: Gateway; label: string; color: string }[] = [
  { id: 'jazzCash',  label: 'JazzCash',  color: '#E6002D' },
  { id: 'easyPaisa', label: 'EasyPaisa', color: '#40B63D' },
  { id: 'xpay',      label: 'XPay',      color: '#6366F1' },
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
  const { isCheckoutOpen, closeCheckout, clearCart, items, getTotalPrice } = useCartStore();
  const [step, setStep]               = useState<Step>('form');
  const [gateway, setGateway]         = useState<Gateway>('jazzCash');
  const [orderId, setOrderId]         = useState<string>('');
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [verifiedTotal, setVerifiedTotal] = useState<number>(0);

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
    setStep('processing');

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
          gateway,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStep('error');
        return;
      }

      setOrderId(data.orderId);
      setVerifiedTotal(data.verifiedTotal);
      clearCart();
      setStep('success');
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

                  {/* Payment Gateway */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-semibold">Payment Method</p>
                    <div className="flex gap-3">
                      {GATEWAYS.map((gw) => (
                        <button
                          key={gw.id}
                          type="button"
                          onClick={() => setGateway(gw.id)}
                          className={`flex-1 py-3 px-2 rounded-xl border text-sm font-semibold transition-all ${
                            gateway === gw.id
                              ? 'border-indigo-500 bg-indigo-500/10 text-white'
                              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                          }`}
                          style={gateway === gw.id ? { borderColor: gw.color, color: gw.color, backgroundColor: `${gw.color}15` } : {}}
                        >
                          {gw.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-zinc-600 text-xs">
                      For MVP: payment is simulated. Real {GATEWAYS.find(g => g.id === gateway)?.label} SDK integration goes here.
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-zinc-100 active:scale-[0.98] transition-all mt-2"
                  >
                    Place Order
                  </button>
                </form>
              </motion.div>
            )}

            {/* =========== PROCESSING STEP =========== */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 px-6 gap-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 border-2 border-zinc-700 border-t-indigo-500 rounded-full"
                />
                <p className="text-zinc-400 text-sm tracking-wide">Processing your order…</p>
              </motion.div>
            )}

            {/* =========== SUCCESS STEP =========== */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="flex flex-col items-center justify-center py-16 px-8 gap-5 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Order Placed!</h3>
                  <p className="text-zinc-400 text-sm">Thank you for your order.</p>
                </div>

                <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Order ID</span>
                    <span className="text-zinc-300 font-mono text-xs">{orderId.slice(0, 8).toUpperCase()}…</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Total Charged</span>
                    <span className="text-white font-semibold">{formatPrice(verifiedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Gateway</span>
                    <span className="text-zinc-300 capitalize">{gateway}</span>
                  </div>
                </div>

                <p className="text-zinc-600 text-xs max-w-xs">
                  A confirmation will be sent to <span className="text-zinc-400">{form.customerEmail}</span>. We&apos;ll begin processing your order shortly.
                </p>

                <button
                  onClick={closeCheckout}
                  className="px-8 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-200 transition-all mt-2"
                >
                  Continue Shopping
                </button>
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
