import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
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
      const existing = state.cart.find(item => 
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
    updateQuantity: (state, action: PayloadAction<{ productId: number; unitId: number; quantity: number }>) => {
      const item = state.cart.find(item => 
        item.productId === action.payload.productId && 
        item.unitId === action.payload.unitId
      );
      if (item) {
        if (action.payload.quantity * item.conversionToBase <= item.availableStock) {
          item.quantity = action.payload.quantity;
        }
      }
    },
    updateItemPrice: (state, action: PayloadAction<{ productId: number; unitId: number; priceLabel: string; price: number }>) => {
      const item = state.cart.find(item => 
        item.productId === action.payload.productId && 
        item.unitId === action.payload.unitId
      );
      if (item) {
        item.selectedPriceLabel = action.payload.priceLabel;
        item.price = action.payload.price;
      }
    },
    removeFromCart: (state, action: PayloadAction<{ productId: number; unitId: number }>) => {
      state.cart = state.cart.filter(item => 
        !(item.productId === action.payload.productId && item.unitId === action.payload.unitId)
      );
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
