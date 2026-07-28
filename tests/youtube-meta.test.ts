import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearMetaCacheForTests,
  defaultThumbnailUrl,
  fetchChannelMeta,
  fetchOEmbed,
  getBotPageMeta,
  getSmartPageMeta,
  pickBestThumbnail,
} from '@/server/youtube-meta'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain' } })
}

beforeEach(() => {
  clearMetaCacheForTests()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchOEmbed — corpo de erro é texto puro, não lança exceção', () => {
  it('404 (corpo "Not Found") não lança e devolve kind not-found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('Not Found', 404)))
    const r = await fetchOEmbed('https://www.youtube.com/watch?v=xxxxxxxxxxx')
    expect(r).toEqual({ ok: false, kind: 'not-found' })
  })

  it('400 (corpo "Bad Request") não lança e devolve kind bad-request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('Bad Request', 400)))
    const r = await fetchOEmbed('https://www.youtube.com/watch?v=xxxxxxxxxxx')
    expect(r).toEqual({ ok: false, kind: 'bad-request' })
  })

  it('401 devolve kind restricted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('Unauthorized', 401)))
    const r = await fetchOEmbed('https://www.youtube.com/watch?v=xxxxxxxxxxx')
    expect(r).toEqual({ ok: false, kind: 'restricted' })
  })
})

describe('fetchOEmbed — sucesso', () => {
  it('vídeo normal: isPortrait false (200x113)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          title: 'Um vídeo',
          author_name: 'Um canal',
          author_url: 'https://www.youtube.com/@UmCanal',
          thumbnail_url: 'https://i.ytimg.com/vi/xxxxxxxxxxx/hqdefault.jpg',
          width: 200,
          height: 113,
        }),
      ),
    )
    const r = await fetchOEmbed('https://www.youtube.com/watch?v=xxxxxxxxxxx')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.isPortrait).toBe(false)
  })

  it('short: isPortrait true (113x200)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          title: 'Um short',
          author_name: 'Um canal',
          author_url: 'https://www.youtube.com/@UmCanal',
          thumbnail_url: 'https://i.ytimg.com/vi/xxxxxxxxxxx/hqdefault.jpg',
          width: 113,
          height: 200,
        }),
      ),
    )
    const r = await fetchOEmbed('https://www.youtube.com/shorts/xxxxxxxxxxx')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.isPortrait).toBe(true)
  })

  it('playlist: author_url RELATIVO é normalizado para absoluto', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          title: 'Uma playlist',
          author_name: 'Um canal',
          author_url: '/@UmCanal',
          thumbnail_url: 'https://i.ytimg.com/vi/xxxxxxxxxxx/hqdefault.jpg',
          width: 480,
          height: 360,
        }),
      ),
    )
    const r = await fetchOEmbed('https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxx')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.authorUrl).toBe('https://www.youtube.com/@UmCanal')
  })

  it('título com entidades HTML mistas decodifica em uma passagem, sem dupla decodificação', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          title: 'Tom &amp; Jerry &#39;Show&#39;',
          author_name: 'x',
          author_url: 'https://www.youtube.com/@x',
          thumbnail_url: 'https://i.ytimg.com/vi/xxxxxxxxxxx/hqdefault.jpg',
          width: 480,
          height: 360,
        }),
      ),
    )
    const r = await fetchOEmbed('https://www.youtube.com/watch?v=xxxxxxxxxxx')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.title).toBe(`Tom & Jerry 'Show'`)
  })
})

