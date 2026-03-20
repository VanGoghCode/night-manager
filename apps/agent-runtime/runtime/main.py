from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock, Thread
from time import sleep
from urllib.parse import urlparse
import json
import os


ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_PATH = ROOT_DIR / ".env"
ENV_LOCAL_PATH = ROOT_DIR / ".env.local"
STATE_LOCK = Lock()
WORKER_STATE = {
    "status": "starting",
    "last_heartbeat_at": None,
}


@dataclass(slots=True)
class WorkerEnvironment:
    node_env: str
    worker_health_port: int
    worker_poll_interval_ms: int
    database_host: str
    database_port: int
    database_name: str
    redis_host: str
    redis_port: int
    redis_db: int
    github_app_id: str
    github_webhook_secret: str
    jwt_secret: str
    ai_provider: str
    ai_provider_api_key: str


@dataclass(slots=True)
class WorkerHeartbeat:
    worker_id: str
    state: str
    timestamp: str
    authorized_ticket_ids: list[str]


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        if urlparse(self.path).path != "/health":
            self.send_response(404)
            self.end_headers()
            return

        with STATE_LOCK:
            payload = {
                "status": WORKER_STATE["status"],
                "service": "agent-runtime",
                "last_heartbeat_at": WORKER_STATE["last_heartbeat_at"],
            }

        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def log_message(self, format: str, *args: object) -> None:
        return


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def load_environment() -> WorkerEnvironment:
    load_env_file(ENV_PATH)
    load_env_file(ENV_LOCAL_PATH)

    required = [
        "NODE_ENV",
        "WORKER_HEALTH_PORT",
        "WORKER_POLL_INTERVAL_MS",
        "DATABASE_HOST",
        "DATABASE_PORT",
        "DATABASE_NAME",
        "REDIS_HOST",
        "REDIS_PORT",
        "REDIS_DB",
        "GITHUB_APP_ID",
        "GITHUB_WEBHOOK_SECRET",
        "JWT_SECRET",
        "AI_PROVIDER",
        "AI_PROVIDER_API_KEY",
    ]

    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    return WorkerEnvironment(
        node_env=os.environ["NODE_ENV"],
        worker_health_port=int(os.environ["WORKER_HEALTH_PORT"]),
        worker_poll_interval_ms=int(os.environ["WORKER_POLL_INTERVAL_MS"]),
        database_host=os.environ["DATABASE_HOST"],
        database_port=int(os.environ["DATABASE_PORT"]),
        database_name=os.environ["DATABASE_NAME"],
        redis_host=os.environ["REDIS_HOST"],
        redis_port=int(os.environ["REDIS_PORT"]),
        redis_db=int(os.environ["REDIS_DB"]),
        github_app_id=os.environ["GITHUB_APP_ID"],
        github_webhook_secret=os.environ["GITHUB_WEBHOOK_SECRET"],
        jwt_secret=os.environ["JWT_SECRET"],
        ai_provider=os.environ["AI_PROVIDER"],
        ai_provider_api_key=os.environ["AI_PROVIDER_API_KEY"],
    )


def build_heartbeat() -> WorkerHeartbeat:
    return WorkerHeartbeat(
        worker_id="worker-mvp-001",
        state="idle",
        timestamp=datetime.now(UTC).isoformat(),
        authorized_ticket_ids=[],
    )


def start_health_server(port: int) -> None:
    server = ThreadingHTTPServer(("127.0.0.1", port), HealthHandler)
    server.serve_forever()


def main() -> None:
    env = load_environment()

    health_thread = Thread(
        target=start_health_server,
        args=(env.worker_health_port,),
        daemon=True,
        name="worker-health-server",
    )
    health_thread.start()

    print("Night Manager agent runtime starting")
    print("TODO: PRODUCTION connect Redis locks, Step Functions task claims, and scoped credentials")
    print(
        json.dumps(
            {
                "service": "agent-runtime",
                "health_url": f"http://127.0.0.1:{env.worker_health_port}/health",
                "database": {
                    "host": env.database_host,
                    "port": env.database_port,
                    "name": env.database_name,
                },
                "redis": {
                    "host": env.redis_host,
                    "port": env.redis_port,
                    "db": env.redis_db,
                },
            }
        )
    )

    with STATE_LOCK:
        WORKER_STATE["status"] = "ok"

    while True:
        heartbeat = build_heartbeat()
        with STATE_LOCK:
            WORKER_STATE["last_heartbeat_at"] = heartbeat.timestamp
        print(json.dumps(asdict(heartbeat)))
        sleep(env.worker_poll_interval_ms / 1000)


if __name__ == "__main__":
    main()
