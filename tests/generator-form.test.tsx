/**
 * Testa o componente de verdade rodando (não uma reimplementação da lógica): renderiza
 * GeneratorForm, simula colar um link, clicar em Gerar link, e checa o resultado — o
 * mesmo caminho que um humano percorreria. Ver SPEC.md §7, fase 6.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAVE_DESCANSO, ESPERA_APOS_COPIAR_MS, GeneratorForm } from '@/components/GeneratorForm'

function pasteAndGenerate(value: string) {
  const input = screen.getByLabelText('Cole o link do YouTube')
  fireEvent.change(input, { target: { value } })
  const button = screen.getByRole('button', { name: 'Gerar link' })
  fireEvent.click(button)
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://open.tequemedia.com.br' },
    configurable: true,
    writable: true,
  })
  // o convite guarda a data de descanso aqui. Sem limpar, um teste silencia o seguinte
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GeneratorForm — colar link válido produz o link certo', () => {
  it('youtu.be com si= e t=1h2m3s produz exatamente /v/ID?t=3723', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://youtu.be/dQw4w9WgXcQ?si=xyz&t=1h2m3s')

    const result = screen.getByLabelText('Link gerado') as HTMLInputElement
    expect(result.value).toBe('https://open.tequemedia.com.br/v/dQw4w9WgXcQ?t=3723')
  })

  it('link de short produz /s/ID, nunca /v/ID', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/shorts/dQw4w9WgXcQ')

    const result = screen.getByLabelText('Link gerado') as HTMLInputElement
    expect(result.value).toBe('https://open.tequemedia.com.br/s/dQw4w9WgXcQ')
  })

  it('link de handle produz /c/@nome', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/@MrBeast')

    const result = screen.getByLabelText('Link gerado') as HTMLInputElement
    expect(result.value).toBe('https://open.tequemedia.com.br/c/@MrBeast')
  })
})

describe('GeneratorForm — formato recusado mostra mensagem específica', () => {
  it('/clip/ mostra a mensagem específica de clipe, não uma genérica', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/clip/UgkxABC123')

    expect(screen.getByRole('alert')).toHaveTextContent('Clipes não abrem no aplicativo')
    // link inválido nunca vira link gerado
    expect(screen.queryByLabelText('Link gerado')).not.toBeInTheDocument()
  })

  it('host que não é do YouTube mostra o host recusado na mensagem', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://youtube.com.evil.tld/watch?v=dQw4w9WgXcQ')

    expect(screen.getByRole('alert')).toHaveTextContent('youtube.com.evil.tld')
    expect(screen.queryByLabelText('Link gerado')).not.toBeInTheDocument()
  })

  it('playlist pessoal (WL) explica que ela é de quem olha, não de quem compartilha', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/playlist?list=WL')

    expect(screen.getByRole('alert')).toHaveTextContent('quem está olhando')
  })

  it('campo vazio não mostra erro nenhum (estado inicial, não é engano do usuário)', () => {
    render(<GeneratorForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('o erro só aparece ao gerar, nunca enquanto a pessoa ainda está digitando', () => {
    render(<GeneratorForm />)
    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/clip/UgkxABC123' } })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('corrigir o campo apaga o erro anterior', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/clip/UgkxABC123')
    expect(screen.getByRole('alert')).toBeInTheDocument()

    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('GeneratorForm — vídeo com playlist mostra aviso não-bloqueante', () => {
  it('watch?v=X&list=Y gera o link mesmo assim, com aviso', () => {
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLC77007E23FF423C6')

    expect(screen.getByText('Seu link tinha uma playlist. Vai abrir só o vídeo.')).toBeInTheDocument()
    const result = screen.getByLabelText('Link gerado') as HTMLInputElement
    expect(result.value).toBe('https://open.tequemedia.com.br/v/dQw4w9WgXcQ')
  })
})

describe('GeneratorForm — copiar', () => {
  it('clicar em Copiar chama a área de transferência com o link exato', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('https://open.tequemedia.com.br/v/dQw4w9WgXcQ'))
    expect(await screen.findByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
  })
})

describe('GeneratorForm — convite para o diagnóstico', () => {
  function prepararCopia() {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  }

  it('não aparece antes de a pessoa ter o link, nem logo depois de gerar', () => {
    render(<GeneratorForm />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sobe depois de copiar o primeiro link e leva para o site com a origem marcada', async () => {
    prepararCopia()
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))

    const convite = await screen.findByRole('dialog', {}, { timeout: ESPERA_APOS_COPIAR_MS + 1500 })
    expect(convite).toHaveTextContent('Link copiado')

    const acao = screen.getByRole('link', { name: 'Agendar meu diagnóstico' })
    expect(acao).toHaveAttribute('href', 'https://tequemedia.com.br/?utm_source=open-tequemedia&utm_medium=popup')
    // ver o convite já grava o descanso, para ele não voltar na visita seguinte
    expect(Number(window.localStorage.getItem(CHAVE_DESCANSO))).toBeGreaterThan(Date.now())
  })

  it('"Gerar outro link" fecha o convite e devolve o gerador limpo', async () => {
    prepararCopia()
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await screen.findByRole('dialog', {}, { timeout: ESPERA_APOS_COPIAR_MS + 1500 })

    fireEvent.click(screen.getByRole('button', { name: 'Gerar outro link' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Link gerado')).not.toBeInTheDocument()
    expect((screen.getByLabelText('Cole o link do YouTube') as HTMLInputElement).value).toBe('')
  })

  it('fica quieto enquanto o descanso gravado ainda não venceu', async () => {
    window.localStorage.setItem(CHAVE_DESCANSO, String(Date.now() + 86_400_000))
    prepararCopia()
    render(<GeneratorForm />)
    pasteAndGenerate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await screen.findByRole('button', { name: 'Copiado!' })

    await esperar(ESPERA_APOS_COPIAR_MS + 400)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
