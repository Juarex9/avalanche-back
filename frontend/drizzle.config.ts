import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const url =
  process.env.DATABASE_URL_UNPOOLED?.trim() ??
  process.env.DATABASE_URL?.trim();

if (!url) {
  throw new Error(
    "Definí DATABASE_URL o DATABASE_URL_UNPOOLED en .env.local para migraciones.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
