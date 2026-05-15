import {createSlice} from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    themeMode: 'light',
  },
  reducers: {
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const {toggleTheme} = uiSlice.actions;
export default uiSlice.reducer;
