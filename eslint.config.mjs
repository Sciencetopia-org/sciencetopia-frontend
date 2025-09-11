import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginPrettier from 'eslint-plugin-prettier'
import configPrettier from 'eslint-config-prettier'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      globals: globals.browser, // Ensures browser globals are available
    },
    plugins: {
      prettier: pluginPrettier, // Register Prettier plugin
    },
    extends: [
      pluginJs.configs.recommended, // ESLint JS plugin recommended rules
      ...pluginVue.configs['flat/essential'], // Vue plugin recommended rules
      configPrettier, // Disable formatting-related ESLint rules that conflict with Prettier
    ],
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          semi: false,
          trailingComma: 'es5',
          tabWidth: 2,
          useTabs: false,
          printWidth: 80,
        },
      ], // Ensure Prettier formatting is enforced with your custom config
    },
  },
]
