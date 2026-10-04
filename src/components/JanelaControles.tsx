/** Os três controles da barra de janela, componente central da marca. Só enfeite, sem ação. */
export function JanelaControles() {
  return (
    <svg className="tq-janela__controles" viewBox="0 0 66 18" aria-hidden="true">
      <g className="tq-svg-caixa" strokeWidth="2">
        <rect x="1" y="1" width="16" height="16" rx="3" />
        <rect x="25" y="1" width="16" height="16" rx="3" />
        <rect x="49" y="1" width="16" height="16" rx="3" />
      </g>
      <g className="tq-svg-traco" strokeWidth="2" strokeLinecap="square">
        <path d="M6 12h6" />
        <rect x="30" y="6" width="6" height="6" />
        <path d="M54 6l6 6M60 6l-6 6" />
      </g>
    </svg>
  )
}
