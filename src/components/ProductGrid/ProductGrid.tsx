'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '@/components/Interactions/MagneticButton';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/lib/supabase';

// =============================================
// Props — receives live data from Server Component
// =============================================
interface ProductGridProps {
  products: Product[];
}

// =============================================
// Price formatter (PKR)
// =============================================
function formatPrice(amount: number): string {
  return `Rs ${amount.toLocaleString('en-PK')}`;
}

export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { addItem, openCart } = useCartStore();

  const selectedProduct = products.find((p) => p.id === selectedId) ?? null;

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImage: product.image_url,
      // Default synthetic variant for products without explicit DB variants yet.
      // Replace with real variant selection UI in Phase 5.
      variantId: `${product.id}_default`,
      variant: {
        size: null,
        color: null,
        color_hex: null,
        sku: null,
        price_delta: 0,
      },
      basePrice: product.base_price,
      quantity: 1,
      isPod: product.is_pod,
      podCustomizations: null,
    });
    setSelectedId(null);   // Close overlay
    openCart();            // Slide the drawer open
  };

  return (
    <section className="relative w-full bg-zinc-950 px-4 py-24 md:px-12 lg:px-24">

      {/* Section heading */}
      <div className="mb-16 max-w-7xl mx-auto flex items-end justify-between">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
          The Drop
        </h2>
        <span className="text-zinc-500 text-sm tracking-widest uppercase hidden md:block">
          {products.length} pieces
        </span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mx-auto max-w-7xl">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layoutId={`card-${product.id}`}
            onClick={() => setSelectedId(product.id)}
            data-cursor="view"
            className="group relative flex flex-col gap-4 cursor-none"
          >
            <motion.div
              layoutId={`image-container-${product.id}`}
              className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900 rounded-xl"
            >
              <motion.img
                layoutId={`image-${product.id}`}
                src={product.image_url ?? ''}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* POD Badge */}
              {product.is_pod && (
                <span className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Custom
                </span>
              )}
            </motion.div>

            <motion.div
              layoutId={`info-${product.id}`}
              className="flex justify-between items-start px-1"
            >
              <div className="flex flex-col gap-0.5">
                <motion.span
                  layoutId={`category-${product.id}`}
                  className="text-xs uppercase tracking-widest text-zinc-500"
                >
                  {product.category}
                </motion.span>
                <motion.h3
                  layoutId={`title-${product.id}`}
                  className="text-lg font-medium text-zinc-100"
                >
                  {product.title}
                </motion.h3>
              </div>
              <motion.span
                layoutId={`price-${product.id}`}
                className="text-sm font-light text-zinc-400 mt-0.5 shrink-0"
              >
                {formatPrice(product.base_price)}
              </motion.span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* ==============================
          Expanded Product Overlay
      ============================== */}
      <AnimatePresence>
        {selectedId && selectedProduct && (
          <motion.div
            key="overlay-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[990] flex items-center justify-center p-4 md:p-12 lg:p-24 bg-zinc-950/90 backdrop-blur-md"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              layoutId={`card-${selectedProduct.id}`}
              className="relative w-full max-w-5xl h-full md:h-[80vh] flex flex-col md:flex-row bg-zinc-900 overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-5 right-5 z-50 p-2 rounded-full bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                data-cursor="close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image Panel */}
              <motion.div
                layoutId={`image-container-${selectedProduct.id}`}
                className="relative w-full md:w-1/2 h-[45vw] md:h-full bg-zinc-800 shrink-0"
              >
                <motion.img
                  layoutId={`image-${selectedProduct.id}`}
                  src={selectedProduct.image_url ?? ''}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
                {selectedProduct.is_pod && (
                  <span className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full">
                    Print-on-Demand
                  </span>
                )}
              </motion.div>

              {/* Info Panel */}
              <motion.div
                layoutId={`info-${selectedProduct.id}`}
                className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 overflow-y-auto"
              >
                <motion.span
                  layoutId={`category-${selectedProduct.id}`}
                  className="text-sm uppercase tracking-widest text-indigo-400 mb-3 inline-block"
                >
                  {selectedProduct.category}
                </motion.span>

                <motion.h3
                  layoutId={`title-${selectedProduct.id}`}
                  className="text-3xl md:text-4xl font-black text-white mb-3 uppercase tracking-tight leading-tight"
                >
                  {selectedProduct.title}
                </motion.h3>

                <motion.span
                  layoutId={`price-${selectedProduct.id}`}
                  className="text-xl font-light text-zinc-300 mb-6 block"
                >
                  {formatPrice(selectedProduct.base_price)}
                </motion.span>

                {selectedProduct.description && (
                  <p className="text-zinc-400 font-light text-base mb-8 leading-relaxed max-w-md">
                    {selectedProduct.description}
                  </p>
                )}

                {/* POD Customisation Placeholder Notice */}
                {selectedProduct.is_pod && (
                  <div className="mb-8 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                    <p className="text-indigo-300 text-sm font-medium tracking-wide">
                      🎨 This is a Print-on-Demand item.
                    </p>
                    <p className="text-indigo-300/60 text-xs mt-1">
                      Customisation options (name, upload, etc.) will appear here in Phase 5.
                    </p>
                  </div>
                )}

                {/* Add to Cart — Magnetic Pull */}
                <MagneticButton className="self-start mt-auto">
                  <button
                    data-cursor="add"
                    onClick={() => handleAddToCart(selectedProduct)}
                    className="px-10 py-4 bg-white text-black font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-200 active:scale-95 transition-all"
                  >
                    Add to Cart
                  </button>
                </MagneticButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
