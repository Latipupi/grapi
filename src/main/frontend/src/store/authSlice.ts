import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
  role: string | null;
  fullName: string | null;
  branchId: number | null;
  tenantId: string | null;
  billingStatus: string | null;
  subscriptionPlan: string | null;
  expiredAt: string | null;
  adminWhatsApp: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role'),
  fullName: localStorage.getItem('fullName'),
  branchId: localStorage.getItem('branchId') ? Number(localStorage.getItem('branchId')) : null,
  tenantId: localStorage.getItem('tenantId'),
  billingStatus: localStorage.getItem('billingStatus'),
  subscriptionPlan: localStorage.getItem('subscriptionPlan'),
  expiredAt: localStorage.getItem('expiredAt'),
  adminWhatsApp: localStorage.getItem('adminWhatsApp'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ 
        token: string; 
        userId: number; 
        username: string; 
        role: string; 
        fullName: string; 
        branchId: number; 
        tenantId: string;
        billingStatus?: string;
        subscriptionPlan?: string;
        expiredAt?: string;
        adminWhatsApp?: string;
      }>
    ) => {
      const { token, userId, username, role, fullName, branchId, tenantId, billingStatus, subscriptionPlan, expiredAt, adminWhatsApp } = action.payload;
      state.token = token;
      state.userId = userId;
      state.username = username;
      state.role = role;
      state.fullName = fullName;
      state.branchId = branchId;
      state.tenantId = tenantId;
      state.billingStatus = billingStatus || 'ACTIVE';
      state.subscriptionPlan = subscriptionPlan || 'FREE_TRIAL';
      state.expiredAt = expiredAt || '';
      state.adminWhatsApp = adminWhatsApp || '628123456789';
      state.isAuthenticated = true;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      if (branchId) localStorage.setItem('branchId', branchId.toString());
      if (tenantId) localStorage.setItem('tenantId', tenantId);
      if (billingStatus) localStorage.setItem('billingStatus', billingStatus);
      if (subscriptionPlan) localStorage.setItem('subscriptionPlan', subscriptionPlan);
      if (expiredAt) localStorage.setItem('expiredAt', expiredAt);
      if (adminWhatsApp) localStorage.setItem('adminWhatsApp', adminWhatsApp);
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.username = null;
      state.role = null;
      state.fullName = null;
      state.branchId = null;
      state.tenantId = null;
      state.billingStatus = null;
      state.subscriptionPlan = null;
      state.expiredAt = null;
      state.adminWhatsApp = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      localStorage.removeItem('branchId');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('billingStatus');
      localStorage.removeItem('subscriptionPlan');
      localStorage.removeItem('expiredAt');
      localStorage.removeItem('adminWhatsApp');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
