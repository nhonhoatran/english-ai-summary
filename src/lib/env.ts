import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1),
  APP_PASSWORD: z.string().min(8),
  AUTH_SECRET: z.string().min(32),
  CRON_SECRET: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
});

// Docker/CI build has no real secrets: Next.js still loads every route module
// during "collect page data", so validation must be skippable at build time.
// Runtime keeps validating strictly.
const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "1" || process.env.SKIP_ENV_VALIDATION === "true";

const parsed = schema.safeParse(process.env);
if (!parsed.success && !skipValidation) {
  throw new Error(
    `Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
  );
}

export const env = parsed.success
  ? parsed.data
  : ({
      ...process.env,
      GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
    } as unknown as z.infer<typeof schema>);
