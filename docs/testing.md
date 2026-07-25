# Testing Guide

This directory documents the unit and integration testing strategy for the YouTube English Lesson App.

## Suite Overview

The test suite uses **Vitest** for native ESM and TypeScript support with zero transformation overhead.

- **Unit Tests:** Target pure functions with zero setup/mocking overhead.
- **Integration Tests:** Target complex workflows (e.g. `ingestLesson`, `requireAuth`) using stubbed external dependencies (Gemini API, YouTube caption scraper) and a real, isolated PostgreSQL database (`TEST_DATABASE_URL`).

## Running Tests

```bash
# Run full test suite once
pnpm test

# Run tests in watch mode during development
pnpm test:watch
```

## Environment & Test Database

Integration tests require a dedicated PostgreSQL test database to verify Prisma queries and migrations without touching production or local development data.

### Configuration

1. Set `TEST_DATABASE_URL` in `.env`:
   ```env
   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/english_summary_test"
   ```

2. Apply migrations to the test database:
   ```bash
   node -e "process.env.DATABASE_URL=process.env.TEST_DATABASE_URL; require('child_process').execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });"
   ```

3. **Safety Guard:** The database reset helper (`tests/helpers/reset-test-database.ts`) checks that `TEST_DATABASE_URL` contains `test` before performing table truncations between test runs.

## Test Matrix Coverage

| Target | Test Location | Key Assertions |
|---|---|---|
| `parseYoutubeUrl` | `src/lib/ingest/parse-youtube-url.test.ts` | Video IDs (11 chars), query strings, `/shorts/`, playlist-only rejection |
| `formatTimestamp` | `src/lib/format-timestamp.test.ts` | Boundary times (`0:00`, `0:59`, `1:00`, `1:00:00`), NaN safety |
| `fsrs-mapping` | `src/lib/fsrs-mapping.test.ts` | Snake/camel round-trip, no `undefined` properties, State & Rating enums |
| `gradeFlashcard` | `src/lib/fsrs/grade-flashcard.test.ts` | `due(Again) < due(Good) < due(Easy)`, reps increment, Review -> Relearning transition |
| `lesson-schemas` | `src/lib/gemini/lesson-schemas.test.ts` | Zod arities: 4 grammar points x 4 examples, 5 quiz questions x 3 options, 6–10 vocab items |
| `auth-cookie` | `src/lib/auth/auth-cookie.test.ts` | WebCrypto HMAC signing, timestamp verification, tamper & wrong-secret rejection |
| `ingestLesson` | `tests/integration/ingest-lesson.test.ts` | Idempotency (reused flag), DB transaction persistence, caption fallback |
| `requireAuth` | `tests/integration/auth-guard.test.ts` | Server action auth guard, cookie validation, rejection of unauthenticated calls |
