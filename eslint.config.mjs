import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  ignores: ['server/src/generated/**', 'client/public/**'],
})
