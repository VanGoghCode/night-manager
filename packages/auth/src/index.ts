export type PlatformRole =
  | "human_admin"
  | "human_operator"
  | "ai_project_manager"
  | "ai_worker"
  | "reviewer";

export interface SessionContext {
  subjectId: string;
  role: PlatformRole;
  expiresAt: string;
}

export function isSessionActive(session: SessionContext, now = new Date()): boolean {
  return new Date(session.expiresAt).getTime() > now.getTime();
}
