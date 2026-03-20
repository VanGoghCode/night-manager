import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const REQUIRED_ROLE_SECTION_KEYS = [
  "mission",
  "responsibilities",
  "allowed_actions",
  "forbidden_actions",
  "assignment_rules",
  "escalation_rules",
  "branch_rules",
  "commit_rules",
  "pr_rules",
  "security_rules",
  "definition_of_done"
] as const;

export type RoleSectionKey = (typeof REQUIRED_ROLE_SECTION_KEYS)[number];
export type RoleExecutorType = "HUMAN" | "AI" | "HYBRID";

export interface RoleCatalogEntry {
  slug: string;
  title: string;
  fileName: string;
  description: string;
  defaultExecutorType: RoleExecutorType;
}

export interface RoleDefinitionSummary extends RoleCatalogEntry {
  path: string;
}

export interface ParsedRoleSection {
  key: string;
  heading: string;
  content: string;
  items: string[];
  order: number;
  requiredKey: RoleSectionKey;
}

export interface ParsedRoleMarkdown {
  title: string;
  sections: ParsedRoleSection[];
  requiredSections: Record<RoleSectionKey, ParsedRoleSection>;
}

export interface LoadedRoleDefinition extends RoleDefinitionSummary {
  checksum: string;
  rawMarkdown: string;
  renderedHtml: string;
  parsed: ParsedRoleMarkdown;
}

const ROLE_CATALOG = [
  {
    slug: "ai-project-manager",
    title: "AI Project Manager",
    fileName: "ai-project-manager.md",
    description: "Coordinates planning, ticket generation, and policy-aligned assignment.",
    defaultExecutorType: "AI"
  },
  {
    slug: "senior-backend-developer",
    title: "Senior Backend Developer",
    fileName: "senior-backend-developer.md",
    description: "Delivers high-trust backend implementation work across services and data layers.",
    defaultExecutorType: "AI"
  },
  {
    slug: "junior-backend-developer",
    title: "Junior Backend Developer",
    fileName: "junior-backend-developer.md",
    description: "Handles bounded backend tasks with clear acceptance criteria and supervision paths.",
    defaultExecutorType: "AI"
  },
  {
    slug: "senior-frontend-developer",
    title: "Senior Frontend Developer",
    fileName: "senior-frontend-developer.md",
    description: "Builds policy-aware dashboard experiences and other frontend workflows.",
    defaultExecutorType: "AI"
  },
  {
    slug: "reviewer",
    title: "Reviewer",
    fileName: "reviewer.md",
    description: "Reviews implementation work for correctness, risk, and policy compliance.",
    defaultExecutorType: "HUMAN"
  },
  {
    slug: "qa-engineer",
    title: "QA Engineer",
    fileName: "qa-engineer.md",
    description: "Validates acceptance criteria, regressions, and release readiness.",
    defaultExecutorType: "HUMAN"
  },
  {
    slug: "release-manager",
    title: "Release Manager",
    fileName: "release-manager.md",
    description: "Coordinates safe, policy-compliant releases and deployment decisions.",
    defaultExecutorType: "HUMAN"
  }
] as const satisfies readonly RoleCatalogEntry[];

const roleCatalogBySlug = new Map<string, RoleCatalogEntry>(
  ROLE_CATALOG.map((entry) => [entry.slug, entry])
);
const roleCatalogByFileName = new Map<string, RoleCatalogEntry>(
  ROLE_CATALOG.map((entry) => [entry.fileName, entry])
);

const roleSectionAliases: Record<RoleSectionKey, string[]> = {
  mission: ["mission"],
  responsibilities: ["responsibilities"],
  allowed_actions: ["allowed actions"],
  forbidden_actions: ["forbidden actions"],
  assignment_rules: ["assignment rules"],
  escalation_rules: ["escalation rules"],
  branch_rules: ["branch rules"],
  commit_rules: ["commit rules"],
  pr_rules: ["pr rules", "pull request rules"],
  security_rules: ["security rules"],
  definition_of_done: ["definition of done"]
};

export type RoleSlug = (typeof ROLE_CATALOG)[number]["slug"];

function findWorkspaceRoot(startDir = process.cwd()): string {
  let currentDir = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(currentDir, "package.json");
    const pnpmWorkspacePath = path.join(currentDir, "pnpm-workspace.yaml");

    if (fs.existsSync(packageJsonPath) && fs.existsSync(pnpmWorkspacePath)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);

    if (parentDir === currentDir) {
      return startDir;
    }

    currentDir = parentDir;
  }
}

export function getRolesDirectoryPath(startDir = process.cwd()) {
  return path.join(findWorkspaceRoot(startDir), "roles");
}

