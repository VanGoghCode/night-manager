export const PLATFORM_ROLES = [
  "admin",
  "product_manager",
  "engineer",
  "reviewer",
  "qa",
  "release_manager"
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const TICKET_WRITE_ROLES: PlatformRole[] = ["admin", "product_manager", "engineer"];
export const ADMIN_ONLY_ROLES: PlatformRole[] = ["admin"];

export interface SessionContext {
  subjectId: string;
  role: PlatformRole;
  expiresAt: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
}

export function isSessionActive(session: SessionContext, now = new Date()): boolean {
  return new Date(session.expiresAt).getTime() > now.getTime();
}

export function hasRequiredRole(role: PlatformRole, allowedRoles: PlatformRole[]): boolean {
  return allowedRoles.includes(role);
}
