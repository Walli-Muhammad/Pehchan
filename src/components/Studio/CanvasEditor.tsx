'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/store/cart';

// Next.js dynamic import (ssr: false) is CRITICAL to prevent 'window is not defined'
// hydration crashes from the react-konva / konva module which rely on canvas/DOM.
const DynamicCanvasLayer = dynamic(() => import('./KonvaCanvas'), {
  ssr: false,
  loading: () => <div className="animate-pulse w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">Loading Studio...</div>
});

const MODELS = [
  { id: 'male', label: 'Male Front', file: '/mock-front-male.jpg' },
  { id: 'female', label: 'Female Front', file: '/mock-front-female.jpg' },
  { id: 'back', label: 'Back View', file: '/mock-back.jpg' },
];

const SWATCHES = [
  { id: 'white', label: 'White', hex: '#ffffff' },
  { id: 'black', label: 'Black', hex: '#151515' },
  { id: 'navy', label: 'Navy', hex: '#1e293b' },
];

const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

export default function CanvasEditor() {
  const { addItem, openCart } = useCartStore();
  const [selectedModel, setSelectedModel] = useState(MODELS[0].file);
  const [shirtColor, setShirtColor] = useState(SWATCHES[0].hex);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Responsive canvas sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = () => {
    if (!uploadedLogo || !selectedSize || !stageRef.current) return;

    // Generate a tiny JPEG thumbnail for the cart preview.
    // High pixelRatio (1.5) PNG was ~2-4 MB as base64 — one item fills 
    // localStorage's entire ~5 MB quota and throws QuotaExceededError.
    // At pixelRatio 0.2 + JPEG quality 0.5, the snapshot is ~15-40 KB.
    const dataUrl = stageRef.current.toDataURL({
      mimeType: 'image/jpeg',
      quality: 0.5,
      pixelRatio: 0.2,
    });
    
    // Add custom product to cart
    addItem({
      productId: `custom-pod-${Date.now()}`,
      productTitle: "Custom Pehchan Tee",
      productImage: dataUrl,
      variantId: `custom-pod-variant-${selectedSize}`,
      variant: {
        size: selectedSize,
        color: SWATCHES.find(s => s.hex === shirtColor)?.label || 'Custom',
        color_hex: shirtColor,
        sku: 'CUSTOM-POD',
        price_delta: 0,
      },
      basePrice: 5500,
      quantity: 1,
      podCustomizations: { Type: "Custom POD", Size: selectedSize, Color: SWATCHES.find(s => s.hex === shirtColor)?.label || 'Custom' },
      isPod: true,
    });

    openCart();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#09090b] text-white pt-20">
      
      {/* 70% Left: Canvas container */}
      <div 
        ref={containerRef} 
        className="flex-grow lg:w-[70%] h-full relative overflow-hidden flex items-center justify-center bg-zinc-950"
      >
        <DynamicCanvasLayer 
          stageRef={stageRef}
          modelImageSrc={selectedModel}
          shirtColor={shirtColor}
          uploadedLogo={uploadedLogo}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      {/* 30% Right: Controls pane */}
      <div className="w-full lg:w-[30%] lg:min-w-[320px] max-w-sm flex flex-col gap-8 p-8 border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-xl overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">Design Studio</h2>
          
          <div className="flex flex-col gap-6">
            
            {/* Model Selector */}
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">1. Select View</label>
              <div className="grid grid-cols-2 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.file)}
                    className={`px-3 py-2 text-sm rounded ${
                      selectedModel === m.file
                        ? 'bg-white text-black font-semibold'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    } transition-colors uppercase tracking-wider text-xs`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>


            {/* Logo Upload */}
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">2. Upload Logo</label>
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded bg-zinc-900 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-zinc-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold">Click to upload</span> PNG</p>
                  <p className="text-xs text-zinc-500">Transparent background recommended</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png, image/jpeg" 
                  onChange={handleFileUpload}
                />
              </label>
              {uploadedLogo && (
                <button
                  onClick={() => setUploadedLogo(null)}
                  className="mt-3 text-xs uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear Design
                </button>
              )}
            </div>

            {/* Size Selector */}
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">3. Select Size</label>
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-semibold rounded transition-colors ${
                      selectedSize === size
                        ? 'bg-white text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800">
           <button 
             onClick={handleAddToCart}
             disabled={!uploadedLogo || !selectedSize}
             className={`w-full py-4 uppercase tracking-[0.2em] text-sm font-bold transition-all ${
               uploadedLogo && selectedSize
                 ? 'bg-white text-black hover:bg-zinc-200 shadow-xl' 
                 : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
             }`}
           >
             ADD TO CART - Rs 5,500
           </button>
        </div>

      </div>
    </div>
  );
}