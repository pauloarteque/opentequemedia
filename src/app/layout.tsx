import type { Metadata } from 'next'
import { tokensToCssVars } from '@/core/tokens'
import './globals.css'

export const metadata: Metadata = {
  title: 'openteque — TEQUEMEDIA',
  description: 'Crie um link do YouTube que abre no app, não no navegador interno do Instagram.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: tokensToCssVars() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
