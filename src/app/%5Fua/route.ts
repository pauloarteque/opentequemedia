import { classifyUserAgent } from '@/server/classify-ua'

export const dynamic = 'force-dynamic'

/**
 * Eco em texto puro do User-Agent recebido e da classificação. Existe só para o dono do
 * produto abrir de dentro do Instagram, no aparelho de verdade, e conferir se a família
 * Meta está sendo reconhecida — sem depender de simulação de User-Agent. Ver SPEC.md §8.
 *
 * Pasta escrita como %5Fua (não _ua): o Next.js trata qualquer pasta iniciada com "_"
 * como pasta privada, excluída do roteamento — a rota simplesmente não existiria.
 * %5F é o escape de "_" que preserva a URL final /_ua sem acionar essa exclusão.
 */
export async function GET(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent')
  const classification = classifyUserAgent(ua)

  const lines = [`user-agent: ${ua ?? '(ausente)'}`, `classificação: ${JSON.stringify(classification)}`, '']

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}
