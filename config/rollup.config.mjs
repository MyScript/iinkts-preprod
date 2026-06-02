import terser from "@rollup/plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import alias from "@rollup/plugin-alias"
import typescript from "rollup-plugin-typescript2"
import postcss from "rollup-plugin-postcss"
import dts from "rollup-plugin-dts"
import commonjs from "@rollup/plugin-commonjs"
import svg from "rollup-plugin-svg-import"
import webWorkerLoader from "rollup-plugin-web-worker-loader"
import { fileURLToPath } from "url"
import path from "path"

const configDir = path.dirname(fileURLToPath(import.meta.url))

export default [
  {
    input: "src/iink.ts",
    output: [
      {
        name: "iink",
        file: "dist/iink.min.js",
        format: "umd",
        exports: "named",
      },
      {
        file: "./dist/iink.esm.js",
        format: "esm",
      },
    ],
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: path.resolve(configDir, "../src") }
        ]
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        clean: true,
        include: ["src/**/*.ts", "src/**/*.tsx"]
      }),
      resolve({ browser: true }),
      commonjs({
        include: ["node_modules/json-css/**"],
        defaultIsModuleExports: true
      }),
      terser({
        keep_fnames: true,
        compress: true,
      }),
      postcss({
        minimize: true,
        inject: false
      }),
      svg({
        stringify: true
      }),
      webWorkerLoader({ extensions: [".worker.ts"] })
    ],
  },
  {
    input: "src/iink.ts",
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: path.resolve(configDir, "../src") }
        ]
      }),
      dts({
        respectExternal: false,
      }),
      postcss({
        inject: false
      }),
    ],
    output: {
      file: `dist/iink.d.ts`,
      format: "es",
    }
  }
]
