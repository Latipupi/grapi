import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  availableStock: number;
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
      const existing = state.cart.find(item => item.productId === action.payload.productId);
      if (existing) {
        if (existing.quantity + action.payload.quantity <= action.payload.availableStock) {
           existing.quantity += action.payload.quantity;
        }
      } else {
        state.cart.push(action.payload);
      }
    },
    updateQuantity: (state, action: PayloadAction<{ productId: number; quantity: number }>) => {
      const item = state.cart.find(item => item.productId === action.payload.productId);
      if (item) {
        if (action.payload.quantity <= item.availableStock) {
          item.quantity = action.payload.quantity;
        }
      }
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.cart = state.cart.filter(item => item.productId !== action.payload);
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
  removeFromCart, 
  clearCart, 
  setCustomer, 
  setPaymentMethod 
} = posSlice.actions;

export default posSlice.reducer;
