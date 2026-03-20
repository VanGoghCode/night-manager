import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { auditEvent } from "@night-manager/audit-sdk";
import { loadWebhookEnvironment } from "@night-manager/config";
import { getWebhookInfrastructureConnections } from "@night-manager/database";

async function bootstrap(): Promise<void> {
  const env = loadWebhookEnvironment();
  const connections = getWebhookInfrastructureConnections();

  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().get("/health", (_request: unknown, response: { send: (body: unknown) => void }) => {
    response.send({
      status: "ok",
      service: "github-webhook",
      environment: env.NODE_ENV,
      connections: {
        postgres: {
          host: connections.postgres.host,
          port: connections.postgres.port,
          database: connections.postgres.database
        },
        redis: {
          host: connections.redis.host,
          port: connections.redis.port,
          db: connections.redis.db
        }
      }
    });
  });

  await app.listen(env.GITHUB_WEBHOOK_PORT);

  auditEvent({
    actorId: "system",
    action: "github-webhook.started",
    scope: "github",
    metadata: {
      port: env.GITHUB_WEBHOOK_PORT,
      environment: env.NODE_ENV
    }
  });
}

void bootstrap();