describe('fetchChannelMeta — prova do teto de bytes', () => {
  function makeChannelFixture(totalBytes: number, tagAtByte: number) {
    const ogTags =
      '<meta property="og:title" content="Canal de Teste"><meta property="og:image" content="https://example.com/avatar.jpg">'
    const before = 'x'.repeat(tagAtByte)
    const after = 'y'.repeat(Math.max(0, totalBytes - tagAtByte - ogTags.length))
    const fullBytes = new TextEncoder().encode(before + ogTags + after)

    let streamed = 0
    const CHUNK = 8192
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (streamed >= fullBytes.length) {
          controller.close()
          return
        }
        const end = Math.min(streamed + CHUNK, fullBytes.length)
        controller.enqueue(fullBytes.slice(streamed, end))
        streamed = end
      },
    })

    return { response: new Response(stream, { status: 200 }), bytesStreamed: () => streamed }
  }

  it('aborta a leitura assim que acha as duas etiquetas — bem antes do documento de 1,4 MB inteiro', async () => {
    const fixture = makeChannelFixture(1_400_000, 35_000)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture.response))

    const r = await fetchChannelMeta('https://www.youtube.com/@MrBeast')

    expect(r).toEqual({
      ok: true,
      data: { title: 'Canal de Teste', imageUrl: 'https://example.com/avatar.jpg' },
    })
    // a prova: não leu o documento de 1,4 MB inteiro, ficou bem abaixo de 200 KB
    expect(fixture.bytesStreamed()).toBeLessThan(200_000)
  })

  it('se as etiquetas nunca aparecem, para no teto e não trava nem lê para sempre', async () => {
    const fixture = makeChannelFixture(2_000_000, 1_900_000) // tags além do teto de 1MB
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fixture.response))

    const r = await fetchChannelMeta('https://www.youtube.com/@SemTags')

    expect(r).toEqual({ ok: false, kind: 'no-tags' })
    // o laço checa o teto ANTES de cada leitura, então pode passar por um pedaço a mais
    // (até um tamanho de chunk) antes de parar — a propriedade real é: não lê o
    // documento de 2.000.000 bytes inteiro, para bem perto do teto de 1.000.000.
    expect(fixture.bytesStreamed()).toBeLessThan(1_100_000)
  })

  it('404 devolve not-found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))
    const r = await fetchChannelMeta('https://www.youtube.com/c/NaoExiste6000')
    expect(r).toEqual({ ok: false, kind: 'not-found' })
  })
})

describe('thumbnail — nunca confia na imagem cinza de placeholder', () => {
  it('defaultThumbnailUrl: short usa oardefault (vertical), vídeo usa hqdefault, zero rede', () => {
    const short = defaultThumbnailUrl({ kind: 'short', id: 'dQw4w9WgXcQ' })
    expect(short?.url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/oardefault.jpg')
    expect(short?.isPortrait).toBe(true)

    const video = defaultThumbnailUrl({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })
    expect(video?.url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')

    const channel = defaultThumbnailUrl({ kind: 'channelId', id: 'UCX6OQ3DkcsbYNE6H8uQQuVA' })
    expect(channel).toBeNull()
  })

  it('pickBestThumbnail: HEAD 404 com corpo pequeno (placeholder cinza) é rejeitado, cai pra hqdefault', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 404, headers: { 'content-length': '1097' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const choice = await pickBestThumbnail({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })

    expect(choice?.url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('pickBestThumbnail: HEAD 200 com tamanho razoável aceita maxresdefault', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200, headers: { 'content-length': '65324' } }))
    vi.stubGlobal('fetch', fetchMock)

    const choice = await pickBestThumbnail({ kind: 'video', id: 'dQw4w9WgXcQ', startSeconds: null })

    expect(choice?.url).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
  })
})

describe('getSmartPageMeta — cache em memória', () => {
  it('a segunda chamada para o MESMO alvo não chama fetch de novo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        title: 'Cacheado',
        author_name: 'x',
        author_url: 'https://www.youtube.com/@x',
        thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        width: 480,
        height: 360,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const target = { kind: 'video' as const, id: 'dQw4w9WgXcQ', startSeconds: null }
    const first = await getSmartPageMeta(target)
    const second = await getSmartPageMeta(target)

    expect(first.title).toBe('Cacheado')
    expect(second.title).toBe('Cacheado')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('thumbnail está sempre presente mesmo se a busca de título falhar totalmente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede fora do ar')))
    const target = { kind: 'video' as const, id: 'dQw4w9WgXcQ', startSeconds: null }

    const meta = await getSmartPageMeta(target)

    expect(meta.title).toBeNull()
    expect(meta.thumbnailUrl).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
})

describe('getBotPageMeta', () => {
  it('canal: usa a imagem do canal (900x900) quando disponível', async () => {
    const fixtureHtml =
      '<meta property="og:title" content="MrBeast"><meta property="og:image" content="https://yt3.googleusercontent.com/avatar.jpg">'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(fixtureHtml, { status: 200 })))

    const meta = await getBotPageMeta({ kind: 'handle', handle: 'MrBeast' })

    expect(meta.imageUrl).toBe('https://yt3.googleusercontent.com/avatar.jpg')
    expect(meta.imageWidth).toBe(900)
    expect(meta.imageHeight).toBe(900)
  })
})
