# Design Tokens TEQUEMEDIA

Identidade visual do painel, ancorada na paleta oficial da marca. Cole este bloco no CLAUDE.md do projeto. Toda tela nova que o Claude Code construir deve usar estes tokens, nunca cores soltas escritas direto no código.

## Princípios

- A identidade vem das cores oficiais. O laranja Giants é a cara da TEQUEMEDIA e fica reservado para ação, acento e destaque, não para encher tela nem para texto pequeno.
- O sistema tem dois modos, claro e escuro, e o usuário escolhe. Os dois usam a mesma paleta de marca, só trocam fundo e texto.
- Visual de dashboard moderno. Cantos arredondados, cartões com leve elevação, números grandes para as métricas, muito espaço para respirar.
- Acessibilidade primeiro. Todo texto precisa de contraste suficiente para leitura confortável. Quando marca e legibilidade conflitam, a legibilidade vence.
- Cor de status de dados segue convenção universal. Verde sobe, vermelho cai, âmbar é atenção. O amarelo da marca entra como o âmbar de atenção.

## Mapeamento semântico das cores da marca

| Papel no sistema | Cor da marca | Hex |
|---|---|---|
| Ação e destaque principal | Laranja Giants | #fe5b18 |
| Apoio e acento | Ciano Escuro | #17939b |
| Dados e categorias | Correntes Caribenhas | #006373 |
| Dados e categorias | Azul Claro | #afc8cc |
| Atenção | Ônibus Escolar | #ffe00c |
| Fundo escuro e superfícies dark | Azul da Prússia | #00243a |
| Texto e fundo escuro | Noite | #161616 |
| Fundo claro | Fumaça Branca | #f2f2f2 |
| Superfície quente clara | Casca de Ovo | #e4e3d1 |

## Regra crítica sobre o laranja

O laranja não tem contraste suficiente para servir de texto sobre fundo claro. Por isso:

- Nunca use o laranja como cor de texto pequeno sobre fundo claro, como links, rótulos ou parágrafos. Use a cor de texto padrão.
- O número grande de uma métrica usa a cor de texto padrão, não o laranja. Para destacar a métrica, use o laranja em volta, num indicador, numa barra, num ícone, numa borda.
- O laranja brilha como fundo de botão primário, com texto branco, e como cor de acento, seleção e indicadores. É aí que ele deve viver.
- O amarelo de atenção segue a mesma lógica, só funciona como fundo com texto escuro por cima, nunca como texto.

## Cores para gráficos e comparação de canais

Como o painel compara canais de nichos diferentes, a sequência de cores para séries de dados sai da própria marca, nesta ordem, para manter contraste entre as linhas. Em comparações importantes, não dependa só da cor, acompanhe com rótulo ou ícone, para quem tem daltonismo.

1. #fe5b18 laranja
2. #17939b ciano
3. #afc8cc azul claro
4. #ffe00c amarelo
5. #006373 caribe
6. #00243a prússia

No modo escuro, use as versões clareadas dos tokens de gráfico mais abaixo.

## Tipografia

Fonte principal Inter, gratuita e excelente para números e painéis. Números sempre com largura tabular, para alinharem nas colunas, usando font-variant-numeric tabular-nums.

| Token | Tamanho | Peso | Entrelinha | Uso |
|---|---|---|---|---|
| display | 48px | 700 | 1.1 | número gigante de métrica em destaque |
| h1 | 30px | 700 | 1.2 | título de página |
| h2 | 24px | 600 | 1.25 | título de seção |
| h3 | 18px | 600 | 1.35 | título de cartão |
| body | 15px | 400 | 1.5 | texto padrão |
| small | 13px | 400 | 1.45 | legenda, rótulo |
| micro | 12px | 500 | 1.4 | tag, badge |

## Raio de borda

| Token | Valor | Uso |
|---|---|---|
| sm | 8px | input, botão pequeno |
| md | 12px | botão, tag |
| lg | 16px | cartão padrão |
| xl | 24px | cartão grande de destaque |
| full | 9999px | avatar, pill, badge redondo |

## Espaçamento

Escala base de 4px. Tokens: space-1 4px, space-2 8px, space-3 12px, space-4 16px, space-6 24px, space-8 32px, space-12 48px, space-16 64px.

## Tokens prontos em CSS

O modo claro fica na raiz, o escuro entra quando a classe `dark` está no elemento raiz.

