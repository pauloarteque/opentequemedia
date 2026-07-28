import 'server-only'

/**
 * 404 mínimo, sem marca — a única coisa que a superfície 2 mostra quando o prefixo é
 * válido mas o identificador não é, ou o prefixo não existe. Nunca adivinha destino.
 * Ver SPEC.md §3.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Link inválido</title>
</head>
<body>
<p>Link inválido.</p>
</body>
</html>
`
}
