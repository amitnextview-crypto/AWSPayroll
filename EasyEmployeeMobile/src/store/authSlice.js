import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {login, logout, refreshSession} from '../api/employeeApi';
import {tokenStorage} from '../services/tokenStorage';

const allowedRoles = ['admin', 'employee', 'leader'];
const userRole = user => String(user?.type || '').toLowerCase();
const canUseApp = user => allowedRoles.includes(userRole(user));

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, {rejectWithValue}) => {
    try {
      const response = await login(credentials);
      if (!response?.success) {
        return rejectWithValue(response?.message || 'Login failed.');
      }
      if (!canUseApp(response.user)) {
        return rejectWithValue('Only admin, employee, and leader accounts can login to this app.');
      }
      if (response.tokens) {
        await tokenStorage.save(response.tokens);
      }
      return response.user;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, {rejectWithValue}) => {
    try {
      const tokens = await tokenStorage.load();
      if (!tokens) {
        return null;
      }
      const response = await refreshSession();
      if (!response?.success || !canUseApp(response.user)) {
        await tokenStorage.clear();
        return null;
      }
      if (response.tokens) {
        await tokenStorage.save(response.tokens);
      }
      return response.user;
    } catch (error) {
      await tokenStorage.clear();
      return rejectWithValue(error.message);
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await logout();
  } finally {
    await tokenStorage.clear();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,
    loginLoading: false,
    error: null,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loginUser.pending, state => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload || 'Login failed.';
      })
      .addCase(restoreSession.pending, state => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(restoreSession.rejected, state => {
        state.loading = false;
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null;
      });
  },
});

export const {clearAuthError} = authSlice.actions;
export const loginEmployee = loginUser;
export const logoutEmployee = logoutUser;
export default authSlice.reducer;
