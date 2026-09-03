import path from "node:path"
import { fileURLToPath } from "node:url"

import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import jestPlugin from "eslint-plugin-jest"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      ".claude/**",
      "delivery/**",
      "docker/**",
      "**/dist/**",
      "docs/**",
      "config/**",
      "examples/**/*.html",
      "examples/assets/**",
      "examples/dev-env-loader.generated.js",
      "examples/custom-rendering/tldraw-websocket-client/**",
      "*.config.mjs",
      "*.config.js",
      ".local/*"
    ],
  },
  ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
  prettierPlugin,
  {
    files: ["src/**/*.ts"],

    plugins: {
      "@typescript-eslint": typescriptEslint,
      "simple-import-sort": simpleImportSort,
    },

    languageOptions: {
      globals: globals.browser,

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "commonjs",

      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "typeAlias", format: ["PascalCase"], custom: { regex: "^T[A-Z]", match: true } },
      ],
      quotes: "off",

      "@/quotes": [
        "error",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],

      curly: ["error", "all"],

      "max-statements-per-line": [
        "error",
        {
          max: 1,
        },
      ],
    },
  },

  // Test unit: TypeScript + Jest
  {
    files: ["test/unit/**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
      jest: jestPlugin,
    },
    languageOptions: {
      globals: { ...globals.node, ...jestPlugin.environments.globals.globals },
      parser: tsParser,
      parserOptions: {
        project: "./test/unit/tsconfig.json",
      },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Perf harness: node scripts and Playwright scenarios, both TypeScript and plain JS.
  // Runs on node, not in a browser, and is type-checked by tsconfig.perf.json rather than by the
  // main typecheck project — see .local/v5-e1-tooling for why the two are separate.
  {
    files: ["test/perf/**/*.ts", "test/perf-e2e/**/*.ts", "test/perf-e2e/**/*.mjs", "test/perf-e2e/**/*.js"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parser: tsParser,
      sourceType: "module",
    },
    rules: {
      ...js.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
    },
  },

  // Examples: plain JS only
  {
    files: ["examples/**/*.js"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2020,
      sourceType: "module",
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Layer boundary: renderer must not import from manager or canvas
  {
    files: ["src/renderer/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["*/manager*", "**/manager/**"], message: "renderer layer must not import from manager" },
            { group: ["@/canvas", "@/canvas/**"], message: "renderer layer must not import from canvas" },
            { group: ["*/menu*", "**/menu/**"], message: "renderer layer must not import from menu" },
          ],
        },
      ],
    },
  },

  // Layer boundary: symbol must not import from manager, renderer, canvas, or menu
  {
    files: ["src/symbol/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["*/manager*", "**/manager/**"], message: "symbol layer must not import from manager" },
            { group: ["*/renderer*", "**/renderer/**"], message: "symbol layer must not import from renderer" },
            { group: ["@/canvas", "@/canvas/**"], message: "symbol layer must not import from canvas" },
            { group: ["*/menu*", "**/menu/**"], message: "symbol layer must not import from menu" },
          ],
        },
      ],
    },
  },

  // Layer boundary: core is the bottom layer - it may not import from anywhere else in src/
  {
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/*", "@/**", "!@/core", "!@/core/**"],
              message: "core is the bottom layer and must not import from anywhere else in src/",
            },
          ],
        },
      ],
    },
  },

  // Layer boundary: model must not import from manager, renderer, canvas, or menu
  {
    files: ["src/model/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["*/manager*", "**/manager/**"], message: "model layer must not import from manager" },
            { group: ["*/renderer*", "**/renderer/**"], message: "model layer must not import from renderer" },
            { group: ["@/canvas", "@/canvas/**"], message: "model layer must not import from canvas" },
            { group: ["*/menu*", "**/menu/**"], message: "model layer must not import from menu" },
          ],
        },
      ],
    },
  },

  // Layer boundary: the folders above the canvas may name its contract as a TYPE, never import a
  // value from it. A value import is what makes the dependency real at runtime and what turned
  // `manager` and `menu` into cycles with `canvas`; the ~100 `import type` references to
  // `TInteractiveInkCanvas` are how a manager is typed against its host and must keep working.
  // This uses the typescript-eslint variant of the rule because only it understands
  // `allowTypeImports` — the base rule bans both kinds.
  {
    files: [
      "src/manager/**/*.ts",
      "src/menu/**/*.ts",
      "src/components/**/*.ts",
      "src/history/**/*.ts",
      "src/smartguide/**/*.ts",
    ],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/canvas", "@/canvas/**"],
              allowTypeImports: true,
              message:
                "this layer sits above the canvas: import its contract as a type (`import type`), never a value",
            },
          ],
        },
      ],
      // A second, separate rule on purpose. The typescript-eslint variant above skips type imports
      // whenever its options carry `allowTypeImports`, whatever the group — so a stricter group put
      // beside that one is silently inert. The base rule has no such notion and bans both kinds,
      // which is what naming a concrete canvas deserves: `implements` only guards the contract in
      // one direction, and a member added to the class does not make the interface stale to the
      // compiler. The `*Configuration` types are part of the contracts and stay allowed.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/canvas/variants/*", "!@/canvas/variants/*Configuration"],
              message:
                "depend on the canvas contract (`TInkCanvas` / `TInteractiveInkCanvas`), not on a concrete variant class",
            },
          ],
        },
      ],
    },
  },
]
