import { Inject, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { AuditActorType, PlatformRole, syncRoleMarkdownCatalog } from "@night-manager/database";
import {
  getRoleCatalog,
  loadRoleDefinition,
  parseRoleMarkdown,
  renderMarkdownToHtml,
  type LoadedRoleDefinition,
  type RoleSlug
} from "@night-manager/role-loader";
import { AuditTrailService } from "../audit-trail.service";
import { PrismaService } from "../prisma.service";

interface RoleListItem {
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

interface RoleDetailVersion {
  id: string;
  version: number;
  fileName: string;
  checksum: string;
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
}

@Injectable()
export class RolesService implements OnModuleInit {
  private syncPromise: Promise<void> | undefined;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditTrailService) private readonly auditTrail: AuditTrailService
  ) {}

  async onModuleInit() {
    await this.ensureRoleCatalogSynced();
  }

  async listRoles() {
    await this.ensureRoleCatalogSynced();

    const roleProfiles = await this.prisma.client.roleProfile.findMany({
      orderBy: {
        slug: "asc"
      },
      include: {
        markdownFiles: {
          orderBy: {
            version: "desc"
          }
        }
      }
    });

    if (!roleProfiles.length) {
      return {
        items: getRoleCatalog().map((role) => this.mapFilesystemRoleToListItem(loadRoleDefinition(role.slug)))
      };
    }

    return {
      items: roleProfiles.map((roleProfile) => {
        const activeMarkdownFile = roleProfile.markdownFiles.find((file) => file.isActive) ?? roleProfile.markdownFiles[0];

        if (!activeMarkdownFile) {
          const fileRole = loadRoleDefinition(roleProfile.slug as RoleSlug);
          return this.mapFilesystemRoleToListItem(fileRole);
        }

        const parsed = parseRoleMarkdown(activeMarkdownFile.content, roleProfile.title);

        return {
          id: roleProfile.id,
          slug: roleProfile.slug,
          title: roleProfile.title,
          description: roleProfile.description ?? "",
          defaultExecutorType: roleProfile.defaultExecutorType,
          activeVersion: activeMarkdownFile.version,
          fileName: activeMarkdownFile.fileName,
          checksum: activeMarkdownFile.checksum,
          publishedAt: activeMarkdownFile.publishedAt?.toISOString() ?? null,
          updatedAt: roleProfile.updatedAt.toISOString(),
          sectionHeadings: parsed.sections.map((section) => ({
            key: section.key,
            heading: section.heading
          })),
          source: "database" as const
        } satisfies RoleListItem;
      })
    };
  }

  async getRoleBySlug(slug: string) {
    await this.ensureRoleCatalogSynced();

    const roleProfile = await this.prisma.client.roleProfile.findFirst({
      where: {
        slug
      },
      include: {
        markdownFiles: {
          orderBy: {
            version: "desc"
          }
        }
      }
    });

    if (!roleProfile) {
      const role = this.loadFilesystemRole(slug);

      if (!role) {
        throw new NotFoundException(`Role "${slug}" was not found.`);
      }

      return {
        item: this.mapFilesystemRoleToDetail(role)
      };
    }

    const activeMarkdownFile = roleProfile.markdownFiles.find((file) => file.isActive) ?? roleProfile.markdownFiles[0];

    if (!activeMarkdownFile) {
      const role = this.loadFilesystemRole(slug);

      if (!role) {
        throw new NotFoundException(`Role "${slug}" does not have an active markdown file.`);
      }

      return {
        item: this.mapFilesystemRoleToDetail(role)
      };
    }

    const parsed = parseRoleMarkdown(activeMarkdownFile.content, roleProfile.title);

    return {
      item: {
        id: roleProfile.id,
        slug: roleProfile.slug,
        title: roleProfile.title,
        description: roleProfile.description ?? "",
        defaultExecutorType: roleProfile.defaultExecutorType,
        source: "database" as const,
        markdown: {
          id: activeMarkdownFile.id,
          version: activeMarkdownFile.version,
          fileName: activeMarkdownFile.fileName,
          checksum: activeMarkdownFile.checksum,
          rawMarkdown: activeMarkdownFile.content,
          renderedHtml: renderMarkdownToHtml(activeMarkdownFile.content),
          publishedAt: activeMarkdownFile.publishedAt?.toISOString() ?? null,
          createdAt: activeMarkdownFile.createdAt.toISOString()
        },
        sections: parsed.sections,
        versions: roleProfile.markdownFiles.map((file) => ({
          id: file.id,
          version: file.version,
          fileName: file.fileName,
          checksum: file.checksum,
          isActive: file.isActive,
          publishedAt: file.publishedAt?.toISOString() ?? null,
          createdAt: file.createdAt.toISOString()
        } satisfies RoleDetailVersion))
      }
    };
  }

  private async ensureRoleCatalogSynced() {
    if (!this.syncPromise) {
      this.syncPromise = this.syncRoleCatalog().finally(() => {
        this.syncPromise = undefined;
      });
    }

    await this.syncPromise;
  }

  private async syncRoleCatalog() {
    const adminUser = await this.prisma.client.user.findFirst({
      where: {
        role: PlatformRole.admin
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true
      }
    });

    const result = await syncRoleMarkdownCatalog(this.prisma.client, {
      ...(adminUser?.id ? { createdById: adminUser.id } : {})
    });

    if (!result) {
      return;
    }

    const changedItems = result.items.filter((item) => item.status !== "unchanged");

    if (!changedItems.length) {
      return;
    }

    await this.auditTrail.appendEvent({
      organizationId: result.organizationId,
      actorType: AuditActorType.SYSTEM,
      action: "role_markdown.synced",
      resourceType: "role_markdown_catalog",
      payload: {
        syncedAt: result.syncedAt,
        changedItems: changedItems.map((item) => ({
          slug: item.slug,
          version: item.version,
          status: item.status
        }))
      }
    });
  }

  private loadFilesystemRole(slug: string) {
    const role = getRoleCatalog().find((item) => item.slug === slug);

    if (!role) {
      return undefined;
    }

    return loadRoleDefinition(role.slug);
  }

  private mapFilesystemRoleToListItem(role: LoadedRoleDefinition): RoleListItem {
    return {
      id: null,
      slug: role.slug,
      title: role.title,
      description: role.description,
      defaultExecutorType: role.defaultExecutorType,
      activeVersion: 1,
      fileName: role.fileName,
      checksum: role.checksum,
      publishedAt: null,
      updatedAt: null,
      sectionHeadings: role.parsed.sections.map((section) => ({
        key: section.key,
        heading: section.heading
      })),
      source: "filesystem"
    };
  }

  private mapFilesystemRoleToDetail(role: LoadedRoleDefinition) {
    return {
      id: null,
      slug: role.slug,
      title: role.title,
      description: role.description,
      defaultExecutorType: role.defaultExecutorType,
      source: "filesystem" as const,
      markdown: {
        id: null,
        version: 1,
        fileName: role.fileName,
        checksum: role.checksum,
        rawMarkdown: role.rawMarkdown,
        renderedHtml: role.renderedHtml,
        publishedAt: null,
        createdAt: null
      },
      sections: role.parsed.sections,
      versions: [
        {
          id: `filesystem:${role.slug}`,
          version: 1,
          fileName: role.fileName,
          checksum: role.checksum,
          isActive: true,
          publishedAt: null,
          createdAt: new Date(0).toISOString()
        }
      ]
    };
  }
}
