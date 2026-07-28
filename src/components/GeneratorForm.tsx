'use client'

import { useMemo, useState } from 'react'
import { buildShortPath } from '@/core/build-url'
import { parseShareUrl } from '@/core/parse-youtube-url'
import styles from './GeneratorForm.module.css'
import { messageForFailure } from './messages'

/**
 * O ÚNICO componente cliente que importa de src/core. A validação aqui é exatamente a
 * mesma função que as rotas do servidor usam (parseShareUrl importa de src/core/ids.ts,
 * timestamp.ts — os mesmos módulos). Ver SPEC.md §2.4.
 */
export function GeneratorForm() {
  const [input, setInput] = useState('')
  const [generatedPath, setGeneratedPath] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const trimmed = input.trim()
  const parseResult = useMemo(() => (trimmed ? parseShareUrl(trimmed) : null), [trimmed])

  function handleInputChange(value: string) {
    setInput(value)
    setGeneratedPath(null)
    setCopied(false)
  }

  function handleGenerate() {
    if (parseResult?.ok) {
      setGeneratedPath(buildShortPath(parseResult.target))
      setCopied(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fullLink = generatedPath ? `${origin}${generatedPath}` : null

  async function handleCopy() {
    if (!fullLink) return
    try {
      await navigator.clipboard.writeText(fullLink)
      setCopied(true)
    } catch {
      // clipboard pode falhar por permissão do navegador — o campo continua
      // selecionável manualmente, então a cópia nunca fica impossível.
    }
  }

  return (
    <div className={styles.card}>
      <label htmlFor="youtube-url" className={styles.label}>
        Cole o link do YouTube
      </label>
      <input
        id="youtube-url"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="https://www.youtube.com/watch?v=..."
        value={input}
        onChange={(e) => handleInputChange(e.target.value)}
        className={styles.input}
      />

      {parseResult && !parseResult.ok && (
        <p className={styles.error} role="alert">
          {messageForFailure(parseResult.reason, parseResult.detail)}
        </p>
      )}

      {parseResult?.ok && parseResult.ignoredPlaylist && (
        <p className={styles.notice}>A playlist foi ignorada — o vídeo abre sozinho.</p>
      )}

      <button type="button" onClick={handleGenerate} disabled={!parseResult?.ok} className={styles.generateButton}>
        Gerar link
      </button>

      {fullLink && (
        <>
          <div className={styles.resultRow}>
            <input
              readOnly
              value={fullLink}
              className={styles.resultField}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Link gerado"
            />
            <button type="button" onClick={handleCopy} className={styles.copyButton}>
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className={styles.helperText}>Sem cadastro, sem login, sem limite de links.</p>
        </>
      )}
    </div>
  )
}
