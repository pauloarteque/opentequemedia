import { SITE_TEQUEMEDIA } from './links'
// Importado como arquivo estático, para sair por /_next/static/media. A hospedagem não
// serve a pasta public/, e o logotipo voltava 404 quando era pedido por lá.
import logo from './logo-tequemedia-horizontal.svg'

export function Topbar() {
  return (
    <header className="tq-conteiner tq-topo">
      <a className="tq-topo__logo" href={SITE_TEQUEMEDIA} aria-label="TequeMedia, página inicial">
        {/* Arquivo original do logotipo, intacto. O guia visual proíbe redesenhar ou redigitar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt="" width={1013} height={402} />
      </a>
      <a className="tq-botao tq-botao--claro tq-botao--p op-link-casa" href={SITE_TEQUEMEDIA}>
        Conhecer a TequeMedia
      </a>
    </header>
  )
}
