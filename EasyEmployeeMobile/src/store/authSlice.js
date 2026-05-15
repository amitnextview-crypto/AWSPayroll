import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {login, logout, refreshSession} from '../api/employeeApi';
import {tokenStorage} from '../services/tokenStorage';

const isEmployee = user => String(user?.type || '').toLowerCase() === 'employee';

export const loginEmployee = createAsyncThunk(
  'auth/loginEmployee',
  async (credentials, {rejectWithValue}) => {
    try {
      const response = await login(credentials);
      if (!response?.success) {
        return rejectWithValue(response?.message || 'Login failed.');
      }
      if (!isEmployee(response.user)) {
        return rejectWithValue('Only employee accounts can login to this app.');
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
      if (!response?.success || !isEmployee(response.user)) {
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

export const logoutEmployee = createAsyncThunk('auth/logoutEmployee', async () => {
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
      .addCase(loginEmployee.pending, state => {
        state.loginLoading = true;
        state.error = null;
      })
      .addCase(loginEmployee.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload;
      })
      .addCase(loginEmployee.rejected, (state, action) => {
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
      .addCase(logoutEmployee.fulfilled, state => {
        state.user = null;
      });
  },
});

export const {clearAuthError} = authSlice.actions;
export default authSlice.reducer;
