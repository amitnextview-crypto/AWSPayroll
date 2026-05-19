export const lightColors = {
  background: '#f6f3ee',
  surface: '#ffffff',
  surfaceMuted: '#f0ebe2',
  text: '#15171f',
  textMuted: '#6f6a61',
  border: '#ded6c7',
  primary: '#8a6432',
  primaryDark: '#4b351c',
  success: '#1f7a5a',
  danger: '#b6423c',
  warning: '#b27a22',
  info: '#236f73',
  gold: '#c69a45',
  ink: '#15171f',
  panel: '#fbfaf7',
};

export const darkColors = {
  background: '#11100e',
  surface: '#1b1916',
  surfaceMuted: '#28231d',
  text: '#f8f3ea',
  textMuted: '#c5b9a7',
  border: '#3d3529',
  primary: '#d5ad5f',
  primaryDark: '#9e7737',
  success: '#59c49a',
  danger: '#ff8a7a',
  warning: '#e7b35b',
  info: '#72c4c8',
  gold: '#d5ad5f',
  ink: '#0f0e0d',
  panel: '#211e19',
};

export const getThemeColors = mode => (mode === 'dark' ? darkColors : lightColors);

export const colors = lightColors;
