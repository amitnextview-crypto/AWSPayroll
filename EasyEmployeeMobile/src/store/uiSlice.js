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
    setTheme(state, action) {
      state.themeMode = action.payload === 'dark' ? 'dark' : 'light';
    },
  },
});

export const {setTheme, toggleTheme} = uiSlice.actions;
export default uiSlice.reducer;
