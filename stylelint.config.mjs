/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  ignoreFiles: ['build/**', 'coverage/**', '.next/**', 'node_modules/**'],
  rules: {
    // CSS Modules are consumed as `styles.camelCase` from TSX
    'selector-class-pattern': null,
    // Primer design tokens use mixed case (e.g. --fgColor-muted)
    'custom-property-pattern': null,
  },
}
