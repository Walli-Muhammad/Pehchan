import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface AIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
}

export default function AIPreviewModal({
  isOpen,
  onClose,
  isLoading,
  imageUrl,
  error,
}: AIPreviewModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-4xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col items-center justify-center relative min-h-[50vh]"
            >
              {/* Close Button */}
              {!isLoading && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900/80 p-2 rounded-full transition-colors z-10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Status Rendering */}
              <div className="w-full h-full flex flex-col items-center justify-center p-6">
                {isLoading && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-t-2 border-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <p className="text-zinc-300 font-medium tracking-wide animate-pulse">
                      Rendering photorealistic preview...
                    </p>
                  </div>
                )}

                {error && !isLoading && (
                  <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex flex-col items-center justify-center text-red-500">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-400 font-medium">{error}</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-zinc-900 text-zinc-300 rounded hover:bg-zinc-800 transition-colors mt-2"
                    >
                      Close
                    </button>
                  </div>
                )}

                {imageUrl && !isLoading && !error && (
                  <div className="w-full flex-grow flex flex-col items-center">
                    <div className="w-full h-[60vh] relative mb-6">
                      <Image
                        src={imageUrl}
                        alt="AI Generated Preview"
                        fill
                        className="object-contain rounded-lg"
                        unoptimized
                      />
                    </div>
                    <div className="flex space-x-4">
                      {/* You can optionally add a download button here later */}
                      <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 transition-colors"
                      >
                        BACK TO STUDIO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
