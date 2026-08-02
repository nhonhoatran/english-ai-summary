/**
 * Vitest runs in plain Node, where the real `server-only` package throws on
 * import. Server modules are exactly what the integration tests exercise, so
 * the alias in vitest.config.ts points at this no-op instead.
 */
export {};
