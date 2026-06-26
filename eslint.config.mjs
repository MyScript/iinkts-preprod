import typescriptEslint from "@typescript-eslint/eslint-plugin"
import globals from "globals"
import tsParser from "@typescript-eslint/parser"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    plugins: {
      "@typescript-eslint": typescriptEslint
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },

      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "commonjs",

      parserOptions: {
        project: "./tsconfig.json"
      }
    },

    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", disallowTypeAnnotations: false }
      ],
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "typeAlias", format: ["PascalCase"], custom: { regex: "^T[A-Z]", match: true } }
      ],
      quotes: "off",

      "@/quotes": [
        "error",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true
        }
      ],

      "max-statements-per-line": [
        "error",
        {
          max: 1
        }
      ]
    }
  },

  // Layer boundary: renderer must not import from manager or editor
  {
    files: ["src/renderer/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["*/manager*", "**/manager/**"], message: "renderer layer must not import from manager" },
          { group: ["*/editor*", "**/editor/**"], message: "renderer layer must not import from editor" },
          { group: ["*/menu*", "**/menu/**"], message: "renderer layer must not import from menu" }
        ]
      }]
    }
  },

  // Layer boundary: symbol must not import from manager, renderer, editor, or menu
  {
    files: ["src/symbol/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["*/manager*", "**/manager/**"], message: "symbol layer must not import from manager" },
          { group: ["*/renderer*", "**/renderer/**"], message: "symbol layer must not import from renderer" },
          { group: ["*/editor*", "**/editor/**"], message: "symbol layer must not import from editor" },
          { group: ["*/menu*", "**/menu/**"], message: "symbol layer must not import from menu" }
        ]
      }]
    }
  },

  // Layer boundary: model must not import from manager, renderer, editor, or menu
  {
    files: ["src/model/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["*/manager*", "**/manager/**"], message: "model layer must not import from manager" },
          { group: ["*/renderer*", "**/renderer/**"], message: "model layer must not import from renderer" },
          { group: ["*/editor*", "**/editor/**"], message: "model layer must not import from editor" },
          { group: ["*/menu*", "**/menu/**"], message: "model layer must not import from menu" }
        ]
      }]
    }
  }
]
