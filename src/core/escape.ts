/**
 * Escape por contexto. Título de vídeo/canal é entrada de terceiro — nunca entra em HTML
 * sem passar por uma destas funções. Ver SPEC.md §6.
 */

export function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function escapeHtmlAttr(s: string): string {
  return escapeHtmlText(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// U+2028 (LINE SEPARATOR) e U+2029 (PARAGRAPH SEPARATOR) construídos via
// String.fromCharCode de propósito: um caractere literal desses dois dentro de um
// regex QUEBRA o parser do TypeScript/JS, porque a especificação trata os dois como
// terminador de linha mesmo dentro de um literal de regex. Só código ASCII aqui.
const LINE_SEPARATOR_RE = new RegExp(String.fromCharCode(0x2028), 'g')
const PARAGRAPH_SEPARATOR_RE = new RegExp(String.fromCharCode(0x2029), 'g')

/**
 * Serializa um valor para dentro de um <script type="application/json"> (ou de uma
 * string literal de JS). O parser HTML não decodifica entidades dentro de <script>, então
 * escapar como HTML aqui seria ERRADO (produziria "&amp;amp;" literal na tela). O que
 * importa é impedir que "</script>" dentro do valor encerre a tag prematuramente, e
 * neutralizar os terminadores de linha invisíveis U+2028/U+2029.
 */
export function serializeJsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR_RE, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR_RE, '\\u2029')
}

/**
 * Literal de string JS já citado (com aspas). Mantida por completude e testada, ainda que
 * a página inteligente roteie todo dado variável por serializeJsonForHtml (ver SPEC.md §6)
 * e nunca precise interpolar uma string de terceiro direto num script.
 */
export function escapeJsStringLiteral(s: string): string {
  return JSON.stringify(s)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(LINE_SEPARATOR_RE, '\\u2028')
    .replace(PARAGRAPH_SEPARATOR_RE, '\\u2029')
}

export function encodeUrlComponentForAttr(s: string): string {
  return escapeHtmlAttr(encodeURIComponent(s))
}

/** Usado só em teste: garante que um valor de token CSS não pode carregar nada perigoso. */
export function isSafeCssValue(s: string): boolean {
  // Aspas simples são legítimas em valores CSS reais (font-family: 'Inter', ...) e não
  // abrem fuga de contexto sozinhas — o que quebra um bloco CSS é ; ou { }, que continuam
  // fora do conjunto permitido.
  return /^[#a-zA-Z0-9(),.\s%'-]+$/.test(s)
}

/**
 * Corta pelo CÓDIGO DE PONTO Unicode (não pela unidade UTF-16), para nunca partir um
 * emoji ou caractere combinado ao meio. Chamar DEPOIS de decodificar entidades e ANTES
 * de escapar — nessa ordem, nunca a inversa.
 */
export function clampText(s: string, maxLength: number): string {
  const chars = Array.from(s)
  if (chars.length <= maxLength) return s
  return `${chars.slice(0, Math.max(0, maxLength - 1)).join('')}…`
}
