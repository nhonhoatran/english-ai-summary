import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Agent/editor tooling checked into the repo. These are vendored helper
    // scripts (CommonJS, loosely typed) for Claude Code / OpenCode / Cursor,
    // not application source — linting them produced 1000+ findings we neither
    // own nor can meaningfully fix.
    ".agent/**",
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    ".opencode/**",
    ".playwright-mcp/**",
  ]),
  {
    // The custom Socket.io server must stay CommonJS: package.json has no
    // "type": "module", so `import` syntax would fail at runtime.
    files: ["server.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
