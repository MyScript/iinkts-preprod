export default {
  rootDir: "../../",
  roots: [
    "<rootDir>/src",
    "<rootDir>/test/unit"
  ],
  clearMocks: true,
  // Coverage is opt-in through the `test:unit:coverage` script, not a flag on `test:unit`:
  // combining `--coverage` with `--detectOpenHandles` takes over ten minutes on this suite,
  // where `--coverage` alone takes about two. A commented-out `collectCoverage: true` used to
  // sit here, which is how the threshold below went years without ever being enforced.
  collectCoverageFrom: [
    "<rootDir>/src/**/**.ts",
    "!<rootDir>/src/modules.d.ts",
    "!<rootDir>/src/Constants.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ["text-summary", "lcov"],
  coverageDirectory: "coverage",
  coverageProvider: "v8", // "babel"
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "web-worker:(.*)\\.worker.ts": "<rootDir>/src/worker/$1.worker.ts",
  },
  modulePathIgnorePatterns: [
    "<rootDir>/test/unit/__dataset__",
    "<rootDir>/test/unit/__mocks__"
  ],
  preset: "ts-jest",
  setupFiles: [
    "jest-canvas-mock",
    "<rootDir>/test/unit/__config__/jest.setup.ts",
    "<rootDir>/test/unit/__config__/text-encoder.mock.ts",
    "<rootDir>/test/unit/__config__/setupTests.ts"
  ],
  setupFilesAfterEnv: [
    "jest-websocket-mock",
  ],
  testEnvironment: "jsdom",
  testMatch: [
    "**/unit/**/**.test.ts"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.claude/worktrees/"
  ],
  transform: {
    "^.+\\.css$": "jest-transform-css",
    "^.+\\.svg$": "<rootDir>/test/unit/__config__/svgTransform.ts",
    "^.+\\.ts$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }]
  },
  extensionsToTreatAsEsm: [".ts"],
  verbose: false
}
