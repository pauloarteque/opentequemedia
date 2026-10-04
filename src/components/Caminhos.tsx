import { Marcador } from './Icones'
import { JanelaControles } from './JanelaControles'

const COMUM = [
  { titulo: 'Abre no navegador interno.', texto: 'O vídeo roda dentro do Instagram, fora do app do YouTube.' },
  { titulo: 'Chega deslogado.', texto: 'A conta do YouTube do seu público não vem junto.' },
  { titulo: 'Trava na inscrição.', texto: 'Antes de se inscrever, seu público precisa parar e fazer login no Google.' },
] as const

const OPEN = [
  { titulo: 'Abre no app.', texto: 'Seu público cai direto no YouTube, fora do Instagram.' },
  { titulo: 'Já logado.', texto: 'Quem tem o app instalado entra na própria conta, sem senha.' },
  { titulo: 'Treina o YouTube.', texto: 'Quem assiste logado tende a ver você de novo.' },
] as const

/** Comparação lado a lado do link comum contra o link gerado aqui. */
export function Caminhos() {
  return (
    <section className="tq-conteiner tq-secao op-caminhos">
      <div className="op-caminhos__titulo">
        <h2 className="tq-h2">Mesmo vídeo, dois caminhos</h2>
        <p className="tq-apoio">O que muda é onde o link abre quando alguém toca nele dentro do Instagram.</p>
      </div>

      <div className="op-caminhos__grade">
        <article className="tq-cartao op-caminho op-caminho--comum">
          <div className="op-caminho__cabeca">Link comum do YouTube</div>
          <div className="op-caminho__corpo">
            <ul className="tq-lista">
              {COMUM.map((item) => (
                <li key={item.titulo}>
                  <Marcador tipo="errado" />
                  <span>
                    <strong>{item.titulo}</strong> {item.texto}
                  </span>
                </li>
              ))}
            </ul>
            <p className="op-caminho__fecho">Cada tela a mais é gente que desiste antes de se inscrever.</p>
          </div>
        </article>

        <article className="tq-janela op-caminho">
          <div className="tq-janela__barra">
            <span>Link pelo Open TequeMedia</span>
            <JanelaControles />
          </div>
          <div className="op-caminho__corpo">
            <ul className="tq-lista">
              {OPEN.map((item) => (
                <li key={item.titulo}>
                  <Marcador tipo="certo" />
                  <span>
                    <strong>{item.titulo}</strong> {item.texto}
                  </span>
                </li>
              ))}
            </ul>
            <p className="op-caminho__fecho">Inscrição, curtida e comentário ficam a um toque.</p>
          </div>
        </article>
      </div>
    </section>
  )
}