function normalizeHeading(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function getRequiredSectionKey(heading: string) {
  const normalizedHeading = normalizeHeading(heading);

  for (const requiredKey of REQUIRED_ROLE_SECTION_KEYS) {
    if (roleSectionAliases[requiredKey].includes(normalizedHeading)) {
      return requiredKey;
    }
  }

  return undefined;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderMarkdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (!paragraphLines.length) {
      return;
    }

    htmlParts.push(`<p>${escapeHtml(paragraphLines.join(" "))}</p>`);
    paragraphLines = [];
  }

  function flushList() {
    if (!listItems.length) {
      return;
    }

    const items = listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    htmlParts.push(`<ul>${items}</ul>`);
    listItems = [];
  }

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    if (trimmedLine.startsWith("# ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h1>${escapeHtml(trimmedLine.slice(2).trim())}</h1>`);
      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h2>${escapeHtml(trimmedLine.slice(3).trim())}</h2>`);
      continue;
    }

    if (trimmedLine.startsWith("### ")) {
      flushParagraph();
      flushList();
      htmlParts.push(`<h3>${escapeHtml(trimmedLine.slice(4).trim())}</h3>`);
      continue;
    }

    if (trimmedLine.startsWith("- ")) {
      flushParagraph();
      listItems.push(trimmedLine.slice(2).trim());
      continue;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return htmlParts.join("\n");
}

export function parseRoleMarkdown(markdown: string, fallbackTitle: string): ParsedRoleMarkdown {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  let title = fallbackTitle;
  let currentHeading: string | undefined;
  let currentKey: RoleSectionKey | undefined;
  let currentLines: string[] = [];
  const sections: ParsedRoleSection[] = [];

  const flushSection = () => {
    if (!currentHeading || !currentKey) {
      currentLines = [];
      return;
    }

    const content = currentLines.join("\n").trim();
    sections.push({
      key: currentKey,
      heading: currentHeading,
      content,
      items: currentLines
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim()),
      order: sections.length,
      requiredKey: currentKey
    });

    currentLines = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("# ")) {
      title = trimmedLine.slice(2).trim();
      continue;
    }

    if (trimmedLine.startsWith("## ")) {
      flushSection();
      currentHeading = trimmedLine.slice(3).trim();
      currentKey = getRequiredSectionKey(currentHeading);

      if (!currentKey) {
        throw new Error(`Unknown role section heading "${currentHeading}".`);
      }

      continue;
    }

    if (currentHeading) {
      currentLines.push(line);
    }
  }

  flushSection();

  const requiredSections = Object.fromEntries(
    sections.map((section) => [section.requiredKey, section])
  ) as Record<RoleSectionKey, ParsedRoleSection>;

  const missingSections = REQUIRED_ROLE_SECTION_KEYS.filter(
    (sectionKey) => !requiredSections[sectionKey]
  );

  if (missingSections.length) {
    throw new Error(`Missing required role sections: ${missingSections.join(", ")}.`);
  }

  return {
    title,
    sections,
    requiredSections
  };
}

function createRoleChecksum(markdown: string) {
  return crypto.createHash("sha256").update(markdown).digest("hex");
}

function getRoleCatalogEntry(slug: RoleSlug): RoleCatalogEntry {
  const entry = roleCatalogBySlug.get(slug);

  if (!entry) {
    throw new Error(`Unknown role slug "${slug}".`);
  }

  return entry;
}

export function listRoleDefinitions(startDir = process.cwd()): RoleDefinitionSummary[] {
  const rolesDirectoryPath = getRolesDirectoryPath(startDir);

  return ROLE_CATALOG.map((entry) => ({
    ...entry,
    path: path.join(rolesDirectoryPath, entry.fileName)
  }));
}

export function loadRoleDefinition(slug: RoleSlug, startDir = process.cwd()): LoadedRoleDefinition {
  const role = getRoleCatalogEntry(slug);
  const rolesDirectoryPath = getRolesDirectoryPath(startDir);
  const rolePath = path.join(rolesDirectoryPath, role.fileName);
  const rawMarkdown = fs.readFileSync(rolePath, "utf8").trim();
  const parsed = parseRoleMarkdown(rawMarkdown, role.title);

  return {
    ...role,
    path: rolePath,
    checksum: createRoleChecksum(rawMarkdown),
    rawMarkdown,
    renderedHtml: renderMarkdownToHtml(rawMarkdown),
    parsed
  };
}

export function loadRoleDefinitions(startDir = process.cwd()) {
  return ROLE_CATALOG.map((role) => loadRoleDefinition(role.slug, startDir));
}

export function loadRoleDefinitionByFileName(fileName: string, startDir = process.cwd()) {
  const role = roleCatalogByFileName.get(fileName);

  if (!role) {
    return undefined;
  }

  return loadRoleDefinition(role.slug as RoleSlug, startDir);
}

export function getRoleMissionSummary(role: LoadedRoleDefinition) {
  return role.parsed.requiredSections.mission.items[0] ?? role.description;
}

export function getRoleCatalog() {
  return [...ROLE_CATALOG];
}
