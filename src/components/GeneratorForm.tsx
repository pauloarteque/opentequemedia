'use client'

import { useEffect, useRef, useState } from 'react'
import { buildShortPath } from '@/core/build-url'
import { parseShareUrl } from '@/core/parse-youtube-url'
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
  | { tipo: 'pronto'; link: string; ignorouPlaylist: boolean }

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

/**
 * O ÚNICO componente cliente que importa de src/core. A validação aqui é exatamente a
 * mesma função que as rotas do servidor usam (parseShareUrl importa de src/core/ids.ts,
 * timestamp.ts, os mesmos módulos). Ver SPEC.md §2.4.
 */
export function GeneratorForm() {
  const [input, setInput] = useState('')
  const [estado, setEstado] = useState<Estado>({ tipo: 'vazio' })
  const [copiado, setCopiado] = useState(false)
  const [conviteAberto, setConviteAberto] = useState(false)

  const campoRef = useRef<HTMLInputElement>(null)
  const geradoRef = useRef<HTMLInputElement>(null)
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
  }

  function gerar(valor: string) {
    pararRelogio()
    setCopiado(false)

    const resultado = parseShareUrl(valor)
    if (!resultado.ok) {
      setEstado({ tipo: 'erro', mensagem: messageForFailure(resultado.reason, resultado.detail) })
      return
    }

    setEstado({
      tipo: 'pronto',
      link: `${window.location.origin}${buildShortPath(resultado.target)}`,
      ignorouPlaylist: resultado.ignoredPlaylist === true,
    })
    agendarConvite(ESPERA_SEM_COPIAR_MS)
  }

  async function copiar() {
    if (link === null) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      agendarConvite(ESPERA_APOS_COPIAR_MS)
    } catch {
      // clipboard pode falhar por permissão do navegador. O campo fica selecionado,
      // então a cópia nunca fica impossível.
      geradoRef.current?.focus()
      geradoRef.current?.select()
      agendarConvite(ESPERA_SEM_COPIAR_MS)
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
            <label className="tq-rotulo" htmlFor="youtube-url">
              Cole o link do YouTube
            </label>
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

          {estado.tipo === 'pronto' && estado.ignorouPlaylist && (
            <p className="tq-balao">Seu link tinha uma playlist. Vai abrir só o vídeo.</p>
          )}

          <button type="submit" className="tq-botao tq-botao--largo">
            Gerar link
          </button>

          {estado.tipo === 'pronto' && (
            <div ref={resultadoRef} className="op-resultado">
              <div className="op-resultado__linha">
                <input
                  ref={geradoRef}
                  readOnly
                  value={estado.link}
                  className="tq-campo op-resultado__campo"
                  onFocus={(evento) => evento.currentTarget.select()}
                  aria-label="Link gerado"
                />
                <button type="button" onClick={copiar} className="tq-botao tq-botao--noite tq-botao--p">
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="op-resultado__nota">
                <SetaManuscrita />
                <span className="tq-chamada">Vai no Story e na bio</span>
              </p>
            </div>
          )}

          <p className="op-ajuda">Sem limite de links. Volte e gere um a cada vídeo novo.</p>
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
