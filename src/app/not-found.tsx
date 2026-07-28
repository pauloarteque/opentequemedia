export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-4)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <h1>Página não encontrada</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Esse endereço não existe no openteque, da TEQUEMEDIA.
      </p>
      <a href="/" style={{ color: 'var(--color-primary)' }}>
        Voltar para o início
      </a>
    </main>
  )
}
