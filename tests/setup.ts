import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// @testing-library/react limpa sozinho quando detecta um framework de teste global,
// mas como vitest.config.ts não liga `test.globals`, o afterEach precisa ser
// registrado explicitamente aqui — senão cada render() se acumula no DOM entre
// testes do mesmo arquivo, e getByRole/getByLabelText passam a achar mais de um
// elemento (foi exatamente o erro visto ao rodar generator-form.test.tsx pela primeira vez).
afterEach(() => {
  cleanup()
})
