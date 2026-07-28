import styles from './Beneficios.module.css'

const ITENS = [
  { icone: '▶', titulo: 'Abre no app', descricao: 'O espectador cai direto no aplicativo do YouTube, não no navegador interno do Instagram.' },
  { icone: '✓', titulo: 'Já logado', descricao: 'Sem tela de login, sem senha, sem verificação em duas etapas no meio do caminho.' },
  { icone: '→', titulo: 'Sem tela no meio', descricao: 'Um toque leva ao vídeo. Cada tela a mais é gente que desiste antes de se inscrever.' },
] as const

export function Beneficios() {
  return (
    <div className={styles.grid}>
      {ITENS.map((item) => (
        <div key={item.titulo} className={styles.card}>
          <div className={styles.icon} aria-hidden="true">
            {item.icone}
          </div>
          <p className={styles.title}>{item.titulo}</p>
          <p className={styles.description}>{item.descricao}</p>
        </div>
      ))}
    </div>
  )
}
