import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { auditEvent } from "@night-manager/audit-sdk";
import { loadApiEnvironment } from "@night-manager/config";
import { getApiInfrastructureConnections } from "@night-manager/database";
import { createWorkflowSnapshot } from "@night-manager/workflow-engine";

async function bootstrap(): Promise<void> {
  const env = loadApiEnvironment();
  const connections = getApiInfrastructureConnections();

  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });

  app.getHttpAdapter().get("/health", (_request: unknown, response: { send: (body: unknown) => void }) => {
    response.send({
      status: "ok",
      service: "api",
      environment: env.NODE_ENV,
      workflow: createWorkflowSnapshot(),
      connections: {
        postgres: {
          host: connections.postgres.host,
          port: connections.postgres.port,
          database: connections.postgres.database,
          ssl: connections.postgres.ssl
        },
        redis: {
          host: connections.redis.host,
          port: connections.redis.port,
          db: connections.redis.db
        }
      }
    });
  });

  await app.listen(env.API_PORT);

  auditEvent({
    actorId: "system",
    action: "api.started",
    scope: "platform",
    metadata: {
      port: env.API_PORT,
      environment: env.NODE_ENV
    }
  });
}

void bootstrap();
