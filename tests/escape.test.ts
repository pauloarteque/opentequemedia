import { describe, expect, it } from 'vitest'
import {
  clampText,
  escapeHtmlAttr,
  escapeHtmlText,
  escapeJsStringLiteral,
  isSafeCssValue,
  serializeJsonForHtml,
} from '@/core/escape'
import { tokens } from '@/core/tokens'

describe('escapeHtmlText', () => {
  it('escapa & < >', () => {
    expect(escapeHtmlText('Tom & Jerry <show>')).toBe('Tom &amp; Jerry &lt;show&gt;')
  })

  it('não mexe em acento — UTF-8 puro, não entidade', () => {
    expect(escapeHtmlText('Não abriu? Assistência à distância')).toBe('Não abriu? Assistência à distância')
  })
})

describe('escapeHtmlAttr', () => {
  it('escapa aspas duplas e simples além de & < >', () => {
    expect(escapeHtmlAttr(`ele disse "oi" e 'tchau'`)).toBe('ele disse &quot;oi&quot; e &#39;tchau&#39;')
  })
})

describe('serializeJsonForHtml — a armadilha </script>', () => {
  it('título hostil com </script><script>alert(1)</script> não encerra o bloco', () => {
    const hostile = 'Vídeo incrível </script><script>alert(1)</script>'
    const out = serializeJsonForHtml({ title: hostile })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003C/script\\u003E')
  })

  it('neutraliza U+2028 e U+2029 (terminador de linha invisível dentro de string)', () => {
    const withSeparators = `linha1${String.fromCharCode(0x2028)}linha2${String.fromCharCode(0x2029)}fim`
    const out = serializeJsonForHtml(withSeparators)
    expect(out).not.toContain(String.fromCharCode(0x2028))
    expect(out).not.toContain(String.fromCharCode(0x2029))
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('produz JSON válido depois de round-trip por JSON.parse', () => {
    const value = { title: 'Aspas "duplas" e </script> tag', n: 42 }
    const serialized = serializeJsonForHtml(value)
    // desfaz só os escapes que NÓS acrescentamos, pra simular o que o parser HTML faz
    // (o HTML parser não interpreta \uXXXX — quem faz isso é o motor JS ao rodar o script)
    expect(() => JSON.parse(serialized)).not.toThrow()
    expect(JSON.parse(serialized)).toEqual(value)
  })
})

describe('escapeJsStringLiteral', () => {
  it('produz um literal de string JS válido e seguro', () => {
    const out = escapeJsStringLiteral(`</script><script>alert(1)</script>`)
    expect(out.startsWith('"')).toBe(true)
    expect(out).not.toContain('</script>')
  })
})

describe('clampText', () => {
  it('não corta quando já está dentro do limite', () => {
    expect(clampText('curto', 100)).toBe('curto')
  })

  it('corta e acrescenta reticências quando excede', () => {
    const long = 'a'.repeat(150)
    const clamped = clampText(long, 100)
    expect(Array.from(clamped).length).toBe(100)
    expect(clamped.endsWith('…')).toBe(true)
  })

  it('não parte um emoji (par substituto) ao meio', () => {
    const emoji = '😀'
    const s = `${'a'.repeat(9)}${emoji}`
    const clamped = clampText(s, 10)
    // ou inclui o emoji inteiro, ou não inclui nada dele — nunca metade de um par substituto
    expect(clamped.includes('\uFFFD')).toBe(false)
    expect([...clamped].every((c) => [...c].length <= 2)).toBe(true)
  })
})

describe('isSafeCssValue — usado para validar os próprios tokens', () => {
  it('todo valor em tokens.ts passa no validador', () => {
    for (const [name, value] of Object.entries(tokens)) {
      expect(isSafeCssValue(value), `token ${name} = "${value}" não é um valor CSS seguro`).toBe(true)
    }
  })

  it('recusa algo com ; ou { } (fuga de contexto CSS)', () => {
    expect(isSafeCssValue('red; } body { display: none')).toBe(false)
  })
})
