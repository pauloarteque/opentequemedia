import { describe, expect, it } from 'vitest'
import { SMART_PAGE_TOKEN_NAMES, subsetTokensToCssVars, tokensToCssVars } from '@/core/tokens'

describe('tokensToCssVars — nomes de variável com dígito', () => {
  it('space4, space8, space12, space16 saem com hífen antes do dígito', () => {
    const css = tokensToCssVars()
    expect(css).toContain('--space-4:')
    expect(css).toContain('--space-8:')
    expect(css).toContain('--space-12:')
    expect(css).toContain('--space-16:')
    // a forma sem hífen não pode aparecer — era o bug
    expect(css).not.toMatch(/--space4:/)
    expect(css).not.toMatch(/--space8:/)
  })

  it('nomes com maiúscula continuam kebab-case normal', () => {
    const css = tokensToCssVars()
    expect(css).toContain('--color-bg:')
    expect(css).toContain('--color-primary-hover:')
    expect(css).toContain('--radius-full:')
    expect(css).toContain('--font-family:')
  })
})

describe('subsetTokensToCssVars — usado pela página inteligente', () => {
  it('todo nome de variável que a página inteligente referencia existe no subconjunto gerado', () => {
    const css = subsetTokensToCssVars(SMART_PAGE_TOKEN_NAMES)
    // as mesmas variáveis que src/server/smart-page.ts usa em var(--...)
    for (const varName of [
      '--color-bg',
      '--color-text',
      '--color-text-secondary',
      '--color-surface',
      '--color-border',
      '--color-primary',
      '--color-on-primary',
      '--focus-ring',
      '--font-family',
      '--radius-lg',
      '--radius-md',
      '--space-3',
      '--space-4',
    ]) {
      expect(css, `variável ${varName} ausente do CSS gerado`).toContain(`${varName}:`)
    }
  })
})
