import path from "node:path"
import { fileURLToPath } from "node:url"

import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import importX from "eslint-plugin-import-x"
import jestPlugin from "eslint-plugin-jest"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"

import barrelImports from "./config/eslint-plugin-barrel-imports.mjs"
import layers, { validateLayers } from "./config/eslint-plugin-layers.mjs"

const iink = { rules: { ...barrelImports.rules, ...layers.rules } }

// Layers of `src/`, bottom up: a folder imports only from a lower layer (config/eslint-plugin-layers.mjs).
// `core` stays DOM-free so the library runs headless, `dom` is the only bottom layer touching the DOM.
const LAYERS = {
  layers: [
    ["core", "constants", "dom", "assets", "logger", "worker"],
    ["i18n", "style"],
    ["ui", "style-css", "symbol"],
    ["symbol-utils", "store", "grabber"],
    ["client"],
    ["model"],
    ["history", "renderer", "export"],
    ["manager"],
    ["components", "smartguide"],
    ["menu"],
    ["canvas"],
  ],
  only: {
    // translates labels for every layer showing one, so it stands on core alone
    i18n: ["core"],
    // generic widgets: they know nothing about a canvas, a manager, a symbol or the client — that is
    // the whole difference between them and the interactive widgets left in `components/`
    ui: ["dom", "core", "logger", "constants", "i18n"],
  },
  typeOnly: {
    // the folders above the canvas name its contract as a type, never import a value from it: a
    // value import is what makes the dependency real at runtime and what turned `manager` and
    // `menu` into cycles with `canvas`
    canvas: ["manager", "menu", "components", "history", "smartguide"],
  },
  // Accepted debt, may only shrink: an exception no longer needed fails the lint
  exceptions: [
    // the client is meant to stand alone (roadmap P3.11): it still names history and model types
    { file: "src/client/shared/ClientEvent.ts", target: "history" },
    { file: "src/client/websocket/WebSocketClient.ts", target: "history" },
    { file: "src/client/websocket/WebSocketClientMessage.ts", target: "history" },
    { file: "src/client/http/HTTPClientV1.ts", target: "model" },
    { file: "src/client/websocket/WebSocketSSRClient.ts", target: "model" },
    // math variable colors and labels, owned by the component that shows them
    { file: "src/manager/interactive/math/IIMathVariableSubManager.ts", target: "components" },
  ],
}
validateLayers(LAYERS)

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
      "dist-ref/**",
      "dist-test/**",
      "coverage/**",
      "test-results/**",
      ".playwright-mcp/**",
      ".superpowers/**",
      "docs/**",
      "config/**",
      "examples/**/*.html",
      "examples/assets/**",
      "examples/dev-env-loader.generated.js",
      "examples/custom-rendering/tldraw-websocket-client/**",
      "examples/custom-rendering/excalidraw-websocket-client/**",
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

  // Imports: across folders only through the folder barrel, relative inside a folder, `constants`
  // is a leaf (see config/eslint-plugin-barrel-imports.mjs), each folder only from a lower layer
  // (LAYERS above). And no runtime import cycle: type imports are ignored. The TypeScript settings are required — without them `no-cycle` parses no
  // `.ts` dependency and stays silent even on a two-file cycle.
  {
    files: ["src/**/*.ts"],
    plugins: { iink, "import-x": importX },
    settings: {
      ...importX.flatConfigs.typescript.settings,
      "import-x/resolver-next": [createTypeScriptImportResolver({ project: "./tsconfig.json" })],
    },
    rules: {
      "iink/barrel-imports": "error",
      // Layer boundaries of every src folder, see LAYERS above
      "iink/layers": ["error", LAYERS],
      "import-x/no-cycle": "error",
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
  // Runs on node, not in a browser, and is type-checked by perf/tsconfig.json rather than by the
  // main typecheck project — see .local/v5-e1-tooling for why the two are separate.
  {
    files: ["perf/**/*.ts", "perf/**/*.mjs", "perf/**/*.js"],
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

  // A case file must never reach for the library itself. The bench is pointed at a bundle chosen at
  // run time, because an A/B measures two of them; a case importing `#iink` would always measure
  // `dist/`, so both sides would run the same code and the case would read x1.000 whatever happened
  // — dead, silent, indistinguishable from a healthy one. The library arrives through the fixture.
  {
    files: ["perf/headless/cases/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "#iink",
              message: "a case measures the bundle the run was pointed at — take the library from the fixture",
            },
          ],
        },
      ],
    },
  },

  // The harness keeps its unit tests beside what they test, so they land in the block above, which
  // knows nothing about a test runner. This adds what jest brings.
  {
    files: ["perf/**/*.test.ts"],
    plugins: {
      jest: jestPlugin,
    },
    languageOptions: {
      globals: { ...globals.node, ...jestPlugin.environments.globals.globals },
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
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

  // The folders above the canvas depend on its contract (`TInkCanvas` / `TInteractiveInkCanvas`),
  // never on a concrete variant: `implements` only guards the contract in one direction, and a
  // member added to the class does not make the interface stale to the compiler. The
  // `*Configuration` types are part of the contracts and stay allowed.
  {
    files: [
      "src/manager/**/*.ts",
      "src/menu/**/*.ts",
      "src/components/**/*.ts",
      "src/history/**/*.ts",
      "src/smartguide/**/*.ts",
    ],
    rules: {
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

  // Layer boundary inside the canvas folder: the contract level may not reach the variants.
  // `src/canvas/*.ts` is the base — `AbstractCanvas`, the events, the layer, and the two canvas
  // contracts — and it sits below the four concrete canvases in `variants/`. The `*Configuration`
  // types are excepted because `TInkCanvas` and `TInteractiveInkCanvas` name them as part of the
  // contract. `CanvasFactory.ts` is excepted because being the one place that knows all four
  // variants is its whole job; IIC-1998 makes those imports lazy.
  {
    files: ["src/canvas/*.ts"],
    ignores: ["src/canvas/CanvasFactory.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./variants/*", "@/canvas/variants/*", "!*Configuration"],
              message: "the canvas contract level must not depend on a concrete variant",
            },
          ],
        },
      ],
    },
  },
]
