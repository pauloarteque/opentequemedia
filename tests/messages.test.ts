import { describe, expect, it } from 'vitest'
import { messageForFailure } from '@/components/messages'

describe('messageForFailure', () => {
  it('link inteiro já gerado aqui não é tratado como "não é do YouTube"', () => {
    const m = messageForFailure('HOST_NOT_ALLOWED', 'open.tequemedia.com.br', 'inteiro')
    expect(m).toContain('já foi gerado aqui')
    expect(m).not.toContain('não é um endereço do YouTube')
  })

  it('link quebrado do Open não promete que funciona', () => {
    const m = messageForFailure('HOST_NOT_ALLOWED', 'open.tequemedia.com.br', 'quebrado')
    expect(m).toContain('incompleto')
    expect(m).not.toContain('Pode usar direto')
  })

  it('outro endereço continua com a mensagem de sempre', () => {
    expect(messageForFailure('HOST_NOT_ALLOWED', 'vimeo.com')).toBe('"vimeo.com" não é um endereço do YouTube.')
  })

  it('texto sem link tem mensagem própria', () => {
    expect(messageForFailure('NO_LINK_IN_TEXT')).toContain('Não achei um link do YouTube')
  })
})
