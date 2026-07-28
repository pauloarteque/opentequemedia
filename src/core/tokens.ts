/**
 * Fonte única dos design tokens TEQUEMEDIA (modo escuro — o único usado no openteque).
 * Transcrito de design-tokens-tequemedia.md. Nunca duplicar um valor solto no código:
 * scripts/check-no-raw-values.ts quebra o build se algum hex ou px aparecer fora daqui.
 */

export const colorBg = '#161616'
export const colorSurface = '#1e1f22'
export const colorSurfaceRaised = '#25272b'
export const colorSurfaceHover = '#2a2c30'
export const colorSurfaceActive = '#313438'
export const colorBorder = '#303236'

export const colorText = '#f2f2f2'
export const colorTextSecondary = '#b3b9c0'
export const colorTextMuted = '#828990'
export const colorTextDisabled = '#5a6066'

export const colorPrimary = '#fe5b18'
export const colorPrimaryHover = '#ff6e33'
export const colorPrimaryActive = '#ff8552'
export const colorOnPrimary = '#ffffff'
export const colorAccent = '#2ab7c0'

export const colorFocusRing = '#ff7a45'
export const focusRing = '0 0 0 3px rgba(255,122,69,0.55)'

export const colorSuccess = '#2bb37e'
export const colorDanger = '#f2555a'
export const colorWarning = '#ffe00c'

export const colorSuccessBg = '#16312a'
export const colorSuccessText = '#4ecb97'
export const colorDangerBg = '#3a1f21'
export const colorDangerText = '#f4807f'
export const colorWarningBg = '#332b10'
export const colorWarningText = '#f0d34a'

export const shadowSm = '0 1px 2px rgba(0,0,0,0.30)'
export const shadowMd = '0 4px 14px rgba(0,0,0,0.40)'
export const shadowLg = '0 14px 36px rgba(0,0,0,0.50)'

export const radiusSm = '8px'
export const radiusMd = '12px'
export const radiusLg = '16px'
export const radiusXl = '24px'
export const radiusFull = '9999px'

export const space1 = '4px'
export const space2 = '8px'
export const space3 = '12px'
export const space4 = '16px'
export const space6 = '24px'
export const space8 = '32px'
export const space12 = '48px'
export const space16 = '64px'

export const fontFamily = "'Inter', system-ui, -apple-system, sans-serif"

// Escala tipográfica de design-tokens-tequemedia.md — faltava no port original, e a
// falta dela é o que fazia "16px" de tamanho de fonte aparecer solto pelo código
// (16 coincide com o valor de space4, então a cerca de valores crus disparava nele
// sem eu ter um token de tamanho de FONTE de verdade pra usar em vez disso).
export const fontSizeDisplay = '48px'
export const fontSizeH1 = '30px'
export const fontSizeH2 = '24px'
export const fontSizeH3 = '18px'
export const fontSizeBody = '15px'
export const fontSizeSmall = '13px'
export const fontSizeMicro = '12px'

export const lineHeightDisplay = '1.1'
export const lineHeightH1 = '1.2'
export const lineHeightH2 = '1.25'
export const lineHeightH3 = '1.35'
export const lineHeightBody = '1.5'
export const lineHeightSmall = '1.45'
export const lineHeightMicro = '1.4'

export const tokens = {
  colorBg,
  colorSurface,
  colorSurfaceRaised,
  colorSurfaceHover,
  colorSurfaceActive,
  colorBorder,
  colorText,
  colorTextSecondary,
  colorTextMuted,
  colorTextDisabled,
  colorPrimary,
  colorPrimaryHover,
  colorPrimaryActive,
  colorOnPrimary,
  colorAccent,
  colorFocusRing,
  focusRing,
  colorSuccess,
  colorDanger,
  colorWarning,
  colorSuccessBg,
  colorSuccessText,
  colorDangerBg,
  colorDangerText,
  colorWarningBg,
  colorWarningText,
  shadowSm,
  shadowMd,
  shadowLg,
  radiusSm,
  radiusMd,
  radiusLg,
  radiusXl,
  radiusFull,
  space1,
  space2,
  space3,
  space4,
  space6,
  space8,
  space12,
  space16,
  fontFamily,
  fontSizeDisplay,
  fontSizeH1,
  fontSizeH2,
  fontSizeH3,
  fontSizeBody,
  fontSizeSmall,
  fontSizeMicro,
  lineHeightDisplay,
  lineHeightH1,
  lineHeightH2,
  lineHeightH3,
  lineHeightBody,
  lineHeightSmall,
  lineHeightMicro,
} as const

export type TokenName = keyof typeof tokens

/**
 * Nome do token (camelCase) -> nome de variável CSS (kebab-case, prefixo --).
 * 'space4' -> '--space-4' (hífen antes do dígito também, não só antes de maiúscula —
 * sem isso "space4" virava "--space4" sem hífen nenhum, e todo var(--space-4) escrito
 * à mão no resto do código apontava pra uma variável que não existia).
 */
function cssVarName(name: string): string {
  return `--${name.replace(/([0-9]+)/g, '-$1').replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

/** Gera o bloco `:root { --token: valor; ... }` a partir da MESMA fonte usada em toda parte. */
export function tokensToCssVars(): string {
  const lines = Object.entries(tokens).map(([name, value]) => `  ${cssVarName(name)}: ${value};`)
  return `:root {\n${lines.join('\n')}\n}`
}

/**
 * Subconjunto usado pela página inteligente (superfície 2): inclui o laranja de marca
 * como acento de botão — permitido por SPEC.md §1/§6 ("botão laranja" é rótulo
 * funcional, não copy de marketing) — mas nunca logo, tagline ou texto TEQUEMEDIA.
 * Fora daqui: chart-*, success/danger/warning (não usados numa página de um botão só).
 */
export const SMART_PAGE_TOKEN_NAMES: readonly TokenName[] = [
  'colorBg',
  'colorSurface',
  'colorSurfaceRaised',
  'colorBorder',
  'colorText',
  'colorTextSecondary',
  'colorTextMuted',
  'colorPrimary',
  'colorPrimaryHover',
  'colorPrimaryActive',
  'colorOnPrimary',
  'colorFocusRing',
  'focusRing',
  'shadowMd',
  'radiusSm',
  'radiusMd',
  'radiusLg',
  'radiusFull',
  'space1',
  'space2',
  'space3',
  'space4',
  'space6',
  'space8',
  'fontFamily',
  'fontSizeH3',
  'fontSizeBody',
  'fontSizeSmall',
  'lineHeightH3',
]

export function subsetTokensToCssVars(names: readonly TokenName[]): string {
  const lines = names.map((name) => `  ${cssVarName(name)}: ${tokens[name]};`)
  return `:root {\n${lines.join('\n')}\n}`
}
