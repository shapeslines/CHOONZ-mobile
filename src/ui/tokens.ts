export const gels = {
  blue: { hot: '#3D4BE0', mid: '#2530A8', deep: '#0A0E2E' },
  red: { hot: '#B81410', mid: '#48090B', deep: '#12040A' },
  uv: { hot: '#6C35C8', mid: '#3A1C6E', deep: '#160C2A' },
  acid: { hot: '#63A014', mid: '#1E3A0E', deep: '#050E06' },
  sodium: { hot: '#E08818', mid: '#6E4408', deep: '#140C02' },
} as const;

/** House type stack (OFL, bundled under assets/fonts). */
export const fonts = {
  display: 'ArchivoBlack',
  body: 'Inter',
  bodySemi: 'Inter-SemiBold',
  bodyBlack: 'Inter-Black',
  mono: 'JetBrainsMono',
  monoBold: 'JetBrainsMono-Bold',
} as const;

/** Type scale: display / heading / body / meta-mono (wide tracking for mono). */
export const typeScale = {
  display: { fontFamily: fonts.display, fontSize: 32, letterSpacing: -1 },
  heading: { fontFamily: fonts.bodyBlack, fontSize: 20, letterSpacing: 0.5 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.bodyBlack, fontSize: 12, letterSpacing: 1 },
  meta: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2 },
  metaBold: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 2 },
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
