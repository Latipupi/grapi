import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CompoundIngredient {
  productId: number;
  productName: string;
  unitId?: number;
  unitName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableStock?: number;
}

export interface CartItem {
  id?: string;
  productId: number;
  unitId: number;
  unitName: string;
  name: string;
  sku: string;
  price: number; // Active price
  pricePerUnit: number; // Base price
  additionalPrices: { priceLabel: string; price: number }[];
  selectedPriceLabel: string; // e.g., 'Utama', 'Medis', 'Grosir'
  quantity: number;
  availableStock: number;
  conversionToBase: number;

  // Compounded prescription fields
  isCompound?: boolean;
  compoundName?: string;
  doseRule?: string;
  packageType?: string;
  serviceFee?: number;
  ingredients?: CompoundIngredient[];
}

interface POSState {
  cart: CartItem[];
  customerId: number | null;
  paymentMethod: string;
}

const initialState: POSState = {
  cart: [],
  customerId: null,
  paymentMethod: 'CASH',
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      if (action.payload.isCompound) {
        // Compound items are treated as independent custom prescriptions
        const compoundItem = {
          ...action.payload,
          id: action.payload.id || 'compound-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7)
        };
        state.cart.push(compoundItem);
        return;
      }

      const existing = state.cart.find(item => 
        !item.isCompound &&
        item.productId === action.payload.productId && 
        item.unitId === action.payload.unitId
      );
      if (existing) {
        const totalBaseQty = (existing.quantity + action.payload.quantity) * existing.conversionToBase;
        if (totalBaseQty <= existing.availableStock) {
           existing.quantity += action.payload.quantity;
           // If they add the same unit again, we can also sync the price option to the latest added one
           existing.price = action.payload.price;
           existing.selectedPriceLabel = action.payload.selectedPriceLabel;
        }
      } else {
        state.cart.push(action.payload);
      }
    },
    updateQuantity: (state, action: PayloadAction<{ id?: string; productId?: number; unitId?: number; quantity: number }>) => {
      let item: CartItem | undefined;
      if (action.payload.id) {
        item = state.cart.find(i => i.id === action.payload.id);
      } else {
        item = state.cart.find(i => 
          !i.isCompound &&
          i.productId === action.payload.productId && 
          i.unitId === action.payload.unitId
        );
      }

      if (item) {
        if (item.isCompound) {
          item.quantity = action.payload.quantity;
        } else {
          if (action.payload.quantity * item.conversionToBase <= item.availableStock) {
            item.quantity = action.payload.quantity;
          }
        }
      }
    },
    updateItemPrice: (state, action: PayloadAction<{ id?: string; productId?: number; unitId?: number; priceLabel: string; price: number }>) => {
      let item: CartItem | undefined;
      if (action.payload.id) {
        item = state.cart.find(i => i.id === action.payload.id);
      } else {
        item = state.cart.find(i => 
          !i.isCompound &&
          i.productId === action.payload.productId && 
          i.unitId === action.payload.unitId
        );
      }

      if (item) {
        item.selectedPriceLabel = action.payload.priceLabel;
        item.price = action.payload.price;
      }
    },
    removeFromCart: (state, action: PayloadAction<{ id?: string; productId?: number; unitId?: number }>) => {
      if (action.payload.id) {
        state.cart = state.cart.filter(item => item.id !== action.payload.id);
      } else {
        state.cart = state.cart.filter(item => 
          item.isCompound || !(item.productId === action.payload.productId && item.unitId === action.payload.unitId)
        );
      }
    },
    clearCart: (state) => {
      state.cart = [];
      state.customerId = null;
      state.paymentMethod = 'CASH';
    },
    setCustomer: (state, action: PayloadAction<number | null>) => {
      state.customerId = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
  },
});

export const { 
  addToCart, 
  updateQuantity, 
  updateItemPrice,
  removeFromCart, 
  clearCart, 
  setCustomer, 
  setPaymentMethod 
} = posSlice.actions;

export default posSlice.reducer;
