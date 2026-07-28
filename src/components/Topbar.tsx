import styles from './Topbar.module.css'

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.logoSquare} aria-hidden="true" />
      <span className={styles.wordmark}>TEQUEMEDIA</span>
    </header>
  )
}
