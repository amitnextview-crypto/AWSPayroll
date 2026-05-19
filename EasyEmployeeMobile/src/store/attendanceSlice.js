import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {
  checkInAttendance,
  checkOutAttendance,
  getAttendance,
} from '../api/employeeApi';
import {todayParts} from '../utils/date';

export const loadAttendance = createAsyncThunk(
  'attendance/load',
  async (payload, {rejectWithValue}) => {
    try {
      const employeeID = typeof payload === 'object' ? payload.employeeID : payload;
      const current = todayParts();
      const year = typeof payload === 'object' && payload.year ? Number(payload.year) : current.year;
      const month = typeof payload === 'object' && payload.month ? Number(payload.month) : current.month;
      const response = await getAttendance({employeeID, year, month});
      if (!response?.success) {
        return rejectWithValue(response?.message || 'Attendance not found.');
      }
      return {
        records: response.data || [],
        cycle: response.cycle || null,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (payload, {rejectWithValue}) => {
    try {
      const response = await checkInAttendance(payload);
      if (!response?.success) {
        return rejectWithValue(response?.message || 'Check-in failed.');
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (payload, {rejectWithValue}) => {
    try {
      const response = await checkOutAttendance(payload);
      if (!response?.success) {
        return rejectWithValue(response?.message || 'Check-out failed.');
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    records: [],
    cycle: null,
    loading: false,
    actionLoading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearAttendanceMessage(state) {
      state.error = null;
      state.message = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAttendance.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.cycle = action.payload.cycle;
      })
      .addCase(loadAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkIn.pending, state => {
        state.actionLoading = true;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(checkOut.pending, state => {
        state.actionLoading = true;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.message = action.payload.message;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const {clearAttendanceMessage} = attendanceSlice.actions;
export default attendanceSlice.reducer;
