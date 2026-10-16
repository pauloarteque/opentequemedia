'use client'

import { useEffect, useRef, useState } from 'react'
import { buildShortPath } from '@/core/build-url'
import { parseOpenUrl } from '@/core/parse-openteque-path'
import { parseSharedText } from '@/core/parse-youtube-url'
import { Convite } from './Convite'
import { SetaManuscrita } from './Icones'
import { JanelaControles } from './JanelaControles'
import { messageForFailure } from './messages'

/**
 * Convite para o diagnóstico. Sobe uma vez, depois que a pessoa já tem o link, nunca antes.
 * Os prazos estão aqui em cima para serem mexidos sem caçar no componente. Ver SPEC.md §7.
 */
export const ESPERA_APOS_COPIAR_MS = 1500
export const ESPERA_SEM_COPIAR_MS = 20000
export const DESCANSO_DIAS = 14
export const DESCANSO_CLIQUE_DIAS = 60
export const CHAVE_DESCANSO = 'open-tq-convite-ate'

const MS_POR_DIA = 86_400_000

type Estado =
  | { tipo: 'vazio' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'pronto'; link: string; ignorouPlaylist: boolean; veioDeTexto: boolean }

/** Data até a qual o convite fica quieto. Guarda só isso, nenhum link e nenhum destino. */
function lerDescanso(): number {
  try {
    return Number(window.localStorage.getItem(CHAVE_DESCANSO) ?? 0)
  } catch {
    // armazenamento bloqueado: o convite só perde a memória entre visitas
    return 0
  }
}

function gravarDescanso(dias: number): void {
  try {
    window.localStorage.setItem(CHAVE_DESCANSO, String(Date.now() + dias * MS_POR_DIA))
  } catch {
    // mesmo caso do lerDescanso, nada a fazer
  }
}

function lerEndereco(texto: string): URL | null {
  try {
    return new URL(texto)
  } catch {
    return null
  }
}

/**
 * A pessoa colou de volta um link desta ferramenta? Diz se a rota abriria ele ('inteiro')
 * ou não ('quebrado'), para a recusa não prometer que um link cortado funciona.
 */
function conferirLinkDoOpen(texto: string): 'inteiro' | 'quebrado' | undefined {
  const host = window.location.hostname
  if (!host) return undefined
  for (const palavra of texto.trim().split(/\s+/)) {
    const url = lerEndereco(palavra) ?? lerEndereco(`https://${palavra}`)
    if (url === null || url.hostname !== host) continue
    return parseOpenUrl(url).ok ? 'inteiro' : 'quebrado'
  }
  return undefined
}

/** Cópia pelo comando antigo do navegador, para quando a API de área de transferência
 * está bloqueada (permissão negada, navegador interno de app). Exige o texto selecionado. */
function copiarPeloComandoAntigo(): boolean {
  try {
    return typeof document.execCommand === 'function' && document.execCommand('copy')
  } catch {
    return false
  }
}

/**
 * O ÚNICO componente cliente que importa de src/core. A validação aqui é exatamente a
 * mesma função que as rotas do servidor usam (parseSharedText chama parseShareUrl, que
 * importa de src/core/ids.ts, timestamp.ts, os mesmos módulos). Ver SPEC.md §2.4.
 */
