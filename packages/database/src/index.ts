import { PrismaClient } from "@prisma/client";
import {
  loadApiEnvironment,
  loadSharedEnvironment,
  loadWebEnvironment,
  loadWebhookEnvironment,
  loadWorkerEnvironment
} from "@night-manager/config";

interface PostgresConnectionSettings {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  url: string;
}

interface RedisConnectionSettings {
  host: string;
  port: number;
  db: number;
  url: string;
}

export interface LocalInfrastructureConnections {
  postgres: PostgresConnectionSettings;
  redis: RedisConnectionSettings;
}

function buildConnectionSettings(env: {
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_SSL: boolean;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_DB: number;
}): LocalInfrastructureConnections {
  return {
    postgres: {
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      database: env.DATABASE_NAME,
      user: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      ssl: env.DATABASE_SSL,
      url: env.DATABASE_URL
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      db: env.REDIS_DB,
      url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`
    }
  };
}

let prismaClient: PrismaClient | undefined;

export function createPrismaClient() {
  loadSharedEnvironment();
  return new PrismaClient({
    log: ["warn", "error"]
  });
}

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = createPrismaClient();
  }

  return prismaClient;
}

export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";
export * from "./role-markdown-sync";

export function getApiInfrastructureConnections(): LocalInfrastructureConnections {
  return buildConnectionSettings(loadApiEnvironment());
}

export function getWebhookInfrastructureConnections(): LocalInfrastructureConnections {
  return buildConnectionSettings(loadWebhookEnvironment());
}

export function getWorkerInfrastructureConnections(): LocalInfrastructureConnections {
  return buildConnectionSettings(loadWorkerEnvironment());
}

export function getWebInfrastructureConnections(): LocalInfrastructureConnections {
  return buildConnectionSettings(loadWebEnvironment());
}
