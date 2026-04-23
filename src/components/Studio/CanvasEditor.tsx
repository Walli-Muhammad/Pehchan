'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useCartStore } from '@/store/cart';
import AIPreviewModal from './AIPreviewModal';
import { createBrowserClient } from '@supabase/ssr';

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

const AI_STYLES = [
  { id: 'close-up', label: 'Studio Close-up', prompt: 'High-resolution photorealistic close-up of a heavyweight t-shirt worn by a model. Focus on the upper torso and chest area, 3/4 angle. The fabric texture is clearly visible with natural folds. Soft directional studio lighting enhances the printed design without distortion. 50mm lens, shallow depth of field, 8k quality, realistic skin tones.' },
  { id: 'flat-lay', label: 'Flat Lay (Wood)', prompt: 'Top-down flat lay photography of a folded premium t-shirt resting on a textured, rustic oak wooden table. The custom graphic is sharply visible on the chest. Warm, natural morning sunlight streaming from a nearby window, casting soft, realistic shadows across the fabric and wood. Minimalist aesthetic, 8k resolution, highly detailed cotton texture.' },
  { id: 'urban', label: 'Urban Streetwear', prompt: 'Candid street-style photography of a model wearing a custom t-shirt in a modern urban environment. Blurred concrete and subtle city lights in the background (bokeh effect). The t-shirt graphic is sharp and photorealistic, absorbing the natural shadows and folds of the fabric. Cinematic lighting, 35mm lens, ultra-detailed.' },
  { id: 'hanger', label: 'Hanger (E-com)', prompt: 'Ultra-crisp ecommerce product photography of a t-shirt hanging on a premium minimalist wooden hanger against a seamless neutral grey backdrop. Studio strobe lighting, perfect exposure, sharp edge-to-edge focus. The graphic appears authentically screen-printed onto the high-quality cotton fabric. No artifacts.' },
];


export default function CanvasEditor() {
  const { addItem, openCart } = useCartStore();
  const [selectedModel, setSelectedModel] = useState(MODELS[0].file);
  const [shirtColor, setShirtColor] = useState(SWATCHES[0].hex);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [aiStyle, setAiStyle] = useState(AI_STYLES[0].id);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Wardrobe / Toast State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Supabase browser client for wardrobe saves
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  const handleSaveDesign = async () => {
    if (!stageRef.current) return;

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveMessage('Please sign in to save designs to your Wardrobe.');
      setSaveStatus('error');
      setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 4000);
      // Redirect to login after brief delay
      setTimeout(() => window.location.href = '/login', 1500);
      return;
    }

    setSaveStatus('saving');

    const snapshot = stageRef.current.toDataURL({ mimeType: 'image/jpeg', quality: 0.6, pixelRatio: 0.5 });
    const colorSwatch = SWATCHES.find(s => s.hex === shirtColor);

    const { error } = await supabase.from('saved_designs').insert({
      user_id:        user.id,
      user_email:     user.email,
      image_snapshot: snapshot,
      size:           selectedSize,
      color_label:    colorSwatch?.label ?? null,
      color_hex:      shirtColor,
    });

    if (error) {
      setSaveMessage('Failed to save design. Please try again.');
      setSaveStatus('error');
    } else {
      setSaveMessage('Design saved to your Wardrobe! ✓');
      setSaveStatus('saved');
    }
    setTimeout(() => { setSaveStatus('idle'); setSaveMessage(null); }, 3500);
  };

  const handleGeneratePreview = async () => {
    if (!stageRef.current) return;
    setIsAiModalOpen(true);
    setIsAiLoading(true);
    setAiError(null);
    setAiImageUrl(null);

    try {
      const dataUrl = stageRef.current.toDataURL({
        mimeType: 'image/jpeg',
        pixelRatio: 1.5, 
      });

      const selectedPrompt = AI_STYLES.find((s) => s.id === aiStyle)?.prompt || '';

      const res = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, prompt: selectedPrompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate preview');
      }

      setAiImageUrl(data.imageUrl);
    } catch (err: any) {
      setAiError(err.message || 'An error occurred during generation.');
    } finally {
      setIsAiLoading(false);
    }
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
      <div className="w-full lg:w-[30%] lg:min-w-[320px] max-w-sm flex flex-col gap-8 p-10 border-l border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
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
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900/30 transition-all duration-300 hover:border-indigo-500/50 hover:bg-zinc-900/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
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

            {/* AI Preview Style Selector */}
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">3. PHOTOSHOOT STYLE</label>
              <select
                value={aiStyle}
                onChange={(e) => setAiStyle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-sm text-zinc-300 rounded px-3 py-3 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                {AI_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size Selector */}
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">4. Select Size</label>
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-semibold rounded-full transition-all duration-300 ${
                      selectedSize === size
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 shadow-inner'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-zinc-800/50 flex flex-col gap-4">

           {/* Toast message */}
           {saveMessage && (
             <p className={`text-xs text-center font-medium px-3 py-2 rounded-lg ${
               saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
             }`}>
               {saveMessage}
             </p>
           )}

           {/* Secondary: AI Preview */}
           <button
             onClick={handleGeneratePreview}
             disabled={!uploadedLogo}
             className={`w-full py-3.5 uppercase tracking-[0.15em] text-xs font-bold transition-all duration-300 rounded-lg flex items-center justify-center gap-2 ${
               uploadedLogo
                 ? 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white shadow-lg'
                 : 'bg-zinc-900/50 border border-zinc-800/50 text-zinc-600 cursor-not-allowed'
             }`}
           >
             <span>✨ Generate AI Preview</span>
           </button>

           {/* Ghost: Save to Wardrobe */}
           <button
             onClick={handleSaveDesign}
             disabled={!uploadedLogo || saveStatus === 'saving'}
             className={`w-full py-3 uppercase tracking-[0.15em] text-xs font-bold transition-all duration-300 rounded-lg flex items-center justify-center gap-2 border ${
               uploadedLogo && saveStatus !== 'saving'
                 ? 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                 : 'border-zinc-800/50 text-zinc-700 cursor-not-allowed'
             }`}
           >
             {saveStatus === 'saving' ? (
               <>
                 <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                 </svg>
                 Saving...
               </>
             ) : (
               <><span>🗂</span> Save to Wardrobe</>
             )}
           </button>

           {/* Primary: Add to Cart */}
           <button
             onClick={handleAddToCart}
             disabled={!uploadedLogo || !selectedSize}
             className={`w-full py-4 uppercase tracking-[0.2em] text-sm font-black transition-all duration-300 rounded-lg ${
               uploadedLogo && selectedSize
                 ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02]'
                 : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
             }`}
           >
             ADD TO CART - Rs 5,500
           </button>
        </div>

      </div>

      <AIPreviewModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        isLoading={isAiLoading}
        imageUrl={aiImageUrl}
        error={aiError}
      />
    </div>
  );
}