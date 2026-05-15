export const lightColors = {
  background: '#f6f8fb',
  surface: '#ffffff',
  surfaceMuted: '#edf2f7',
  text: '#172033',
  textMuted: '#6b7280',
  border: '#d9e2ec',
  primary: '#1769aa',
  primaryDark: '#0f4c81',
  success: '#198754',
  danger: '#c2410c',
  warning: '#b7791f',
  info: '#0f766e',
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
