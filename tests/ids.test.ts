import { describe, expect, it } from 'vitest'
import { isChannelId, isHandleBody, isLegacyName, isPersonalPlaylistId, isPlaylistId, isVideoId } from '@/core/ids'

describe('isVideoId', () => {
  it('aceita exatamente 11 caracteres do conjunto válido', () => {
    expect(isVideoId('dQw4w9WgXcQ')).toBe(true)
    expect(isVideoId('a-b_c-d_e-1')).toBe(true)
  })

  it('recusa 10 caracteres', () => {
    expect(isVideoId('dQw4w9WgXc')).toBe(false)
  })

  it('recusa 12 caracteres', () => {
    expect(isVideoId('dQw4w9WgXcQQ')).toBe(false)
  })

  it('recusa caractere fora do conjunto', () => {
    expect(isVideoId('dQw4w9Wg!cQ')).toBe(false)
    expect(isVideoId('dQw4w9Wg cQ')).toBe(false)
  })
})

describe('isChannelId', () => {
  it('aceita UC + 22 caracteres', () => {
    expect(isChannelId('UCX6OQ3DkcsbYNE6H8uQQuVA')).toBe(true)
  })

  it('recusa sem prefixo UC', () => {
    expect(isChannelId('UDX6OQ3DkcsbYNE6H8uQQuVA')).toBe(false)
  })

  it('recusa comprimento errado', () => {
    expect(isChannelId('UCX6OQ3DkcsbYNE6H8uQQuV')).toBe(false)
    expect(isChannelId('UCX6OQ3DkcsbYNE6H8uQQuVAA')).toBe(false)
  })
})

describe('isHandleBody (sem o @)', () => {
  it('aceita entre 3 e 30 caracteres', () => {
    expect(isHandleBody('abc')).toBe(true)
    expect(isHandleBody('a'.repeat(30))).toBe(true)
  })

  it('recusa menos de 3 ou mais de 30', () => {
    expect(isHandleBody('ab')).toBe(false)
    expect(isHandleBody('a'.repeat(31))).toBe(false)
  })

  it('recusa espaço e delimitadores de caminho/consulta', () => {
    expect(isHandleBody('mr beast')).toBe(false)
    expect(isHandleBody('mr/beast')).toBe(false)
    expect(isHandleBody('mr?beast')).toBe(false)
    expect(isHandleBody('mr#beast')).toBe(false)
  })
})

describe('isLegacyName (/c/nome, /user/nome)', () => {
  it('aceita alfanumérico com hífen e underscore', () => {
    expect(isLegacyName('veritasium')).toBe(true)
    expect(isLegacyName('Mr-Beast_6000')).toBe(true)
  })

  it('recusa vazio', () => {
    expect(isLegacyName('')).toBe(false)
  })
})

describe('isPersonalPlaylistId', () => {
  it('reconhece WL, LL e FL como pessoais', () => {
    expect(isPersonalPlaylistId('WL')).toBe(true)
    expect(isPersonalPlaylistId('LL')).toBe(true)
    expect(isPersonalPlaylistId('FL')).toBe(true)
  })

  it('não reconhece PL, UU ou RD como pessoais', () => {
    expect(isPersonalPlaylistId('PLC77007E23FF423C6')).toBe(false)
    expect(isPersonalPlaylistId('UUX6OQ3DkcsbYNE6H8uQQuVA')).toBe(false)
    expect(isPersonalPlaylistId('RDdQw4w9WgXcQ')).toBe(false)
  })
})

describe('isPlaylistId', () => {
  it('aceita PL longo (moderno) e curto (legado)', () => {
    expect(isPlaylistId('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true)
    expect(isPlaylistId('PLC77007E23FF423C6')).toBe(true)
  })

  it('aceita UU (uploads) e variantes UULF/UUSH', () => {
    expect(isPlaylistId('UUX6OQ3DkcsbYNE6H8uQQuVA')).toBe(true)
    expect(isPlaylistId('UULFX6OQ3DkcsbYNE6H8uQQuVA')).toBe(true)
    expect(isPlaylistId('UUSHX6OQ3DkcsbYNE6H8uQQuVA')).toBe(true)
  })

  it('aceita álbum OLAK5uy_ e mix RD', () => {
    expect(isPlaylistId('OLAK5uy_lZUq4jUdHFXFVVoBrySFOgeCqZ8AeBcE')).toBe(true)
    expect(isPlaylistId('RDdQw4w9WgXcQ')).toBe(true)
  })

  it('recusa WL, LL, FL — são pessoais, checadas separadamente', () => {
    expect(isPlaylistId('WL')).toBe(false)
    expect(isPlaylistId('LL')).toBe(false)
    expect(isPlaylistId('FL')).toBe(false)
  })

  it('recusa string vazia e lixo aleatório', () => {
    expect(isPlaylistId('')).toBe(false)
    expect(isPlaylistId('XYZ123')).toBe(false)
  })
})
