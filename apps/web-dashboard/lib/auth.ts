import "server-only";
import type { AuthenticatedUser, PlatformRole } from "@night-manager/auth";
import { loadWebPublicEnvironment } from "@night-manager/config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ACCESS_TOKEN_COOKIE_NAME = "night_manager_access_token";

interface CurrentUserResponse {
  user: AuthenticatedUser;
}

interface TicketsResponse {
  items: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    assignedRole: string | null;
    module: {
      name: string;
      slug: string;
    } | null;
    repository: {
      name: string;
      slug: string;
    } | null;
    workflowState: {
      key: string;
      name: string;
    } | null;
  }>;
}

export interface RoleListItem {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  defaultExecutorType: string;
  activeVersion: number;
  fileName: string;
  checksum: string;
  publishedAt: string | null;
  updatedAt: string | null;
  sectionHeadings: Array<{
    key: string;
    heading: string;
  }>;
  source: "database" | "filesystem";
}

interface RolesResponse {
  items: RoleListItem[];
}

export interface RoleDetail {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  defaultExecutorType: string;
  source: "database" | "filesystem";
  markdown: {
    id: string | null;
    version: number;
    fileName: string;
    checksum: string;
    rawMarkdown: string;
    renderedHtml: string;
    publishedAt: string | null;
    createdAt: string | null;
  };
  sections: Array<{
    key: string;
    heading: string;
    content: string;
    items: string[];
    order: number;
    requiredKey: string;
  }>;
  versions: Array<{
    id: string;
    version: number;
    fileName: string;
    checksum: string;
    isActive: boolean;
    publishedAt: string | null;
    createdAt: string;
  }>;
}

interface RoleDetailResponse {
  item: RoleDetail;
}

function createApiUrl(pathname: string) {
  const env = loadWebPublicEnvironment();
  return new URL(pathname, env.NEXT_PUBLIC_API_BASE_URL).toString();
}

async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

async function fetchWithAccessToken(pathname: string) {
  const token = await getSessionToken();

  if (!token) {
    return undefined;
  }

  return fetch(createApiUrl(pathname), {
    method: "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const response = await fetchWithAccessToken("/auth/me");

  if (!response?.ok) {
    return null;
  }

  const body = (await response.json()) as CurrentUserResponse;
  return body.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(allowedRoles: PlatformRole[]) {
  const user = await requireCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdminUser() {
  return requireRole(["admin"]);
}

export async function getDashboardTickets() {
  const response = await fetchWithAccessToken("/tickets");

  if (!response?.ok) {
    return [];
  }

  const body = (await response.json()) as TicketsResponse;
  return body.items;
}

export async function getRoleCatalog() {
  const response = await fetchWithAccessToken("/roles");

  if (!response?.ok) {
    return [];
  }

  const body = (await response.json()) as RolesResponse;
  return body.items;
}

export async function getRoleDetail(slug: string) {
  const response = await fetchWithAccessToken(`/roles/${slug}`);

  if (!response?.ok) {
    return null;
  }

  const body = (await response.json()) as RoleDetailResponse;
  return body.item;
}
