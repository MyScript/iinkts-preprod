import serve from "rollup-plugin-serve"
import livereload from "rollup-plugin-livereload"
import generateDevEnv from "./rollup-plugin-dev-env.mjs"
import config from "./rollup.config.mjs"

config[0].plugins.push(
  generateDevEnv(),
  serve({
    open: true,
    openPage: "/examples/index.html",
    verbose: true,
    contentBase: "",
    host: "localhost",
    port: 8000,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    }
  }),
  livereload({
    watch: [
      "dist",
      "examples"
    ]
  })
)

config.watch = {
  include: "src/**"
}

export default config
