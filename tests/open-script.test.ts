/**
 * Executa o OPEN_SCRIPT_SOURCE de verdade (o texto exato que vai pro navegador) dentro do
 * jsdom, com relógio falso. Não é uma reimplementação da lógica pra testar — é o próprio
 * texto do script, avaliado. Ver SPEC.md §6 e CLAUDE.md > Página inteligente.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { serializeJsonForHtml } from '@/core/escape'
import { OPEN_SCRIPT_SOURCE } from '@/server/open-script'
import type { OpenConfig } from '@/server/open-script'

function setConfig(cfg: OpenConfig): void {
  document.body.innerHTML = `<script type="application/json" id="oc">${serializeJsonForHtml(cfg)}</script>`
}

function mockNavigationType(type: string | undefined): void {
  vi.spyOn(performance, 'getEntriesByType').mockImplementation((entryType: string) => {
    if (entryType !== 'navigation') return []
    if (type === undefined) return []
    return [{ type } as unknown as PerformanceEntry]
  })
}

// jsdom torna `href` do Location real não-reconfigurável (Object.defineProperty falha
// com "Cannot redefine property: href"), de propósito, pra imitar navegador de verdade.
// Por isso trocamos o global `location` inteiro por um objeto simples via
// vi.stubGlobal — o mecanismo do próprio Vitest pra isso, não um truque nosso.
function mockLocationHref(): string[] {
  const calls: string[] = []
  const mockLocation = {
    get href() {
      return calls.at(-1) ?? 'about:blank'
    },
    set href(v: string) {
      calls.push(v)
    },
  }
  vi.stubGlobal('location', mockLocation)
  return calls
}

function runScript(): void {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  new Function(OPEN_SCRIPT_SOURCE)()
}

describe('open-script — Android', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    mockNavigationType('navigate')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('dispara UMA VEZ, imediatamente, e agenda ZERO timers', () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'a', chain: ['intent://www.youtube.com/watch?v=dQw4w9WgXcQ#Intent;...;end'] })

    runScript()

    expect(hrefCalls).toEqual(['intent://www.youtube.com/watch?v=dQw4w9WgXcQ#Intent;...;end'])
    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })
})

describe('open-script — iOS', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    mockNavigationType('navigate')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  const chain = [
    'youtube://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube://dQw4w9WgXcQ',
    'vnd.youtube://dQw4w9WgXcQ',
    'vnd.youtube://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'x-safari-https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  ]

  it('a cadeia dispara em 0/50/100/150/200ms, na ordem', () => {
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'i', chain })

    runScript()
    vi.advanceTimersByTime(0) // mesmo delay=0 passa por setTimeout — nunca é síncrono em JS
    expect(hrefCalls).toEqual([chain[0]])

    vi.advanceTimersByTime(50)
    expect(hrefCalls).toEqual([chain[0], chain[1]])

    vi.advanceTimersByTime(50)
    expect(hrefCalls).toEqual([chain[0], chain[1], chain[2]])

    vi.advanceTimersByTime(50)
    expect(hrefCalls).toEqual([chain[0], chain[1], chain[2], chain[3]])

    vi.advanceTimersByTime(50)
    expect(hrefCalls).toEqual(chain)
  })

  it('ocultar a página aos 60ms cancela TODO o resto da cadeia', () => {
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'i', chain })

    runScript()
    vi.advanceTimersByTime(60) // passou dos timers de 0 e 50, ainda não chegou no de 100

    expect(hrefCalls).toEqual([chain[0], chain[1]])

    // dispara o evento que o Instagram gera ao trocar de app de verdade
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    vi.advanceTimersByTime(1000) // avança bem além de 200ms — nada mais deveria disparar
    expect(hrefCalls).toEqual([chain[0], chain[1]]) // exatamente os dois que já tinham disparado
  })

  it('pagehide também cancela o resto da cadeia', () => {
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'i', chain })

    runScript()
    vi.advanceTimersByTime(10)
    window.dispatchEvent(new Event('pagehide'))
    vi.advanceTimersByTime(1000)

    expect(hrefCalls).toEqual([chain[0]])
  })
})

describe('open-script — travas contra disparo indevido', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('navegação do tipo back_forward NÃO dispara nada', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    mockNavigationType('back_forward')
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'a', chain: ['intent://x'] })

    runScript()

    expect(hrefCalls).toEqual([])
  })

  it('página não visível no instante zero (pré-carregamento) NÃO dispara nada', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    mockNavigationType('navigate')
    const hrefCalls = mockLocationHref()
    setConfig({ p: 'a', chain: ['intent://x'] })

    runScript()

    expect(hrefCalls).toEqual([])
  })

  it('sem o bloco de configuração (#oc ausente), não lança exceção e não dispara nada', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    mockNavigationType('navigate')
    document.body.innerHTML = ''
    const hrefCalls = mockLocationHref()

    expect(() => runScript()).not.toThrow()
    expect(hrefCalls).toEqual([])
  })

  it('JSON malformado no bloco de configuração não lança exceção', () => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    mockNavigationType('navigate')
    document.body.innerHTML = `<script type="application/json" id="oc">{isto nao e json}</script>`
    const hrefCalls = mockLocationHref()

    expect(() => runScript()).not.toThrow()
    expect(hrefCalls).toEqual([])
  })
})
