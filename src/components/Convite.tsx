import { Fechar, Seta } from './Icones'
import { LINK_DIAGNOSTICO_CONVITE } from './links'

interface ConviteProps {
  /** true quando a pessoa já copiou o link. Só muda o título da barra. */
  copiado: boolean
  onFechar: () => void
  onAcao: () => void
  onGerarOutro: () => void
}

/**
 * Convite para o diagnóstico. Janela que sobe depois que a pessoa já tem o link, nunca
 * antes. Não escurece nem trava a página, e a saída devolve a pessoa para o gerador.
 * Quando e com que frequência ela aparece é decidido em GeneratorForm. Ver SPEC.md §7.
 */
export function Convite({ copiado, onFechar, onAcao, onGerarOutro }: ConviteProps) {
  return (
    <div className="tq-convite" role="dialog" aria-labelledby="convite-titulo" aria-describedby="convite-texto">
      <div className="tq-janela">
        <div className="tq-janela__barra">
          <span>{copiado ? 'Link copiado' : 'Link pronto'}</span>
          <button className="tq-convite__fechar" type="button" aria-label="Fechar" onClick={onFechar}>
            <Fechar />
          </button>
        </div>
        <div className="tq-convite__corpo">
          <h2 className="tq-h3" id="convite-titulo">
            Boa. Seu link já pode ir pro Instagram.
          </h2>
          <p id="convite-texto">
            Seu público no vídeo é só o começo. Se você vende um produto de alto valor, a TequeMedia mostra como fazer
            o YouTube vender por você.
          </p>
          <a className="tq-botao tq-botao--largo" href={LINK_DIAGNOSTICO_CONVITE} onClick={onAcao}>
            Agendar meu diagnóstico
            <Seta tamanho={20} />
          </a>
          <button className="tq-convite__dispensar" type="button" onClick={onGerarOutro}>
            Gerar outro link
          </button>
        </div>
      </div>
    </div>
  )
}
