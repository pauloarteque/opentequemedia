import 'server-only'
import { ERROR_PAGE_TOKEN_NAMES, subsetTokensToCssVars } from '@/core/tokens'

/**
 * Página de link quebrado. É o que a superfície 2 mostra quando o prefixo existe mas o
 * identificador não passa, ou o caminho não forma link nenhum. Quem vê é o público do
 * cliente, então continua sem marca, sem logotipo e sem o nome da casa. Diz o que aconteceu,
 * o que fazer, e dá uma saída para o YouTube, sem adivinhar destino. HTML fixo, sem script
 * e sem rede. Ver SPEC.md §3, "Página de link quebrado".
 */

// Só a página inicial do YouTube. Nunca um destino montado a partir do caminho recusado.
const YOUTUBE_HOME = 'https://www.youtube.com/'

// Um link partido em dois. A metade da direita se solta uma vez ao carregar, e fica parada
// para quem pede menos movimento. Tudo em cinza, para o botão ser o único laranja da tela,
// como na página inteligente. Cor só por classe, que lê os tokens.
const ILLUSTRATION = `<svg class="art" viewBox="0 0 220 96" aria-hidden="true" focusable="false">
<g class="half">
<path d="M38 20H102L108 30L100 40L109 50L101 60L107 70L102 76H38A28 28 0 0 1 38 20Z"/>
<rect class="bar" x="30" y="43" width="50" height="10" rx="5"/>
</g>
<g class="half half--loose">
<path d="M112 20H182A28 28 0 0 1 182 76H112L117 70L111 60L119 50L110 40L118 30Z"/>
<rect class="bar" x="128" y="43" width="38" height="10" rx="5"/>
</g>
<g class="spark">
<path d="M110 11V3M101 14L96 8M119 14L124 8"/>
</g>
</svg>`

function renderStyle(): string {
  const vars = subsetTokensToCssVars(ERROR_PAGE_TOKEN_NAMES)
  // Os nomes de variável com dígito saem com hífen (--font-size-h-2), ver cssVarName.
  return `${vars}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{min-height:100vh;min-height:100dvh;display:grid;place-items:center;background:var(--color-bg);color:var(--color-text);font-family:var(--font-family);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;text-size-adjust:100%;padding:max(var(--space-8),env(safe-area-inset-top)) max(var(--space-6),env(safe-area-inset-right)) max(var(--space-8),env(safe-area-inset-bottom)) max(var(--space-6),env(safe-area-inset-left))}
main{width:100%;max-width:340px;margin-bottom:8vh;display:grid;justify-items:center;text-align:center}
.art{width:184px;max-width:100%;height:auto;overflow:visible;margin-bottom:var(--space-8)}
.half path{fill:var(--color-surface-raised);stroke:var(--color-text-disabled);stroke-width:2;stroke-linejoin:round}
.bar{fill:var(--color-text-muted)}
.half--loose{transform:translate(6px,9px) rotate(9deg);transform-box:fill-box;transform-origin:0 50%}
.spark path{fill:none;stroke:var(--color-text-muted);stroke-width:3;stroke-linecap:round}
h1{margin:0;font-size:var(--font-size-h-2);line-height:var(--line-height-h-2);font-weight:700;letter-spacing:-0.015em;text-wrap:balance}
p{margin:var(--space-3) 0 0;max-width:30ch;color:var(--color-text-secondary);font-size:var(--font-size-body);line-height:var(--line-height-body);text-wrap:balance}
.btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:3.25rem;margin-top:var(--space-8);padding:var(--space-3) var(--space-4);border-radius:var(--radius-md);background:var(--color-primary);color:var(--color-bg);font-size:1rem;font-weight:600;text-decoration:none;-webkit-tap-highlight-color:transparent}
@media (hover:hover){.btn:hover{background:var(--color-primary-hover)}}
.btn:active{background:var(--color-primary-active)}
.btn:focus-visible{outline:2px solid var(--color-focus-ring);outline-offset:3px}
@media (prefers-reduced-motion:no-preference){
.half--loose{animation:solta 600ms cubic-bezier(.2,.9,.3,1.25) 200ms both}
.spark{animation:aparece 500ms ease-out 560ms both}
@keyframes solta{from{transform:none}}
@keyframes aparece{from{opacity:0;transform:translateY(3px)}}
}`
}

export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="dark">
<title>Link quebrado</title>
<style>${renderStyle()}</style>
</head>
<body>
<main>
${ILLUSTRATION}
<h1>Esse link chegou quebrado</h1>
<p>Ele pode estar cortado ou com algum texto grudado. Peça o link de novo a quem compartilhou ou procure o vídeo no YouTube.</p>
<a class="btn" href="${YOUTUBE_HOME}">Ir para o YouTube</a>
</main>
</body>
</html>
`
}
