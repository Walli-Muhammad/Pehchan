import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Variant, PodOption } from '@/lib/supabase';

// =============================================
// POD Customization Data
// A map from pod_option.id → user's value
// =============================================
export type PodCustomizations = Record<string, string>;

// =============================================
// Single Cart Line Item
// =============================================
export interface CartItem {
  /** Unique key for this line item: productId + variantId + serialized POD opts */
  lineItemId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  variantId: string;
  variant: Pick<Variant, 'size' | 'color' | 'color_hex' | 'sku' | 'price_delta'>;
  basePrice: number;
  quantity: number;
  /** Null for standard products; populated for POD items */
  podCustomizations: PodCustomizations | null;
  /** True when podCustomizations is non-null */
  isPod: boolean;
}

// =============================================
// Cart State Shape
// =============================================
interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isCheckoutOpen: boolean;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  addItem: (item: Omit<CartItem, 'lineItemId'>) => void;
  removeItem: (lineItemId: string) => void;
  updateQuantity: (lineItemId: string, quantity: number) => void;
  clearCart: () => void;

  // Derived helpers (not stored, computed on access)
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// =============================================
// Deterministic Line Item ID
// Combines product + variant + POD options so two items with the same
// product/variant but different POD customizations stay as separate lines.
// =============================================
function buildLineItemId(
  productId: string,
  variantId: string,
  podCustomizations: PodCustomizations | null
): string {
  const podStr = podCustomizations
    ? JSON.stringify(Object.entries(podCustomizations).sort())
    : 'standard';
  return `${productId}_${variantId}_${podStr}`;
}

// =============================================
// Zustand Store
// =============================================
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isCheckoutOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCheckout: () => set({ isCheckoutOpen: true, isOpen: false }),
      closeCheckout: () => set({ isCheckoutOpen: false }),

      addItem: (incomingItem) => {
        const lineItemId = buildLineItemId(
          incomingItem.productId,
          incomingItem.variantId,
          incomingItem.podCustomizations
        );

        set((state) => {
          const existing = state.items.find((i) => i.lineItemId === lineItemId);

          if (existing) {
            // Increment quantity if an identical line already exists
            return {
              items: state.items.map((i) =>
                i.lineItemId === lineItemId
                  ? { ...i, quantity: i.quantity + incomingItem.quantity }
                  : i
              ),
            };
          }

          return {
            items: [...state.items, { ...incomingItem, lineItemId }],
          };
        });
      },

      removeItem: (lineItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.lineItemId !== lineItemId),
        })),

      updateQuantity: (lineItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.lineItemId === lineItemId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + (i.basePrice + i.variant.price_delta) * i.quantity,
          0
        ),
    }),
    {
      name: 'pehchan-cart',        // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist the items array; not the UI open/close state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
