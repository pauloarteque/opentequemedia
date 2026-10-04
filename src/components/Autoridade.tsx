import { Seta } from './Icones'
import { LINK_DIAGNOSTICO_FAIXA } from './links'

// Só credenciais confirmadas da casa. Número novo entra aqui apenas depois de conferido.
const PROVAS = [
  { numero: '25 bilhões', legenda: 'de views geradas em 3 anos' },
  { numero: '35 milhões', legenda: 'de inscritos gerenciados' },
  { numero: 'Mais de 100', legenda: 'canais de clientes' },
] as const

/** Faixa laranja de autoridade. A única área cheia de laranja da página. */
export function Autoridade() {
  return (
    <section className="tq-faixa">
      <div className="tq-conteiner tq-secao op-autoridade">
        <h2 className="tq-adesivo op-autoridade__titulo">A maior aceleradora de canais do YouTube do Brasil</h2>

        <div className="tq-prova">
          {PROVAS.map((prova) => (
            <div key={prova.numero} className="tq-cartao tq-prova__item">
              <span className="tq-prova__numero">{prova.numero}</span>
              <span className="tq-prova__legenda">{prova.legenda}</span>
            </div>
          ))}
        </div>

        <div className="op-autoridade__acao">
          <p>
            Você já vende um produto de alto valor? A TequeMedia estrutura o seu YouTube como canal de vendas, com
            estratégia e leitura de dado.
          </p>
          <a className="tq-botao tq-botao--claro tq-botao--g" href={LINK_DIAGNOSTICO_FAIXA}>
            Agendar meu diagnóstico
            <Seta tamanho={24} />
          </a>
        </div>
      </div>
    </section>
  )
}
