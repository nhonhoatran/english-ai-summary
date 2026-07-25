import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  APP_PASSWORD: z.string().min(8),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    `Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
  );
}

export const env = parsed.data;