export function GeneratorForm() {
  const [input, setInput] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'vazio' })
  const [copiado, setCopiado] = useState(false)
  const [conviteAberto, setConviteAberto] = useState(false)
  const [copiaManual, setCopiaManual] = useState(false)
  const [podeColar, setPodeColar] = useState(false)
  const [anuncio, setAnuncio] = useState('')

  const campoRef = useRef<HTMLInputElement>(null)
  const geradoRef = useRef<HTMLTextAreaElement>(null)
  const resultadoRef = useRef<HTMLDivElement>(null)
  const relogioRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const conviteVistoRef = useRef(false)

  const link = estado.tipo === 'pronto' ? estado.link : null

  function pararRelogio() {
    if (relogioRef.current !== null) {
      clearTimeout(relogioRef.current)
      relogioRef.current = null
    }
  }

  function podeConvidar(): boolean {
    return !conviteVistoRef.current && Date.now() > lerDescanso()
  }

  function abrirConvite() {
    relogioRef.current = null
    if (!podeConvidar() || document.hidden) return
    conviteVistoRef.current = true
    gravarDescanso(DESCANSO_DIAS)
    setConviteAberto(true)
  }

  function agendarConvite(esperaMs: number) {
    pararRelogio()
    if (!podeConvidar()) return
    relogioRef.current = setTimeout(abrirConvite, esperaMs)
  }

  // O botão Colar só aparece em tela de toque com leitura de área de transferência. É
  // decidido depois de montar, para o HTML do servidor e o do navegador nascerem iguais.
  useEffect(() => {
    const toque = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    setPodeColar(toque && typeof navigator.clipboard?.readText === 'function')
  }, [])

  // desmontou, o relógio morre junto
  useEffect(() => {
    return () => {
      if (relogioRef.current !== null) clearTimeout(relogioRef.current)
    }
  }, [])

  // No celular o resultado nasce abaixo da dobra. Fecha o teclado e traz o link para a tela.
  useEffect(() => {
    if (link === null) return
    campoRef.current?.blur()
    const calmo =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    resultadoRef.current?.scrollIntoView?.({ block: 'nearest', behavior: calmo ? 'auto' : 'smooth' })
  }, [link])

  // O link gerado aparece inteiro. A caixa cresce até caber o texto, também ao girar a tela.
  useEffect(() => {
    if (link === null) return
    function ajustarAltura() {
      const campo = geradoRef.current
      if (!campo) return
      campo.style.height = 'auto'
      campo.style.height = `${campo.scrollHeight + campo.offsetHeight - campo.clientHeight}px`
    }
    ajustarAltura()
    // a fonte da marca pode chegar depois e mudar a largura das letras
    document.fonts?.ready.then(ajustarAltura).catch(() => {})
    window.addEventListener('resize', ajustarAltura)
    return () => window.removeEventListener('resize', ajustarAltura)
  }, [link])

  useEffect(() => {
    if (!conviteAberto) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setConviteAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [conviteAberto])

  function limpar() {
    pararRelogio()
    setEstado({ tipo: 'vazio' })
    setCopiado(false)
    setCopiaManual(false)
  }

  function gerar(valor: string) {
    pararRelogio()
    setCopiado(false)
    setCopiaManual(false)

    const resultado = parseSharedText(valor)
    if (!resultado.ok) {
      const linkDoOpen =
        resultado.reason === 'HOST_NOT_ALLOWED' && resultado.detail === window.location.hostname
          ? conferirLinkDoOpen(valor)
          : undefined
      setEstado({ tipo: 'erro', mensagem: messageForFailure(resultado.reason, resultado.detail, linkDoOpen) })
      return
    }

    setEstado({
      tipo: 'pronto',
      link: `${window.location.origin}${buildShortPath(resultado.target)}`,
      ignorouPlaylist: resultado.ignoredPlaylist === true,
      veioDeTexto: /\s/.test(valor.trim()),
    })
    setAnuncio('Link gerado. Use o botão Copiar.')
    agendarConvite(ESPERA_SEM_COPIAR_MS)
  }

  function marcarCopiado() {
    setCopiado(true)
    setCopiaManual(false)
    setAnuncio('Link copiado.')
    agendarConvite(ESPERA_APOS_COPIAR_MS)
  }

  async function copiar() {
    if (link === null) return
    try {
      await navigator.clipboard.writeText(link)
      marcarCopiado()
    } catch {
      // A API pode estar bloqueada por permissão ou pelo navegador interno de um app.
      // Seleciona o link e tenta o comando antigo. Se nem ele copiar, o link fica
      // selecionado e a dica diz para copiar na mão, então a cópia nunca fica impossível.
      geradoRef.current?.focus()
      geradoRef.current?.select()
      if (copiarPeloComandoAntigo()) {
        marcarCopiado()
        return
      }
      setCopiaManual(true)
      setAnuncio('Não deu para copiar sozinho. O link está selecionado, copie com o menu do aparelho.')
      agendarConvite(ESPERA_SEM_COPIAR_MS)
    }
  }

  async function colar() {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto.trim().length === 0) {
        campoRef.current?.focus()
        return
      }
      setInput(texto)
      gerar(texto)
    } catch {
      // permissão negada: a pessoa cola no campo do jeito de sempre
      campoRef.current?.focus()
    }
  }

  function gerarOutro() {
    setConviteAberto(false)
    setInput('')
    limpar()
    campoRef.current?.focus()
  }

  return (
    <>
      <div className="tq-janela">
        <div className="tq-janela__barra">
          <span>Open TequeMedia</span>
          <JanelaControles />
        </div>

        <form
          className="tq-janela__corpo op-gerador"
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault()
            gerar(input)
          }}
        >
          <div>
            <div className="op-gerador__topo">
              <label className="tq-rotulo" htmlFor="youtube-url">
                Cole o link do YouTube
              </label>
              {podeColar && (
                <button type="button" className="tq-botao tq-botao--claro tq-botao--p op-colar" onClick={colar}>
                  Colar
                </button>
              )}
            </div>
            <input
              ref={campoRef}
              id="youtube-url"
              className="tq-campo"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="https://www.youtube.com/watch?v=..."
              value={input}
              aria-invalid={estado.tipo === 'erro' ? true : undefined}
              onChange={(evento) => {
                setInput(evento.target.value)
                limpar()
              }}
              onPaste={() => {
                // Colou, gerou. O valor só existe no campo depois que o evento termina.
                setTimeout(() => gerar(campoRef.current?.value ?? ''), 0)
              }}
            />
          </div>

          {estado.tipo === 'erro' && (
            <p className="tq-erro" role="alert">
              {estado.mensagem}
            </p>
          )}

          {estado.tipo === 'pronto' && estado.veioDeTexto && (
            <p className="tq-balao">Peguei só o link do YouTube que estava no meio do texto.</p>
          )}

          {estado.tipo === 'pronto' && estado.ignorouPlaylist && (
            <p className="tq-balao">Seu link tinha uma playlist. Vai abrir só o vídeo.</p>
          )}

          {/* Com o link pronto, o laranja passa para o Copiar, que é o próximo passo. */}
          <button
            type="submit"
            className={estado.tipo === 'pronto' ? 'tq-botao tq-botao--largo tq-botao--claro' : 'tq-botao tq-botao--largo'}
          >
            Gerar link
          </button>

          {estado.tipo === 'pronto' && (
            <div ref={resultadoRef} className="op-resultado">
              <div className="op-resultado__linha">
                {/* textarea para o link aparecer inteiro, quebrando linha, em vez de cortado */}
                <textarea
                  ref={geradoRef}
                  readOnly
                  rows={1}
                  value={estado.link}
                  className="tq-campo op-resultado__campo"
                  onFocus={(evento) => evento.currentTarget.select()}
                  aria-label="Link gerado"
                />
                <button type="button" onClick={copiar} className="tq-botao tq-botao--largo">
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              {copiaManual && (
                <p className="op-resultado__dica">
                  Não deu para copiar sozinho. O link já está selecionado, é só copiar com o menu do aparelho.
                </p>
              )}
              <p className="op-resultado__nota">
                <SetaManuscrita />
                <span className="tq-chamada">Vai no Story e na bio</span>
              </p>
            </div>
          )}

          <p className="op-ajuda">Sem limite de links. Volte e gere um a cada vídeo novo.</p>
          <p className="tq-oculto" role="status" aria-live="polite">
            {anuncio}
          </p>
        </form>
      </div>

      {conviteAberto && (
        <Convite
          copiado={copiado}
          onFechar={() => setConviteAberto(false)}
          onAcao={() => {
            gravarDescanso(DESCANSO_CLIQUE_DIAS)
            setConviteAberto(false)
          }}
          onGerarOutro={gerarOutro}
        />
      )}
    </>
  )
}
