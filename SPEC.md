# SPEC — openteque

## Contexto

Link de YouTube colado em Story do Instagram abre no navegador interno do app, onde o espectador está deslogado. Para se inscrever ele precisaria fazer login com senha e verificação em duas etapas dentro daquele navegador. A maioria desiste. O resultado é que todo o tráfego que a TEQUEMEDIA e seus clientes mandam do Instagram para o YouTube chega no pior estado possível para inscrição, like e retenção.

O openteque resolve isso trocando o link do YouTube por um link em `open.tequemedia.com.br`. Esse link decide no servidor, lendo o User-Agent, o que fazer com cada visitante — e quando detecta o navegador interno do Instagram, entrega uma página que abre o **aplicativo** do YouTube, onde a pessoa já está logada.

---

## 1. As duas superfícies

| | Superfície 1 — gerador (`/`) | Superfície 2 — redirects (`/v /s /c /p`) |
|---|---|---|
| Público | Empresários e criadores (nosso ICP) | O espectador do cliente |
| Marca | Completa | **Zero** (exceto botão/acento na cor de marca — ver §6) |
| Renderiza com | React + Next.js | **HTML puro, sem React** |
| CSS | `globals.css` | `<style>` embutido, gerado dos mesmos tokens |

A separação não é só de estilo: as duas superfícies **não compartilham nenhum arquivo de renderização**. A superfície 2 não consegue importar um componente de marca porque não usa componentes.

Único texto permitido na superfície 2: o rótulo funcional `Abrir no YouTube` e, no Android, `Não abriu? Toque aqui para assistir`.

---

## 2. Decisões de arquitetura

### 2.1 Route Handlers, não middleware

1. Middleware não consegue entregar a página inteligente sem reintroduzir o problema de CSS/hidratação do React.
2. Não existe "borda" fora da Vercel — auto-hospedado, middleware roda na mesma máquina, na mesma velocidade que um Route Handler.
3. Middleware roda em toda requisição do site a não ser que se configure um filtro. Route Handler roda só nos prefixos.
4. No Next.js 16 `middleware.ts` virou `proxy.ts` e o antigo está obsoleto. Route Handler é estável.

### 2.2 A página inteligente é HTML escrito à mão, fora do React

