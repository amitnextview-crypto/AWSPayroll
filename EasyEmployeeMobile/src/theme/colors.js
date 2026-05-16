export const lightColors = {
  background: '#f4f7fb',
  surface: '#ffffff',
  surfaceMuted: '#eef4fb',
  text: '#141a2e',
  textMuted: '#667085',
  border: '#d7e0ea',
  primary: '#2457c5',
  primaryDark: '#183b88',
  success: '#16885f',
  danger: '#c43d2f',
  warning: '#b98215',
  info: '#0b7f86',
};

export const darkColors = {
  background: '#0f172a',
  surface: '#172033',
  surfaceMuted: '#22304a',
  text: '#f8fafc',
  textMuted: '#a8b3c7',
  border: '#334155',
  primary: '#38bdf8',
  primaryDark: '#0ea5e9',
  success: '#22c55e',
  danger: '#fb923c',
  warning: '#f59e0b',
  info: '#2dd4bf',
};

export const getThemeColors = mode => (mode === 'dark' ? darkColors : lightColors);

export const colors = lightColors;
