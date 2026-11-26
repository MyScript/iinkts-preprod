import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import jestPlugin from "eslint-plugin-jest"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"

import barrelImports from "../../config/eslint-plugin-barrel-imports.mjs"

// The config ESLint uses for every file of test/unit (the nearest config wins, the root one never
// applies here). Same code rules as src/, plus Jest's.
export default [
  prettierPlugin,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...jestPlugin.environments.globals.globals },
      parser: tsParser,
      // Anchored on this folder: the CLI runs from the repo root, the editor from test/unit
      parserOptions: { project: "./tsconfig.json", tsconfigRootDir: import.meta.dirname },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      jest: jestPlugin,
      "simple-import-sort": simpleImportSort,
      iink: barrelImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs["eslint-recommended"].overrides[0].rules,
      ...typescriptEslint.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      "iink/barrel-imports": ["error", { mode: "test" }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
      quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
      curly: ["error", "all"],
      "max-statements-per-line": ["error", { max: 1 }],
      // `__mocks__` holds shared test helpers (createCanvasMock…), not Jest automocks
      "jest/no-mocks-import": "off",
    },
  },
]
