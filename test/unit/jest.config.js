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
  // The floor of what the suite measured on 2026-10-06 (88.05 / 88.71 / 86.82 / 88.05), not a
  // round target: a 75 here let twelve points of coverage drift away without failing anything.
  // Raise it when coverage goes up, never lower it to make a change pass.
  coverageThreshold: {
    global: {
      branches: 88,
      functions: 86,
      lines: 88,
      statements: 88,
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
    // Only the worker's name: the relative path before it depends on where the importing file sits.
    "web-worker:(?:.*/)?([^/]+)\\.worker.ts": "<rootDir>/src/worker/$1.worker.ts",
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
        // Example modules are plain JS served as is, without a build: their tests import them
        allowJs: true,
      }
    }],
    "^.+/examples/.+\\.js$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        allowJs: true,
      }
    }]
  },
  extensionsToTreatAsEsm: [".ts"],
  verbose: false
}
