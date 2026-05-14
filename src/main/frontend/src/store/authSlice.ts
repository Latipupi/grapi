import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
  role: string | null;
  fullName: string | null;
  branchId: number | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  userId: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role'),
  fullName: localStorage.getItem('fullName'),
  branchId: localStorage.getItem('branchId') ? Number(localStorage.getItem('branchId')) : null,
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; userId: number; username: string; role: string; fullName: string; branchId: number }>
    ) => {
      const { token, userId, username, role, fullName, branchId } = action.payload;
      state.token = token;
      state.userId = userId;
      state.username = username;
      state.role = role;
      state.fullName = fullName;
      state.branchId = branchId;
      state.isAuthenticated = true;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
      if (branchId) localStorage.setItem('branchId', branchId.toString());
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.username = null;
      state.role = null;
      state.fullName = null;
      state.branchId = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      localStorage.removeItem('branchId');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
