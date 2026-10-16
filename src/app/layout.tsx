import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Kalam } from 'next/font/google'
import { tokensToCssVars, tqLaranja } from '@/core/tokens'
import './globals.css'
import './modelo-web.css'

// As duas famílias do guia visual da marca. next/font baixa os arquivos no build e
// serve do próprio domínio, então a página não faz requisição nenhuma a terceiros.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--fonte-bricolage',
})

const kalam = Kalam({
  subsets: ['latin'],
  weight: '700',
  display: 'swap',
  variable: '--fonte-kalam',
  // só aparece na nota do link gerado e no rodapé, não precisa disputar a primeira pintura
  preload: false,
})

const descricao = 'Crie um link do YouTube que abre direto no app quando alguém toca nele dentro do Instagram.'

export const metadata: Metadata = {
  // Base dos endereços absolutos das imagens de compartilhamento (opengraph-image.png,
  // twitter-image.png e apple-icon.png, ao lado deste arquivo). Sem ela, o Next.js
  // monta esses endereços com localhost.
  metadataBase: new URL('https://open.tequemedia.com.br'),
  title: 'Open TequeMedia',
  description: descricao,
  openGraph: {
    title: 'Open TequeMedia',
    description: descricao,
    type: 'website',
    locale: 'pt_BR',
    siteName: 'TequeMedia',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open TequeMedia',
    description: descricao,
  },
}

export const viewport: Viewport = {
  themeColor: tqLaranja,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${kalam.variable}`}>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: tokensToCssVars() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
