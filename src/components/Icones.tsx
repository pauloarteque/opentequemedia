/**
 * Marcadores em traço reto. A cor nunca vai escrita aqui, vem das classes .tq-svg-* de
 * modelo-web.css, que por sua vez leem src/core/tokens.ts.
 */

export function Marcador({ tipo }: { tipo: 'certo' | 'errado' }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true">
      <rect
        className={tipo === 'certo' ? 'tq-svg-caixa--laranja' : 'tq-svg-caixa'}
        x="1.5"
        y="1.5"
        width="23"
        height="23"
        rx="5"
        strokeWidth="3"
      />
      <path
        className="tq-svg-traco"
        d={tipo === 'certo' ? 'M7.5 13.5l3.5 3.5 7.5-8' : 'M8.5 8.5l9 9M17.5 8.5l-9 9'}
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  )
}

export function Seta({ tamanho }: { tamanho: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true">
      <path className="tq-svg-traco" d="M4 12h15M13 5l7 7-7 7" strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

export function Fechar() {
  return (
    <svg viewBox="0 0 18 18" width="22" height="22" aria-hidden="true">
      <rect className="tq-svg-caixa" x="1" y="1" width="16" height="16" rx="3" strokeWidth="2" />
      <path className="tq-svg-traco" d="M6 6l6 6M12 6l-6 6" strokeWidth="2" strokeLinecap="square" />
    </svg>
  )
}

export function SetaManuscrita() {
  return (
    <svg viewBox="0 0 34 34" aria-hidden="true">
      <path className="tq-svg-traco" d="M29 30C17 29 9 22 8 7" strokeWidth="2.6" strokeLinecap="round" />
      <path
        className="tq-svg-traco"
        d="M3 13l5-7 6 6"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
