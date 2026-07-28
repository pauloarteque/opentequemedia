import type { MetadataRoute } from 'next'

/**
 * NÃO bloqueia /v /s /c /p — bloquear ali impediria o bot de prévia do WhatsApp e do
 * Facebook de ler os metadados Open Graph, que é justamente pra isso que a página de
 * bot existe. A superfície 2 já se anuncia como não-indexável via cabeçalho
 * X-Robots-Tag e <meta name="robots"> em cada página — dois mecanismos, papéis
 * diferentes: um pede pra não indexar, o outro pediria pra nem visitar. Ver SPEC.md §3.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  }
}
