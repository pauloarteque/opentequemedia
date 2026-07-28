# Teste em aparelho — openteque

Tudo que dá pra provar sem celular já foi provado (219+ testes automatizados, verificação real por HTTP em todas as fases). O que segue **só pode ser confirmado por você**, em Android e iPhone reais, com Instagram instalado. Ver SPEC.md §8-9.

## Item zero — sempre, antes de qualquer teste abaixo

Abra `open.tequemedia.com.br/build` no navegador do celular. Anote o `buildId`. Se você acabou de publicar uma correção, confirme que esse identificador **mudou** em relação ao teste anterior. Teste em aparelho feito sem essa conferência não é evidência — é a mesma confusão que já custou três rodadas em um projeto anterior.

## Checklist (SPEC.md §8)

1. **Desktop** → 302 invisível, zero flash de página.
2. **Android + Instagram, app instalado** → abre o app do YouTube.
3. **Android + Instagram, app desativado** → o link estático ("Não abriu? Toque aqui para assistir") funciona.
4. **iPhone + Instagram, app instalado** → abre direto, sem diálogo.
5. **iPhone + Instagram, app desativado** → **lacuna conhecida, nunca testada.** Este é o teste de maior valor que falta.
6. **Voltar pro Instagram depois de 20s dentro do YouTube** → nada carrega por cima (prova de que o cancelamento do §6 funciona de verdade).
7. **Preview do link no WhatsApp** → título e thumbnail aparecem.
8. **Formato inválido** (ex: cole `/clip/...` direto na barra do navegador do celular) → recusa, não redireciona.
9. **Título com aspas e acento** → sem HTML quebrado na tela (já coberto por teste automatizado com título hostil simulado — isto aqui é a confirmação visual com um vídeo real).

## Tarefa de dois minutos, separada — `/_ua`

Abra `open.tequemedia.com.br/_ua` de dentro de uma DM do Instagram (não do navegador comum), no Android e no iPhone. A resposta mostra o User-Agent exato que chegou e como ele foi classificado — por exemplo:

```
user-agent: Mozilla/5.0 (Linux; Android 11; ...) Instagram 355.0.0.37.103 Android (...)
classificação: {"route":"smart","platform":"android"}
```

Isso confirma se o Instagram de hoje ainda bate com a família de tokens reconhecida (`Instagram`, `FBAN`, `FBAV`, `FB_IAB`, `FBIOS`, `FBSS`, `MetaIAB`) — transforma "acho que cobre" em fato medido, antes do lançamento.

## Se algo der errado

- **Confira o item zero primeiro.** Build errado no ar invalida qualquer outro resultado.
- **iOS sem o app** (item 5): sem teste anterior, não presuma nada — nem que funciona igual ao Android, nem que funciona igual ao iOS com o app instalado.
- **Link de handle** (`/c/@nome`): teste publicando um link de handle numa legenda e numa bio, separado do adesivo de Story. Ver SPEC.md §9 — se quebrar, a correção é pontual em `src/core/path-format.ts`.
- **Se algum dia houver Cloudflare ou outro proxy na frente:** compare o HTML servido em produção com o gerado localmente, byte a byte. Qualquer diferença é o proxy reescrevendo o documento — o suspeito mais provável é um recurso de "otimização" de JavaScript (tipo Rocket Loader) that atrasa o script embutido.
