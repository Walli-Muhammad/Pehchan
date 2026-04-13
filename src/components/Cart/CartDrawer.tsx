'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import type { CartItem } from '@/store/cart';

// =============================================
// Price formatter
// =============================================
function formatPrice(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK')}`;
}

// =============================================
// Individual Cart Line Item
// =============================================
function CartLineItem({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCartStore();
  const unitPrice = item.basePrice + item.variant.price_delta;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex gap-4 py-5 border-b border-zinc-800 last:border-0"
    >
      {/* Thumbnail */}
      <div className="w-20 h-24 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
        {item.productImage && (
          <img
            src={item.productImage}
            alt={item.productTitle}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
            {item.productTitle}
          </h4>
          <button
            onClick={() => removeItem(item.lineItemId)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
            aria-label="Remove item"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Variant info */}
        {(item.variant.size || item.variant.color) && (
          <p className="text-xs text-zinc-500">
            {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* POD Badge */}
        {item.isPod && (
          <span className="self-start text-[10px] font-semibold uppercase tracking-widest bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
            Custom Print
          </span>
        )}

        {/* Quantity + Price row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-1">
            <button
              onClick={() => updateQuantity(item.lineItemId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-700"
            >
              −
            </button>
            <span className="text-sm text-zinc-200 w-4 text-center tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.lineItemId, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-700"
            >
              +
            </button>
          </div>
          <span className="text-sm font-medium text-zinc-200 tabular-nums">
            {formatPrice(unitPrice * item.quantity)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================
// Cart Drawer
// =============================================
export default function CartDrawer() {
  const { isOpen, closeCart, items, getTotalItems, getTotalPrice, clearCart } = useCartStore();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Lock body scroll while drawer is open (Lenis-safe: we target the body attribute)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[1000] bg-zinc-950/70 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer Panel */}
          <motion.aside
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 z-[1001] w-full max-w-md bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                  Your Cart
                </h2>
                {totalItems > 0 && (
                  <span className="bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                aria-label="Close cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 py-24 text-zinc-600"
                  >
                    <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-sm tracking-wide">Your cart is empty.</p>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <CartLineItem key={item.lineItemId} item={item} />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-zinc-800 px-6 py-6 flex flex-col gap-4">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Subtotal</span>
                  <span className="text-white font-semibold tabular-nums">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <p className="text-zinc-600 text-xs">
                  Shipping & taxes calculated at checkout.
                </p>

                {/* Checkout CTA */}
                <button
                  className="w-full py-4 bg-white text-black font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-200 active:scale-[0.98] transition-all"
                  onClick={() => useCartStore.getState().openCheckout()}
                >
                  Checkout
                </button>

                {/* Clear */}
                <button
                  onClick={clearCart}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-center"
                >
                  Clear cart
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
