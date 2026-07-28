import styles from './Rodape.module.css'

export function Rodape() {
  return (
    <footer className={styles.wrap}>
      <p className={styles.claim}>A aceleradora de canais de quem vende caro no Brasil.</p>
      <p className={styles.line}>
        Se o seu canal já fatura, o openteque é só o começo — a TEQUEMEDIA cuida da estratégia inteira.
      </p>
      <a className={styles.cta} href="https://tequemedia.com.br">
        Fazer meu diagnóstico
      </a>
    </footer>
  )
}
