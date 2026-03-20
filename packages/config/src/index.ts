import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

let envLoaded = false;

function loadRootEnvironmentFiles(): void {
  if (envLoaded) {
    return;
  }

  const rootDir = process.cwd();
  const envPath = path.join(rootDir, ".env");
  const envLocalPath = path.join(rootDir, ".env.local");

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: true });
  }

  envLoaded = true;
}

const booleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");
const portFromString = z.coerce.number().int().min(1).max(65535);

const baseEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"])
});

const infrastructureEnvironmentSchema = baseEnvironmentSchema.extend({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: portFromString,
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_SSL: booleanFromString,
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: portFromString,
  REDIS_DB: z.coerce.number().int().min(0)
});

const integrationEnvironmentSchema = baseEnvironmentSchema.extend({
  JWT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  AI_PROVIDER: z.string().min(1),
  AI_PROVIDER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1)
});

const webPublicEnvironmentSchema = baseEnvironmentSchema.extend({
  WEB_PORT: portFromString,
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_WEBHOOK_BASE_URL: z.string().url(),
  NEXT_PUBLIC_WORKER_HEALTH_URL: z.string().url()
});

const webEnvironmentSchema = webPublicEnvironmentSchema.extend({
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: portFromString,
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_SSL: booleanFromString,
  DATABASE_URL: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: portFromString,
  REDIS_DB: z.coerce.number().int().min(0)
});

const apiEnvironmentSchema = infrastructureEnvironmentSchema.extend({
  API_PORT: portFromString,
  JWT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  AI_PROVIDER: z.string().min(1),
  AI_PROVIDER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1)
});

const webhookEnvironmentSchema = infrastructureEnvironmentSchema.extend({
  GITHUB_WEBHOOK_PORT: portFromString,
  JWT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  AI_PROVIDER: z.string().min(1),
  AI_PROVIDER_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1)
});

const workerEnvironmentSchema = infrastructureEnvironmentSchema.extend({
  WORKER_HEALTH_PORT: portFromString,
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(1000),
  JWT_SECRET: z.string().min(1),
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_CLIENT_ID: z.string().min(1),
  GITHUB_APP_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  AI_PROVIDER: z.string().min(1),
  AI_PROVIDER_API_KEY: z.string().min(1)
});

function parseEnvironment<TSchema extends z.ZodTypeAny>(schema: TSchema): z.infer<TSchema> {
  loadRootEnvironmentFiles();
  return schema.parse(process.env);
}

export function loadBaseEnvironment() {
  return parseEnvironment(baseEnvironmentSchema);
}

export function loadInfrastructureEnvironment() {
  return parseEnvironment(infrastructureEnvironmentSchema);
}

export function loadIntegrationEnvironment() {
  return parseEnvironment(integrationEnvironmentSchema);
}

export function loadSharedEnvironment() {
  return {
    ...loadInfrastructureEnvironment(),
    ...loadIntegrationEnvironment()
  };
}

export function loadWebPublicEnvironment() {
  return parseEnvironment(webPublicEnvironmentSchema);
}

export function loadWebEnvironment() {
  return parseEnvironment(webEnvironmentSchema);
}

export function loadApiEnvironment() {
  return parseEnvironment(apiEnvironmentSchema);
}

export function loadWebhookEnvironment() {
  return parseEnvironment(webhookEnvironmentSchema);
}

export function loadWorkerEnvironment() {
  return parseEnvironment(workerEnvironmentSchema);
}
