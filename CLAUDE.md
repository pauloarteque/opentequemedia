# openteque — diretivas

Especificação completa: [SPEC.md](SPEC.md). Cada diretiva abaixo aponta pra seção — em conflito, o SPEC.md vence.

## Superfícies (SPEC §1)

- `src/app/page.tsx`, `src/components/**`, `src/app/layout.tsx`, `globals.css` = superfície 1. Podem usar marca, React, Next completo.
- Qualquer resposta de `src/app/{v,s,c,p}/[[...resto]]/route.ts` = superfície 2. String literal `TEQUEMEDIA`, `<link rel="stylesheet">`, `/_next/` e qualquer import de `src/components/**` são PROIBIDOS nesses arquivos e em tudo que importam de `src/server/**`.
- Texto permitido em superfície 2: só `Abrir no YouTube` e `Não abriu? Toque aqui para assistir`.

## Roteamento (SPEC §2.1, §2.2, §5)

- Novo redirect = Route Handler. Nunca `middleware.ts` nem `proxy.ts`.
- Toda rota de superfície 2 usa `[[...resto]]` (catch-all opcional), nunca `[id]`. Motivo falsificável: sem catch-all, `/v/a/b` cai no 404 padrão do Next, que renderiza dentro de `layout.tsx` — vazamento de marca pra superfície 2.
- A página inteligente é string HTML montada à mão em `src/server/smart-page.ts`. Nunca um componente React, nunca `.tsx`.

## Core compartilhado (SPEC §2.4, §5)

- `src/core/**` nunca importa `node:*`, `next/*`, `react`, nem lê `process.env`. Se algo em `core/` precisar disso, o arquivo certo é `src/server/**`.
- Formato de ID novo ou alterado: só em `src/core/ids.ts`. Formato de caminho novo ou alterado (incluindo trocar `@handle` por outro esquema): só em `src/core/path-format.ts`.
- Regex em `src/core/**` nunca usa as flags `g` ou `y` (module-scope regex com `g` quebra `.test()` por causa de `lastIndex`).
- Todo componente cliente que valida um link do YouTube importa de `src/core/parse-youtube-url.ts`. Nunca reimplementa a checagem.

## Segurança do link (SPEC §2.6, §3)

- Comparação de host: sempre `=== ` exato contra a lista em `src/core/constants.ts`, sobre `new URL(x).hostname`. Nunca `.includes()`, `.endsWith()` ou regex de substring.
- Nenhum destino de redirect pode vir de banco, arquivo, sessão ou cookie. Se uma tarefa pedir isso, é mudança de arquitetura — parar e avisar, não implementar.
- `WL`, `LL`, `FL` são playlists pessoais e são recusadas, não acopladas a `PL`/`UU`/`RD` na mesma checagem.

## Página inteligente (SPEC §6)

- `src/server/open-script.ts` exporta uma STRING CONSTANTE. Nenhuma interpolação de dado de request nela — dados variáveis vão em `<script type="application/json">`, nunca dentro do JS.
- Nenhum timer de navegação automática em `open-script.ts`. Nem Android nem iOS navegam sozinhos além da cadeia inicial de tentativa.
- No Android, `intent://` sempre inclui `package=com.google.android.youtube`.
- `S.browser_fallback_url` nunca é a única defesa contra app ausente — o link estático em HTML puro é obrigatório junto.

## Metadados (SPEC §4)

- Resposta do oEmbed do YouTube: checar `res.ok`/status ANTES de `.json()`. Corpo de erro é texto puro.
- Toda checagem de thumbnail ausente é por status HTTP ou tamanho de corpo, nunca `<img onerror>`.
- Nenhuma chamada de rede em `src/server/**` sem `AbortSignal.timeout(...)`.
- Busca de metadado nunca bloqueia ou atrasa o disparo do intent na página inteligente — thumbnail é sempre determinística (zero rede); só o título tem prazo (400ms) e pode faltar.

## Tokens (SPEC §7)

- Toda cor, raio e espaçamento vem de `src/core/tokens.ts`. Valor hex ou `px` fora desse arquivo (exceto `0`/`1px` de borda) quebra `scripts/check-no-raw-values.ts`.
- Tokens de prefixo `tq` são da superfície 1 (modelo web TequeMedia, visual claro) e nunca entram em `SMART_PAGE_TOKEN_NAMES`. A página inteligente continua nos tokens escuros originais.
- Classes `.tq-*` moram em `src/app/modelo-web.css`, classes `.op-*` em `src/app/open.css`. Cor em SVG embutido vem das classes `.tq-svg-*`, nunca escrita no componente.
- O logotipo entra pelo arquivo original em `src/components/`, importado como arquivo estático (a hospedagem não serve `public/`), nunca redesenhado nem redigitado. Na página o nome é TequeMedia e a ferramenta é Open TequeMedia.

## Build (SPEC §2.5)

- `GET /build` e o cabeçalho `X-Openteque-Build` vêm de `.next/BUILD_ID` + `src/generated/build-info.json`. Nunca um valor escrito à mão.

## Fora de escopo (SPEC §8)

Banco de dados, login, painel, encurtador genérico, player embutido, analytics, i18n, modo escuro na página geradora, configuração de hospedagem. Não implementar nem sugerir sem o usuário pedir de novo explicitamente.
