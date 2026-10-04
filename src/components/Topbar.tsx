import { SITE_TEQUEMEDIA } from './links'

export function Topbar() {
  return (
    <header className="tq-conteiner tq-topo">
      <a className="tq-topo__logo" href={SITE_TEQUEMEDIA} aria-label="TequeMedia, página inicial">
        {/* Arquivo original do logotipo, intacto. O guia visual proíbe redesenhar ou redigitar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-tequemedia-horizontal.svg" alt="" width={1013} height={402} />
      </a>
      <a className="tq-botao tq-botao--claro tq-botao--p op-link-casa" href={SITE_TEQUEMEDIA}>
        Conhecer a TequeMedia
      </a>
    </header>
  )
}
