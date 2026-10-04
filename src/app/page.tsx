import { Autoridade } from '@/components/Autoridade'
import { Caminhos } from '@/components/Caminhos'
import { GeneratorForm } from '@/components/GeneratorForm'
import { Rodape } from '@/components/Rodape'
import { Topbar } from '@/components/Topbar'
import './open.css'

export default function HomePage() {
  return (
    <div className="tq-grade">
      <Topbar />
      <main>
        <section className="tq-conteiner op-heroi">
          <div className="op-heroi__texto">
            <span className="tq-selo">Grátis e sem cadastro</span>
            <h1 className="tq-heroi">
              Crie seu link.
              <br />
              Aumente sua conversão do Instagram <span className="tq-marca">pro YouTube.</span>
            </h1>
            <p className="tq-apoio">
              Link do YouTube no Instagram abre no navegador interno. Lá seu público chega deslogado, e sem login não
              se inscreve nem curte.
            </p>
          </div>

          <div className="op-heroi__ferramenta">
            <svg className="op-rabisco" viewBox="0 0 260 220" aria-hidden="true">
              <path
                className="tq-svg-rabisco"
                d="M14 150 C 40 40, 150 10, 196 62 C 236 108, 170 176, 118 142 C 74 112, 128 58, 176 84 C 214 106, 236 150, 248 204"
                strokeWidth="13"
                strokeLinecap="round"
              />
            </svg>
            <GeneratorForm />
          </div>
        </section>

        <Caminhos />
        <Autoridade />
      </main>
      <Rodape />
    </div>
  )
}
