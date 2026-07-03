import antfu from '@antfu/eslint-config'
import testingLibrary from 'eslint-plugin-testing-library'

export default antfu(
  {
    react: true,
    typescript: true,
    ignores: ['server/src/generated/**', 'client/public/**'],
  },
  {
    files: ['client/**/*.test.ts', 'client/**/*.test.tsx'],
    plugins: testingLibrary.configs['flat/react'].plugins,
    rules: testingLibrary.configs['flat/react'].rules,
  },
)
