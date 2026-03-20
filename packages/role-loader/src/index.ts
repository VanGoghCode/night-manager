export interface RoleDefinition {
  slug: string;
  title: string;
  path: string;
}

const roles = {
  "ai-project-manager": {
    slug: "ai-project-manager",
    title: "AI Project Manager",
    path: "roles/ai-project-manager.md"
  },
  "senior-backend-developer": {
    slug: "senior-backend-developer",
    title: "Senior Backend Developer",
    path: "roles/senior-backend-developer.md"
  },
  "junior-backend-developer": {
    slug: "junior-backend-developer",
    title: "Junior Backend Developer",
    path: "roles/junior-backend-developer.md"
  },
  "senior-frontend-developer": {
    slug: "senior-frontend-developer",
    title: "Senior Frontend Developer",
    path: "roles/senior-frontend-developer.md"
  },
  reviewer: {
    slug: "reviewer",
    title: "Reviewer",
    path: "roles/reviewer.md"
  },
  "qa-engineer": {
    slug: "qa-engineer",
    title: "QA Engineer",
    path: "roles/qa-engineer.md"
  },
  "release-manager": {
    slug: "release-manager",
    title: "Release Manager",
    path: "roles/release-manager.md"
  }
} satisfies Record<string, RoleDefinition>;

export type RoleSlug = keyof typeof roles;

export function loadRoleDefinition(slug: RoleSlug): RoleDefinition {
  return roles[slug];
}
