/**
 * Saídas da superfície 1 para o site da casa. É no site que a pessoa agenda o diagnóstico.
 * O parâmetro utm_medium separa de onde veio o clique (convite ou faixa laranja). Nada é
 * medido dentro do openteque, a leitura fica do lado do site.
 */
export const SITE_TEQUEMEDIA = 'https://tequemedia.com.br/'

const ORIGEM = 'utm_source=open-tequemedia'

export const LINK_DIAGNOSTICO_FAIXA = `${SITE_TEQUEMEDIA}?${ORIGEM}&utm_medium=faixa`
export const LINK_DIAGNOSTICO_CONVITE = `${SITE_TEQUEMEDIA}?${ORIGEM}&utm_medium=popup`
