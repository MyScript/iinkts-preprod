// Lints and formats (Prettier runs through ESLint) only the staged files.
// Run by .husky/pre-commit; the Jenkinsfile still runs the full `yarn lint`, which alone checks
// import cycles: `import-x/no-cycle` walks the whole import graph, the slowest rule by far.
// The cache skips a file left unchanged since its last lint (an amend, a retried commit).
const eslint = "eslint --fix --cache --cache-location node_modules/.cache/eslint/"

export default {
  "{src,perf,test/unit}/**/*.ts": `${eslint} --rule "import-x/no-cycle: off"`,
  "test/examples/**/*.ts": `${eslint} --config=./test/examples/eslint.config.mjs`,
}
