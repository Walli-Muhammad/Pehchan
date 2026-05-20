'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '@/components/Interactions/MagneticButton';
import { useCartStore } from '@/store/cart';
import { supabase } from '@/lib/supabase';
import type { Product, Variant } from '@/lib/supabase';

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

// =============================================
// Upgraded Product Card with Hover Slideshow
// =============================================
function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const images =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : product.image_url
      ? [product.image_url]
      : [];

  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 750);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered, images.length]);

  return (
    <motion.div
      layoutId={`card-${product.id}`}
      onClick={onClick}
      data-cursor="view"
      className="group relative flex flex-col gap-4 cursor-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        layoutId={`image-container-${product.id}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900 rounded-xl"
      >
        {images.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
            No Image
          </div>
        ) : (
          images.map((url, idx) => (
            <img
              key={url}
              src={url}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: idx === currentIndex ? 1 : 0,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
                zIndex: idx === currentIndex ? 1 : 0,
              }}
            />
          ))
        )}

        {/* POD Badge */}
        {product.is_pod && (
          <span className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full z-10">
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
  );
}

// =============================================
// Main Grid component
// =============================================
export default function ProductGrid({ products }: ProductGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { addItem, openCart } = useCartStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Variations local states
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedId) ?? null;

  // Reset indices and selections on product change
  useEffect(() => {
    setActiveImageIndex(0);
    if (!selectedId) {
      setVariants([]);
      setSelectedSize(null);
      setSelectedColor(null);
      return;
    }

    setLoadingVariants(true);
    supabase
      .from('variants')
      .select('*')
      .eq('product_id', selectedId)
      .then(({ data, error }) => {
        if (!error && data) {
          setVariants(data);
          
          // Autofill first selections
          const sizes = Array.from(new Set(data.map((v) => v.size).filter(Boolean))) as string[];
          const colors = data.reduce((acc, v) => {
            if (v.color && !acc.includes(v.color)) {
              acc.push(v.color);
            }
            return acc;
          }, [] as string[]);

          if (sizes.length > 0) setSelectedSize(sizes[0]);
          if (colors.length > 0) setSelectedColor(colors[0]);
        }
        setLoadingVariants(false);
      });
  }, [selectedId]);

  // Derived list of unique colors and sizes
  const sizes = Array.from(
    new Set(variants.map((v) => v.size).filter(Boolean))
  ) as string[];

  const colors = variants.reduce((acc, v) => {
    if (v.color && !acc.some((c) => c.color === v.color)) {
      acc.push({ color: v.color, colorHex: v.color_hex });
    }
    return acc;
  }, [] as Array<{ color: string; colorHex: string | null }>);

  // Find matching variant
  const matchingVariant = variants.find(
    (v) =>
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor)
  );

  const finalPrice =
    selectedProduct
      ? selectedProduct.base_price + (matchingVariant?.price_delta ?? 0)
      : 0;

  const currentImages = selectedProduct
    ? selectedProduct.image_urls && selectedProduct.image_urls.length > 0
      ? selectedProduct.image_urls
      : selectedProduct.image_url
      ? [selectedProduct.image_url]
      : []
    : [];

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      productTitle: product.title,
      productImage: currentImages[activeImageIndex] ?? product.image_url,
      variantId: matchingVariant?.id ?? `${product.id}_default`,
      variant: {
        size: matchingVariant?.size ?? null,
        color: matchingVariant?.color ?? null,
        color_hex: matchingVariant?.color_hex ?? null,
        sku: matchingVariant?.sku ?? null,
        price_delta: matchingVariant?.price_delta ?? 0,
      },
      basePrice: product.base_price,
      quantity: 1,
      isPod: product.is_pod,
      podCustomizations: null,
    });
    setSelectedId(null); // Close overlay
    openCart(); // Slide drawer open
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
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => setSelectedId(product.id)}
          />
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

              {/* Upgraded Image Panel with Thumbnail Carousel */}
              <motion.div
                layoutId={`image-container-${selectedProduct.id}`}
                className="relative w-full md:w-1/2 h-[45vw] md:h-full bg-zinc-850 shrink-0 flex flex-col justify-between"
              >
                <div className="relative w-full flex-1 overflow-hidden">
                  {currentImages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-900">
                      No Image Available
                    </div>
                  ) : (
                    <motion.img
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={currentImages[activeImageIndex]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}
                  {selectedProduct.is_pod && (
                    <span className="absolute top-4 left-4 bg-indigo-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full z-10">
                      Print-on-Demand
                    </span>
                  )}
                </div>

                {/* Thumbnails Row */}
                {currentImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 scrollbar-none">
                    {currentImages.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === activeImageIndex
                            ? 'border-indigo-500 scale-105 shadow-md'
                            : 'border-zinc-850 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
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
                  {formatPrice(finalPrice)}
                </motion.span>

                {selectedProduct.description && (
                  <p className="text-zinc-400 font-light text-base mb-8 leading-relaxed max-w-md">
                    {selectedProduct.description}
                  </p>
                )}

                {/* Live Variant Selector UI */}
                {!loadingVariants && (
                  <div className="flex flex-col gap-5 mb-8">
                    {/* Sizes Selection */}
                    {sizes.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2.5">
                          Select Size
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`min-w-[40px] h-10 px-3 flex items-center justify-center rounded-xl border font-bold text-xs uppercase transition-all ${
                                selectedSize === size
                                  ? 'bg-white text-black border-white scale-105 shadow-md'
                                  : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 bg-zinc-950/20'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Colors Selection */}
                    {colors.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2.5">
                          Select Color
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {colors.map((c) => (
                            <button
                              key={c.color}
                              onClick={() => setSelectedColor(c.color)}
                              className={`relative flex items-center justify-center rounded-full transition-all ${
                                selectedColor === c.color
                                  ? 'scale-110'
                                  : 'opacity-65 hover:opacity-100'
                              }`}
                              title={c.color}
                            >
                              {c.colorHex ? (
                                <span
                                  className="w-7 h-7 rounded-full border border-white/25 shadow-inner"
                                  style={{ backgroundColor: c.colorHex }}
                                />
                              ) : (
                                <span className="px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-400 uppercase bg-zinc-950/20">
                                  {c.color}
                                </span>
                              )}
                              {selectedColor === c.color && (
                                <span className="absolute inset-0 rounded-full border-2 border-indigo-500 -m-[3px]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {loadingVariants && (
                  <div className="flex gap-2 items-center text-xs text-zinc-500 mb-8 py-2">
                    <svg className="animate-spin w-4 h-4 text-zinc-500" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Loading variations...
                  </div>
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
