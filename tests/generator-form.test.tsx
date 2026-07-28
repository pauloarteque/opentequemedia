/**
 * Testa o componente de verdade rodando (não uma reimplementação da lógica): renderiza
 * GeneratorForm, simula colar um link, clicar em Gerar link, e checa o resultado — o
 * mesmo caminho que um humano percorreria. Ver SPEC.md §7, fase 6.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GeneratorForm } from '@/components/GeneratorForm'

function pasteAndGenerate(value: string) {
  const input = screen.getByLabelText('Cole o link do YouTube')
  fireEvent.change(input, { target: { value } })
  const button = screen.getByRole('button', { name: 'Gerar link' })
  fireEvent.click(button)
}

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://open.tequemedia.com.br' },
    configurable: true,
    writable: true,
  })
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
    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/clip/UgkxABC123' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Clipes não abrem no aplicativo')
    // o botão fica desabilitado — não dá nem pra tentar gerar um link inválido
    expect(screen.getByRole('button', { name: 'Gerar link' })).toBeDisabled()
  })

  it('host que não é do YouTube mostra o host recusado na mensagem', () => {
    render(<GeneratorForm />)
    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, { target: { value: 'https://youtube.com.evil.tld/watch?v=dQw4w9WgXcQ' } })

    expect(screen.getByRole('alert')).toHaveTextContent('youtube.com.evil.tld')
    expect(screen.queryByLabelText('Link gerado')).not.toBeInTheDocument()
  })

  it('playlist pessoal (WL) explica que ela é de quem olha, não de quem compartilha', () => {
    render(<GeneratorForm />)
    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/playlist?list=WL' } })

    expect(screen.getByRole('alert')).toHaveTextContent('quem está olhando')
  })

  it('campo vazio não mostra erro nenhum (estado inicial, não é engano do usuário)', () => {
    render(<GeneratorForm />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('GeneratorForm — vídeo com playlist mostra aviso não-bloqueante', () => {
  it('watch?v=X&list=Y gera o link mesmo assim, com aviso', () => {
    render(<GeneratorForm />)
    const input = screen.getByLabelText('Cole o link do YouTube')
    fireEvent.change(input, {
      target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLC77007E23FF423C6' },
    })

    expect(screen.getByText('A playlist foi ignorada — o vídeo abre sozinho.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerar link' })).not.toBeDisabled()
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
