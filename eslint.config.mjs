import next from 'eslint-config-next'

const config = [
  ...next,
  {
    ignores: ['.next/**', 'node_modules/**', 'tsconfig.tsbuildinfo'],
  },
]

export default config
