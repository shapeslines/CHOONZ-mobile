export const gels = {
  blue: { hot: '#3D4BE0', mid: '#2530A8', deep: '#0A0E2E' },
  red: { hot: '#B81410', mid: '#48090B', deep: '#12040A' },
  uv: { hot: '#6C35C8', mid: '#3A1C6E', deep: '#160C2A' },
  acid: { hot: '#63A014', mid: '#1E3A0E', deep: '#050E06' },
  sodium: { hot: '#E08818', mid: '#6E4408', deep: '#140C02' },
} as const;

export const tokens = {
  background: gels.blue.deep,
  panel: gels.uv.deep,
  panelStrong: gels.red.deep,
  border: gels.blue.hot,
  accent: gels.sodium.hot,
  accentAlt: gels.acid.hot,
  danger: gels.red.hot,
  text: '#F4EEDC',
  muted: '#C9C4E2',
  black: '#000000',
  borderWidth: 2,
  radius: 0,
  space: 12,
} as const;
