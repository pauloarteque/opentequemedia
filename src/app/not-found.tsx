import { JanelaControles } from '@/components/JanelaControles'

export default function NotFound() {
  return (
    <main className="tq-grade tq-aviso-tela">
      <div className="tq-janela">
        <div className="tq-janela__barra">
          <span>Erro 404</span>
          <JanelaControles />
        </div>
        <div className="tq-janela__corpo">
          <h1 className="tq-h2">Página não encontrada</h1>
          <p className="tq-apoio">Esse endereço não existe no Open TequeMedia.</p>
          <a className="tq-botao" href="/">
            Voltar para o início
          </a>
        </div>
      </div>
    </main>
  )
}
