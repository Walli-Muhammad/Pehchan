'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';

type Step = 'form' | 'processing' | 'success_cod' | 'success_whatsapp' | 'error';
type PaymentMethod = 'cod' | 'whatsapp';

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

export default function CheckoutModal() {
  const { isCheckoutOpen, closeCheckout, items, getTotalPrice, clearCart } = useCartStore();
  const [step, setStep]               = useState<Step>('form');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [errorMsg, setErrorMsg]       = useState('');
  const [orderResult, setOrderResult] = useState<{ shortId: string; total: number; whatsappUrl: string | null } | null>(null);

  const [form, setForm] = useState<FormData>({
    customerName: '', customerEmail: '', customerPhone: '',
    addressLine1: '', city: '', province: 'Punjab',
  });

  useEffect(() => {
    if (isCheckoutOpen) { setStep('form'); setOrderResult(null); }
  }, [isCheckoutOpen]);

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
          paymentMethod,
          shipping: form,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStep('error');
        return;
      }

      clearCart();
      setOrderResult({ shortId: data.shortId, total: data.totalAmount, whatsappUrl: data.whatsappUrl });

      if (paymentMethod === 'whatsapp') {
        // Open WhatsApp in new tab
        if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank');
        setStep('success_whatsapp');
      } else {
        setStep('success_cod');
      }

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
          <AnimatePresence mode="wait">

            {/* ─── FORM STEP ─────────────────────────────────────────────────── */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Checkout</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Total: {formatPrice(getTotalPrice() + 250)}
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

                  {/* ── Payment Method Selector ─────────────────────────────── */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-semibold">Payment Method</p>

                    {/* COD */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'cod'
                          ? 'border-indigo-500 bg-indigo-500/5'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'cod' ? 'border-indigo-500' : 'border-zinc-600'
                      }`}>
                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold flex items-center gap-2">
                          <span>💵</span> Cash on Delivery
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">Pay when your order arrives. Our team will confirm via WhatsApp before dispatch.</p>
                      </div>
                    </button>

                    {/* WhatsApp / JazzCash / EasyPaisa */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('whatsapp')}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'whatsapp' ? 'border-emerald-500' : 'border-zinc-600'
                      }`}>
                        {paymentMethod === 'whatsapp' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold flex items-center gap-2">
                          <span>💬</span> JazzCash / EasyPaisa
                        </p>
                        <p className="text-zinc-500 text-xs mt-0.5">After placing your order, WhatsApp will open with a pre-filled message. We&apos;ll send you a payment request instantly.</p>
                      </div>
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-zinc-100 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2"
                  >
                    {paymentMethod === 'cod' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Place Order (COD)
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Place & Open WhatsApp
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ─── PROCESSING ────────────────────────────────────────────────── */}
            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 px-6 gap-6 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 border-2 border-zinc-700 border-t-indigo-500 rounded-full"
                />
                <div>
                  <p className="text-white font-semibold">Placing your order&hellip;</p>
                  <p className="text-zinc-500 text-xs mt-1">Please do not close this window</p>
                </div>
              </motion.div>
            )}

            {/* ─── SUCCESS: COD ──────────────────────────────────────────────── */}
            {step === 'success_cod' && (
              <motion.div key="success_cod" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 px-8 gap-5 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-1">Order Placed!</p>
                  <h3 className="text-2xl font-black text-white">Cash on Delivery</h3>
                  {orderResult && (
                    <p className="text-zinc-400 text-sm mt-2">Order <span className="text-white font-mono">#{orderResult.shortId}</span> · {formatPrice(orderResult.total)}</p>
                  )}
                  <p className="text-zinc-500 text-xs mt-3 max-w-xs">
                    Our team will confirm your order via WhatsApp before dispatch. Check your email for a receipt.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={closeCheckout}
                    className="flex-1 py-3.5 bg-white text-black font-semibold text-sm rounded-full hover:bg-zinc-200 transition-all">
                    Continue Shopping
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── SUCCESS: WhatsApp ─────────────────────────────────────────── */}
            {step === 'success_whatsapp' && (
              <motion.div key="success_whatsapp" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 px-8 gap-5 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </motion.div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-400 mb-1">Order Placed!</p>
                  <h3 className="text-2xl font-black text-white">WhatsApp Opened</h3>
                  {orderResult && (
                    <p className="text-zinc-400 text-sm mt-2">Order <span className="text-white font-mono">#{orderResult.shortId}</span> · {formatPrice(orderResult.total)}</p>
                  )}
                  <p className="text-zinc-500 text-xs mt-3 max-w-xs">
                    A WhatsApp message has been opened with your order details. Send it to us and we&apos;ll reply with a JazzCash/EasyPaisa payment request.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  {orderResult?.whatsappUrl && (
                    <a href={orderResult.whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded-full text-center transition-all flex items-center justify-center gap-2">
                      Open WhatsApp Again
                    </a>
                  )}
                  <button onClick={closeCheckout}
                    className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm rounded-full transition-all">
                    Close
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── ERROR ─────────────────────────────────────────────────────── */}
            {step === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 px-8 gap-5 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Order Failed</h3>
                <p className="text-zinc-400 text-sm max-w-xs">{errorMsg}</p>
                <button onClick={() => setStep('form')}
                  className="px-8 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-200 transition-all">
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
