// Stub de teste. O pacote real 'server-only' lança erro incondicionalmente ao ser
// importado — quem faz isso ser seguro no build de verdade é o bundler do Next.js,
// que troca esse pacote por um módulo vazio quando monta o bundle do servidor.
// Vitest não é o bundler do Next.js, então replicamos o mesmo alias aqui
// (ver vitest.config.ts > resolve.alias). Sem isso, todo teste de código que importa
// 'server-only' (classify-ua.ts, youtube-meta.ts, etc.) falharia antes de rodar.
export {}
