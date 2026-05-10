import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  fullName: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  role: localStorage.getItem('role'),
  fullName: localStorage.getItem('fullName'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; username: string; role: string; fullName: string }>
    ) => {
      const { token, username, role, fullName } = action.payload;
      state.token = token;
      state.username = username;
      state.role = role;
      state.fullName = fullName;
      state.isAuthenticated = true;

      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      localStorage.setItem('fullName', fullName);
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.fullName = null;
      state.isAuthenticated = false;

      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