Next.js injeta estilo/JS próprios em toda página renderizada por ele, sem forma documentada de garantir ordem (issue vercel/next.js#73275, fechada sem correção). Route Handler devolve os bytes exatos, sem pipeline de HTML do Next — não existe hidratação para o script perder a corrida.

```
<head>
  <meta charset>                     ← primeiro, senão acento corrompe
  <style>tokens</style>              ← embutido, zero rede
</head>
<body>
  thumbnail, título, botão, link estático     ← já desenhados
  <script type="application/json">dados</script>
  <script>DISPARA O INTENT</script>   ← única coisa executável
</body>
```

### 2.3 O script vai no fim do corpo

O script fica no **fim do corpo**, não no topo. Ler ~3 KB de HTML já em memória custa <1ms e não usa rede — a regra "nada que dependa de rede antes do intent" continua obedecida. Em troca, quem toca Cancelar no diálogo do Instagram cai numa página já desenhada, não numa tela branca.

### 2.3b O que custa rede e o que não custa

**Smart page (superfície 2):** thumbnail é montada a partir do ID, zero consulta, zero latência — `hqdefault.jpg` (vídeo) ou `oardefault.jpg` (short), sem probe. Título vem de cache/oEmbed com prazo de 400ms; se não chegar a tempo, sai sem título. **O que nunca falta:** thumbnail, botão, link estático, disparo do intent. **O que pode faltar:** só o título.

**Bot page (preview para crawlers):** pode pagar um probe HTTP curto (HEAD, ~500ms) para tentar `maxresdefault`/`oardefault` de alta qualidade, com fallback a `hqdefault`. Bots não competem com o disparo de intent, então esse custo é aceitável só aqui.

### 2.4 Validação exata em um lugar só

`src/core/ids.ts` é a única definição de formato de ID. `src/core/path-format.ts` é a única gramática de caminho (permite trocar `/c/@nome` por `/c/at/nome` mexendo em um arquivo). Cliente e servidor importam os MESMOS arquivos de `src/core/**` — TypeScript puro, sem import de Node, sem `process.env`, sem React.

### 2.5 Carimbo de build

`buildId` e `commit` são capturados no momento do build pelo script `prebuild` (`scripts/write-build-info.mjs`), gravados em `src/generated/build-info.json` e embutidos no bundle como import estático — nunca lidos do disco em tempo de requisição (ver §2.7). `commit` vem de `git rev-parse --short HEAD`, ausente (não um valor velho) quando não há commit; `buildId` é o mesmo valor quando há commit, ou um UUID por build quando não há — prova que o identificador vem do artefato, não é digitado. Entrega: `GET /build` em texto puro, e cabeçalho `X-Openteque-Build` em toda resposta.

### 2.6 Sem banco

O caminho da URL carrega o destino inteiro. Nenhum destino vem de fora, nenhum é armazenado. Redirecionador aberto é impossível por construção.

### 2.7 Falha honesta, nunca reserva plausível

Existem dois tipos de degradação graciosa. Uma admite ignorância — campo ausente, status de erro, "indisponível" (ex.: `title`/`thumbnailUrl` podem faltar em §2.3b; `commit` é `null` sem git). A outra devolve um valor de reserva que PARECE uma resposta válida no lugar de admitir a falha. A primeira é aceitável em qualquer componente. A segunda nunca é aceitável num componente cuja função é reportar a verdade sobre o sistema.

Caso concreto que motivou a regra: `getBuildStamp()` (§2.5) tinha um `catch` que devolvia `'(dev — sem build de produção)'` quando a leitura de `.next/BUILD_ID` falhava em runtime — o que aconteceria sempre no Worker do Cloudflare, inclusive em produção com build real rodando. HTTP 200, corpo com formato de resposta válida, mentira completa. A única rota que existe pra provar qual build está no ar teria mentido, com tudo verde — exatamente o problema que essa rota existe pra resolver, se manifestando dentro dela mesma.

Regra: ao escrever ou revisar um `try/catch`, se o `catch` devolve algo que parece uma resposta válida em vez de admitir que a operação falhou, é bug, não resiliência — vale sobretudo pra qualquer coisa que reporte build, versão, saúde ou estado do sistema.

---

## 3. Formato dos links

### Espaços de identificador

| Espaço | Regra exata |
|---|---|
| Vídeo | 11 caracteres de `A-Z a-z 0-9 - _` |
| Canal por ID | `UC` + 22 caracteres do mesmo conjunto |
| Handle | `@` + 3 a 30 caracteres |
| Canal legado | `c/nome` ou `user/nome` |
| Playlist | `PL`, `UU`/`UULF`/`UUSH`, `OLAK5uy_`, `RD` — **`LL`, `WL`, `FL` recusados** (são listas de quem está olhando, não de quem compartilhou) |

### Rotas e saída

| Rota | Destino |
|---|---|
| `/v/{id}` | `https://www.youtube.com/watch?v={id}` (`&t={s}` se houver) |
| `/s/{id}` | `https://www.youtube.com/shorts/{id}` |
| `/c/UC…` | `/channel/UC…` |
| `/c/@handle` | `/@handle` |
| `/c/c/nome` | `/c/nome` |
| `/c/user/nome` | `/user/nome` |
| `/p/{id}` | `/playlist?list={id}` |

`/s/` **nunca** vira `/watch` — Short no player horizontal perde retenção.

### Timestamp

Aceita `125`, `125s`, `1h2m3s`. Emite sempre segundos. Rejeita decimal. Só em `/v/`. Rota lê exatamente o parâmetro `t`; resto da query é ignorado.

### Origem do domínio

Constante `https://open.tequemedia.com.br` em módulo server-only (nunca no `Host` header — controlável por quem chama).

### Vídeo dentro de playlist

`watch?v=ID&list=PL…` emite `/v/ID`, ignora a lista, aviso não bloqueante.

### Existência não é formato

Falha fechada vale para o FORMATO, nunca para a existência. Vídeo com incorporação desativada falha no oEmbed mas o link continua válido — oEmbed só enriquece a prévia.

### Caminho não reconhecido

Prefixo válido + ID inválido, ou prefixo inexistente → 404 mínimo sem marca, sem redirect.

### Não indexar superfície 2

`<meta name="robots" content="noindex">` na página; `robots.txt` **não** bloqueia `/v /s /c /p` (bloquear quebraria preview do WhatsApp).

### Entrada do gerador

Host comparado **exatamente** contra allowlist, sobre o host já parseado pela URL — nunca substring: `youtube.com`, `www.youtube.com`, `m.youtube.com`, `music.youtube.com`, `youtu.be`, `youtube-nocookie.com`, `www.youtube-nocookie.com`.

Falha fechada: formato não reconhecido recusa com **mensagem específica por motivo**.

---

## 4. User-Agent e metadados

### Classificação — ordem importa

Bot **antes de** móvel (Googlebot Smartphone e Bingbot Mobile se identificam como Android). Cobertura da página inteligente: família Meta — `Instagram`, `FBAN`, `FBAV`, `FB_IAB`, `FBIOS`, `FBSS`, `MetaIAB` (o iOS 2025 não tem mais FBAN/FBAV). Qualquer coisa fora dessa lista cai no 302 — inclusive Telegram, indistinguível de Safari por UA.

Bot detectado por **nomes de produto específicos** (Googlebot, bingbot, facebookexternalhit, TelegramBot, Discordbot, Twitterbot, LinkedInBot, Slackbot, Applebot, meta-external*...), nunca por substring genérica `bot` — um celular de marca "Cubot" não pode classificar como bot.

### Metadados

| Tipo | Fonte | Sem sucesso |
|---|---|---|
| Vídeo, short, playlist | oEmbed do YouTube, sem chave | segue sem título |
| Canal, handle, legado | `og:title`/`og:image` da página do canal, leitura em fluxo com teto de bytes | segue sem logo |

oEmbed devolve erro em **texto puro**, não JSON — checar status antes de parsear. Sem cabeçalho CORS — só servidor. Título às vezes chega HTML-codificado — decodificar uma vez na entrada, escapar uma vez na saída.

Thumbnail ausente devolve 404 **com corpo de imagem cinza válida (1097 bytes)** — checagem por status/tamanho no servidor, nunca `onerror` no `<img>`.

---

## 5. Estrutura de arquivos

```
.claude/settings.json          modo plano, bloqueio de credenciais, confirmação em .claude
CLAUDE.md                      diretivas curtas apontando pra este arquivo
SPEC.md                        este arquivo

src/core/                      TypeScript puro — cliente E servidor usam os MESMOS arquivos
  types.ts  ids.ts  path-format.ts  timestamp.ts  constants.ts  escape.ts
  parse-youtube-url.ts         URL colada → Alvo | Recusa (navegador)
  parse-openteque-path.ts      /v/{id} → Alvo | Recusa (servidor)
  build-url.ts                 Alvo → URL do YouTube; Alvo → caminho openteque
  tokens.ts                    única fonte dos design tokens

src/server/                    só servidor (`import 'server-only'`)
  classify-ua.ts  youtube-meta.ts  open-script.ts  smart-page.ts  bot-page.ts  error-page.ts  site-origin.ts  build-info.ts

src/app/
  layout.tsx  page.tsx  globals.css      superfície 1
  not-found.tsx                          404 com marca — SÓ superfície 1
  v/[[...resto]]/route.ts  s/[[...resto]]/route.ts  c/[[...resto]]/route.ts  p/[[...resto]]/route.ts
  build/route.ts  _ua/route.ts

src/route/open-handler.ts      handler único, 4 chamadas de 1 linha

src/components/                superfície 1 apenas
tests/
scripts/check-no-raw-values.ts   quebra o build se houver cor/medida escrita direto
scripts/check-core-purity.ts     quebra o build se core/ importar Node
scripts/check-client-bundle.ts   prova por busca que o navegador roda o mesmo core
```

`[[...resto]]` (catch-all opcional), não `[id]`: se a rota fosse `[id]`, `/v` sozinho ou `/v/a/b` cairiam no 404 padrão do Next — renderizado DENTRO do `layout.tsx`, com marca, numa URL de superfície 2. O handler precisa ser dono de toda resposta abaixo do prefixo, inclusive erros.

---

## 6. Página inteligente

Fundo escuro, thumbnail, título real, botão laranja `Abrir no YouTube` (cor de marca como acento é permitida — copy/logo/tagline não são), e no Android o link estático abaixo.

**Nunca:** logo, texto TEQUEMEDIA, tagline, ID interno visível, player embutido.

### Android

```
intent://www.youtube.com/watch?v=ID#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=…;end
```

`package=` obrigatório. `S.browser_fallback_url` preenchido por correção de formato mas nunca tratado como cobertura — confirmado que o Instagram não honra. `visibilitychange`/`pagehide`/`blur` não disparam para o diálogo nativo do Instagram, só em troca real de app.

Link estático sempre no HTML: href https comum, texto `Não abriu? Toque aqui para assistir`, botão-fantasma (contorno, sem laranja, menor que o principal).

**Sem timer nenhum.** Nem navegação automática aos 15s (recria o bug de aparelho), nem realce (não muda comportamento de ninguém — o diálogo cobre a página ou ela nunca esteve oculta). O link estático sempre visível é a defesa completa.

### iOS

Cadeia ~50ms entre tentativas: `youtube://URL`, `youtube://ID`, `vnd.youtube://ID`, `vnd.youtube://URL`, `x-safari-https://destino`. Botão usa `x-safari-https`, nunca `youtube://`. Cancelamento cobre a cadeia inteira (uma lista de timers, uma função que limpa todos). Sem link estático no iOS (app-ausente nunca testado). Sem rede final — a cadeia já termina em `x-safari-https`, igual ao href do botão.

### Script: constante fixa, dados em JSON separado

Zero interpolação no JS — dados chegam via `<script type="application/json">`. Elimina o contexto de escape mais perigoso, permite CSP por hash. Três travas: não redispara em navegação voltar/avançar, não dispara se a página não estiver visível no instante zero, cancelamento cobre toda a cadeia de timers.

### Escape

Título é entrada de terceiro. `<`, `>`, `&`, e U+2028/U+2029 escapados na serialização JSON (`</script>` num título não pode encerrar o bloco). Título clampado em 100 caracteres **depois** de decodificar, **antes** de escapar.

---

## 7. Página geradora

Visual claro fixo, sem seletor, no modelo web TequeMedia (guia visual da marca). Fundo Fumaça Branca com grade, contorno preto, sombra dura, Bricolage Grotesque e Kalam servidas pelo próprio domínio via `next/font`. Na página o nome da ferramenta é Open TequeMedia e o da casa é TequeMedia. De cima para baixo: cabeçalho com o logotipo horizontal (arquivo SVG original em `src/components/`, importado como arquivo estático porque a hospedagem não serve `public/`, nunca redesenhado) → selo "Grátis e sem cadastro" → H1 → gerador dentro de uma janela, na primeira tela do celular (colar, gerar, copiar) → comparação "Mesmo vídeo, dois caminhos" → faixa laranja de autoridade com os números confirmados da casa e o botão "Agendar meu diagnóstico" para `https://tequemedia.com.br/` → rodapé. Nenhuma cor/espaçamento/raio direto, sempre `src/core/tokens.ts`. Os tokens da superfície 1 têm prefixo `tq`, e a superfície 2 não usa nenhum deles. As classes `.tq-*` moram em `src/app/modelo-web.css` e as da página em `src/app/open.css`.

**Comportamento do gerador.** Colar um link já gera. A validação roda ao gerar, não a cada tecla, e a recusa continua com mensagem específica por motivo (§3). Ao gerar, o campo perde o foco e o resultado é trazido para a área visível, porque no celular ele nasce abaixo da dobra.

**Convite para o diagnóstico.** Janela não bloqueante que sobe 1,5 s depois de copiar o primeiro link, ou 20 s depois de gerar sem copiar. Uma vez por visita, com descanso de 14 dias depois de vista e de 60 dias depois do clique. O descanso é uma data em `localStorage` (chave `open-tq-convite-ate`). Nenhum destino, link gerado ou dado de quem usa é guardado, então §2.6 continua valendo. Os links de saída levam `utm_source=open-tequemedia` e `utm_medium=popup` ou `faixa`. Nada é medido dentro do openteque.

---

## 8. Fora de escopo

Banco de dados, conta de usuário, painel de estatísticas, encurtador genérico, player embutido, analytics, internacionalização, modo escuro na página geradora. **Hospedagem/deploy** — do usuário, fora desta SPEC; nenhuma fase depende disso. `/build` NÃO está fora de escopo — é requisito (§2.5).

Guardar destino em banco, arquivo ou sessão é mudança de arquitetura com revisão de segurança própria.

---

## 9. Riscos registrados (não bloqueiam fase nenhuma)

- iOS sem o app nunca foi testado — não presumir igual a Android ou a iOS-com-app.
- `/c/@nome`: risco de o Instagram interpretar `@` como menção em legenda/bio (não no adesivo de Story, campo de URL dedicado). Teste pulado por decisão do usuário; `path-format.ts` deixa a correção barata se algum link quebrar.
- `x-safari-https` é esquema não documentado pela Apple — pode mudar de comportamento.
- Android sem o app do YouTube (Huawei/AOSP/Fire): intent não faz nada, link estático é o único resgate.
- Cloudflare é proxy/CDN na frente desde a migração para Workers/OpenNext (28/07/2026) — o risco abaixo deixou de ser hipotético. Qualquer reescrita de HTML (Rocket Loader, Auto Minify, Email Obfuscation) quebra a arquitetura: a página inteligente depende do script embutido executar imediatamente, sem adiamento. A Cloudflare não documenta se essas transformações tocam resposta de Worker em domínio próprio — checagem byte a byte do HTML de produção contra o local (`npm run check:html-parity`) é portão obrigatório antes de qualquer deploy, não só na migração, com atenção especial ao bloco `<script>` embutido (alterado ali = Rocket Loader/Auto Minify agindo). Checado em 28/07/2026: a zona `tequemedia.com.br` inteira ainda está com NS da Hostinger (não da Cloudflare) — nenhum subdomínio (`open`, `www`, `playbook`, apex) passa pelo proxy da Cloudflare hoje. Isso muda quando `open.tequemedia.com.br` virar Custom Domain do Worker.
- Worker Cloudflare: 918 KiB comprimido na migração para OpenNext (28/07/2026), contra limite de 3 MB (plano grátis) / 10 MB (pago) do plano de publicação. Linha de base — se alguma dependência futura fizer esse número saltar, investigar antes de aceitar.
- `buildId` local (§2.5) vem do commit curto quando há git — num build local com alterações não commitadas, ele reporta o último commit enquanto o código rodando inclui trabalho não commitado. Não confiar em `buildId` sozinho pra saber "que código está rodando" em teste local; `builtAt` (também em `/build`) é o desempate.