```css
:root {
  /* Fundo e superfície */
  --color-bg: #f2f2f2;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-hover: #f4f3ee;
  --color-surface-active: #eceae3;
  --color-border: #e3e2dc;

  /* Texto */
  --color-text: #161616;
  --color-text-secondary: #565b62;
  --color-text-muted: #6e747c;
  --color-text-disabled: #a8adb4;

  /* Marca */
  --color-primary: #fe5b18;
  --color-primary-hover: #e04a0c;
  --color-primary-active: #c43f08;
  --color-on-primary: #ffffff;
  --color-accent: #17939b;

  /* Foco, sempre visível na navegação por teclado */
  --color-focus-ring: #fe5b18;
  --focus-ring: 0 0 0 3px rgba(254,91,24,0.45);

  /* Status, cor sólida */
  --color-success: #1a9e6f;
  --color-danger: #e5484d;
  --color-warning: #ffe00c;

  /* Status, par de fundo suave e texto legível para badges */
  --color-success-bg: #e6f4ee;
  --color-success-text: #0f7350;
  --color-danger-bg: #fce9e9;
  --color-danger-text: #b3201f;
  --color-warning-bg: #fff7d6;
  --color-warning-text: #7a5b00;

  /* Sombra */
  --shadow-sm: 0 1px 2px rgba(22,22,22,0.06);
  --shadow-md: 0 4px 12px rgba(22,22,22,0.08);
  --shadow-lg: 0 12px 32px rgba(22,22,22,0.10);
}

.dark {
  /* Fundo e superfície */
  --color-bg: #161616;
  --color-surface: #1e1f22;
  --color-surface-raised: #25272b;
  --color-surface-hover: #2a2c30;
  --color-surface-active: #313438;
  --color-border: #303236;

  /* Texto */
  --color-text: #f2f2f2;
  --color-text-secondary: #b3b9c0;
  --color-text-muted: #828990;
  --color-text-disabled: #5a6066;

  /* Marca */
  --color-primary: #fe5b18;
  --color-primary-hover: #ff6e33;
  --color-primary-active: #ff8552;
  --color-on-primary: #ffffff;
  --color-accent: #2ab7c0;

  /* Foco */
  --color-focus-ring: #ff7a45;
  --focus-ring: 0 0 0 3px rgba(255,122,69,0.55);

  /* Status, cor sólida */
  --color-success: #2bb37e;
  --color-danger: #f2555a;
  --color-warning: #ffe00c;

  /* Status, par de fundo suave e texto legível */
  --color-success-bg: #16312a;
  --color-success-text: #4ecb97;
  --color-danger-bg: #3a1f21;
  --color-danger-text: #f4807f;
  --color-warning-bg: #332b10;
  --color-warning-text: #f0d34a;

  /* Sombra, mais sutil no escuro */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.30);
  --shadow-md: 0 4px 14px rgba(0,0,0,0.40);
  --shadow-lg: 0 14px 36px rgba(0,0,0,0.50);
}
```

## Cores de gráfico por modo

```css
:root {
  --chart-1: #fe5b18;
  --chart-2: #17939b;
  --chart-3: #6f9aa3;
  --chart-4: #d9a400;
  --chart-5: #006373;
  --chart-6: #00243a;
}

.dark {
  --chart-1: #ff7a45;
  --chart-2: #2ab7c0;
  --chart-3: #afc8cc;
  --chart-4: #ffe00c;
  --chart-5: #2a8f9a;
  --chart-6: #5a7d99;
}
```

## Regras de uso para o Claude Code

- Nunca escreva um valor de cor direto no componente. Sempre use a variável de token.
- O laranja é para ação, acento e destaque, botão principal, item selecionado, indicador. Nunca como texto pequeno sobre fundo claro. Veja a regra crítica acima.
- Texto sempre usa os tokens de texto, nunca preto puro ou branco puro.
- Todo elemento focável mostra o anel de foco com a variável focus-ring na navegação por teclado.
- Itens clicáveis de lista e linha de tabela usam surface-hover no hover e surface-active quando selecionados.
- Badge de status usa o par de fundo suave mais texto, por exemplo success-bg com success-text.
- Cartão usa surface mais raio lg mais shadow md. Cartão de destaque usa raio xl.
- O seletor de modo claro e escuro fica acessível no cabeçalho do painel.
- Subindo é success, caindo é danger, atenção é warning. Vale para setas, badges e variações percentuais.

## Uso dos logos

| Variação | Onde usar |
|---|---|
| Quadrado laranja | logo principal, topbar do painel e favicon, funciona em claro e escuro |
| Ícone preto | apenas quando o fundo já for laranja |
| Horizontal, ícone mais texto | tela de login e cabeçalhos largos |
| Vertical | tela de login centralizada ou de carregamento |
| Texto sozinho | usos pontuais quando o ícone já aparece em outro lugar |

Regras de aplicação do logo:

- Modo escuro. Os logos que contêm o texto Teque Media estão com o texto em preto e somem no fundo escuro. Use as variantes claras, com o texto em branco, e sirva a versão certa conforme o modo.
- Área de respiro. Mantenha em volta do logo um espaço livre de no mínimo metade da altura do ícone, sem outros elementos colados.
- Tamanho mínimo. O quadrado laranja nunca abaixo de 24px. No favicon, em tamanhos pequenos, garanta que o símbolo continue reconhecível.
- Nunca distorça a proporção, nunca recolora o laranja da marca, nunca aplique sombra ou efeito sobre o logo.
