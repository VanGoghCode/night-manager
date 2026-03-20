import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });

export default defineConfig({
  schema: path.join(currentDir, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(currentDir, "prisma", "migrations")
  },
  datasource: {
    url: env("DATABASE_URL")
  }
});
