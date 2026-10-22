// Design tokens ported from the web demo (wsop-tv-v2 theme.css, tier colours from wsop-tv-pitch app.css).
// Dark only: charcoal base, one restrained gold accent, status colours only for LIVE / DELAYED.
import { Platform, type TextStyle } from 'react-native';

export const colors = {
  bg: '#0B0C0E',
  surface: '#131418',
  surface2: '#1A1C21',
  surface3: '#23262D',
  line: '#2A2D34',
  lineStrong: '#3B3F48',

  text: '#F2F2F3',
  muted: '#A7ABB3',
  subtle: '#8A8F98',
  ink: '#0B0C0E',

  gold: '#C9A961',
  goldStrong: '#DCC07E',
  goldDim: 'rgba(201,169,97,0.15)',

  live: '#E5484D',
  delayed: '#F5A524',
  ok: '#4CC38A',

  tierFree: '#8B93A1',
  tierBasic: '#4B8DF8',
  tierPremium: '#C9A961',

  /** Demo settings: deliberately unlike the product (dashed sky blue). */
  demo: '#38BDF8',
  demoBg: '#07121C',

  scrim: 'rgba(0,0,0,0.6)',

  /** GGPASS / WSOP+ mocks (external domains) — deliberately a different, light tone. */
  extBg: '#f4f5f7',
  extInk: '#14161a',
  extBrand: '#2b59c3',
} as const;

export const space = {
  gutter: 16,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  chip: 6,
  button: 10,
  card: 12,
  panel: 16,
} as const;

/** Minimum touch target (web demo: 44px). */
export const TOUCH = 44;

const tnum: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  small: { fontSize: 12.5, lineHeight: 17, color: colors.muted },
  caption: { fontSize: 11, lineHeight: 15, color: colors.subtle },
  title: { fontSize: 28, lineHeight: 32, fontWeight: '900', color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 18, lineHeight: 23, fontWeight: '800', color: colors.text },
  h3: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: colors.subtle },
  button: { fontSize: 14, fontWeight: '800' },
  tnum,
} satisfies Record<string, TextStyle>;

export const mono = Platform.select({ android: 'monospace', web: 'ui-monospace, Menlo, Consolas, monospace', default: 'monospace' });

/** Deterministic placeholder art colours from a hue (the web demo draws cards from `hue`). */
export const artColors = (hue: number): [string, string] => {
  const h = ((hue % 360) + 360) % 360;
  return [`hsl(${h}, 32%, 26%)`, `hsl(${(h + 24) % 360}, 30%, 9%)`];
};
