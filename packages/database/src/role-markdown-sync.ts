import type { PrismaClient } from "@prisma/client";
import { ExecutorType } from "@prisma/client";
import {
  loadRoleDefinitions,
  type LoadedRoleDefinition,
  type RoleExecutorType
} from "@night-manager/role-loader";

export interface RoleMarkdownSyncItem {
  slug: string;
  title: string;
  fileName: string;
  checksum: string;
  version: number;
  status: "created" | "reactivated" | "unchanged";
  roleProfileId: string;
  roleMarkdownFileId: string;
}

export interface RoleMarkdownSyncResult {
  organizationId: string;
  syncedAt: string;
  items: RoleMarkdownSyncItem[];
}

export interface RoleMarkdownSyncOptions {
  organizationId?: string;
  organizationSlug?: string;
  createdById?: string;
  startDir?: string;
}

function mapExecutorType(value: RoleExecutorType) {
  switch (value) {
    case "HUMAN":
      return ExecutorType.HUMAN;
    case "HYBRID":
      return ExecutorType.HYBRID;
    default:
      return ExecutorType.AI;
  }
}

function buildRoleDescription(role: LoadedRoleDefinition) {
  const firstMissionItem = role.parsed.requiredSections.mission.items[0];
  return firstMissionItem ?? role.description;
}

async function syncSingleRoleMarkdown(
  prisma: PrismaClient,
  organizationId: string,
  role: LoadedRoleDefinition,
  createdById: string | undefined,
  syncedAt: Date
): Promise<RoleMarkdownSyncItem> {
  const roleProfile = await prisma.roleProfile.upsert({
    where: {
      organizationId_slug: {
        organizationId,
        slug: role.slug
      }
    },
    update: {
      title: role.title,
      description: buildRoleDescription(role),
      defaultExecutorType: mapExecutorType(role.defaultExecutorType)
    },
    create: {
      organizationId,
      slug: role.slug,
      title: role.title,
      description: buildRoleDescription(role),
      defaultExecutorType: mapExecutorType(role.defaultExecutorType)
    }
  });

  const existingMarkdownFiles = await prisma.roleMarkdownFile.findMany({
    where: {
      roleProfileId: roleProfile.id
    },
    orderBy: {
      version: "desc"
    }
  });

  const existingMatchingFile = existingMarkdownFiles.find((file) => file.checksum === role.checksum);

  if (existingMatchingFile) {
    if (!existingMatchingFile.isActive) {
      await prisma.$transaction([
        prisma.roleMarkdownFile.updateMany({
          where: {
            roleProfileId: roleProfile.id,
            isActive: true
          },
          data: {
            isActive: false
          }
        }),
        prisma.roleMarkdownFile.update({
          where: {
            id: existingMatchingFile.id
          },
          data: {
            fileName: role.fileName,
            content: role.rawMarkdown,
            isActive: true,
            publishedAt: existingMatchingFile.publishedAt ?? syncedAt,
            ...(createdById && !existingMatchingFile.createdById ? { createdById } : {})
          }
        })
      ]);

      return {
        slug: role.slug,
        title: role.title,
        fileName: role.fileName,
        checksum: role.checksum,
        version: existingMatchingFile.version,
        status: "reactivated",
        roleProfileId: roleProfile.id,
        roleMarkdownFileId: existingMatchingFile.id
      };
    }

    await prisma.roleMarkdownFile.update({
      where: {
        id: existingMatchingFile.id
      },
      data: {
        fileName: role.fileName,
        content: role.rawMarkdown
      }
    });

    return {
      slug: role.slug,
      title: role.title,
      fileName: role.fileName,
      checksum: role.checksum,
      version: existingMatchingFile.version,
      status: "unchanged",
      roleProfileId: roleProfile.id,
      roleMarkdownFileId: existingMatchingFile.id
    };
  }

  const nextVersion = (existingMarkdownFiles[0]?.version ?? 0) + 1;

  const [, createdMarkdownFile] = await prisma.$transaction([
    prisma.roleMarkdownFile.updateMany({
      where: {
        roleProfileId: roleProfile.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    }),
    prisma.roleMarkdownFile.create({
      data: {
        roleProfileId: roleProfile.id,
        version: nextVersion,
        fileName: role.fileName,
        content: role.rawMarkdown,
        checksum: role.checksum,
        isActive: true,
        publishedAt: syncedAt,
        ...(createdById ? { createdById } : {})
      }
    })
  ]);

  return {
    slug: role.slug,
    title: role.title,
    fileName: role.fileName,
    checksum: role.checksum,
    version: createdMarkdownFile.version,
    status: "created",
    roleProfileId: roleProfile.id,
    roleMarkdownFileId: createdMarkdownFile.id
  };
}

export async function syncRoleMarkdownCatalog(
  prisma: PrismaClient,
  options: RoleMarkdownSyncOptions = {}
): Promise<RoleMarkdownSyncResult | null> {
  const organizationWhere = options.organizationSlug
    ? {
        slug: options.organizationSlug
      }
    : undefined;

  const organization =
    options.organizationId !== undefined
      ? await prisma.organization.findUnique({
          where: {
            id: options.organizationId
          },
          select: {
            id: true
          }
        })
      : await prisma.organization.findFirst({
          ...(organizationWhere ? { where: organizationWhere } : {}),
          orderBy: {
            createdAt: "asc"
          },
          select: {
            id: true
          }
        });

  if (!organization) {
    return null;
  }

  const syncedAt = new Date();
  const roles = loadRoleDefinitions(options.startDir);
  const items: RoleMarkdownSyncItem[] = [];

  for (const role of roles) {
    items.push(
      await syncSingleRoleMarkdown(prisma, organization.id, role, options.createdById, syncedAt)
    );
  }

  return {
    organizationId: organization.id,
    syncedAt: syncedAt.toISOString(),
    items
  };
}
