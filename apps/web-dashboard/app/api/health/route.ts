import { NextResponse } from "next/server";
import { loadWebEnvironment } from "@night-manager/config";
import { getWebInfrastructureConnections } from "@night-manager/database";

export function GET() {
  const env = loadWebEnvironment();
  const connections = getWebInfrastructureConnections();

  return NextResponse.json({
    status: "ok",
    service: "web-dashboard",
    environment: env.NODE_ENV,
    endpoints: {
      app: env.NEXT_PUBLIC_APP_URL,
      api: env.NEXT_PUBLIC_API_BASE_URL,
      webhook: env.NEXT_PUBLIC_WEBHOOK_BASE_URL,
      worker: env.NEXT_PUBLIC_WORKER_HEALTH_URL
    },
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
}
