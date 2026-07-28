import { Beneficios } from '@/components/Beneficios'
import { GeneratorForm } from '@/components/GeneratorForm'
import { Rodape } from '@/components/Rodape'
import { Topbar } from '@/components/Topbar'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <Topbar />
      <main>
        <div className={styles.hero}>
          <span className={styles.badge}>Grátis e sem cadastro</span>
          <h1 className={styles.h1}>Crie seu link. Aumente sua conversão do Instagram pro YouTube.</h1>
          <p className={styles.subtitle}>
            Link do YouTube em Story abre no navegador interno do Instagram — deslogado, sem inscrição, sem like.
          </p>
        </div>

        <div className={styles.generatorWrap}>
          <GeneratorForm />
        </div>

        <div className={styles.benefitsWrap}>
          <Beneficios />
        </div>

        <Rodape />
      </main>
    </>
  )
}
