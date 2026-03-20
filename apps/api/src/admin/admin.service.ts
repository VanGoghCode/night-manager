import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_ONLY_ROLES, TICKET_WRITE_ROLES, type AuthenticatedUser } from "@night-manager/auth";
import {
  BRANCH_NAME_POLICY,
  COMMIT_MESSAGE_POLICY,
  PR_TITLE_POLICY,
  getPolicyPatterns
} from "@night-manager/branch-rules";
import { AuditActorType, ExecutorType, Prisma } from "@night-manager/database";
import { z } from "zod";
import { AuditTrailService } from "../audit-trail.service";
import { PrismaService } from "../prisma.service";

const updateRoleProfileSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  defaultExecutorType: z.nativeEnum(ExecutorType).optional()
});

const updatePoliciesSchema = z.object({
  branchNamingPolicy: z.string().min(1),
  commitMessagePolicy: z.string().min(1),
  prTitlePolicy: z.string().min(1),
  notes: z.string().max(1000).optional()
});

@Injectable()
export class AdminService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditTrailService) private readonly auditTrail: AuditTrailService
  ) {}

  async listRoleProfiles() {
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

    return {
      items: roleProfiles
    };
  }

  async updateRoleProfile(roleProfileId: string, input: unknown, actor: AuthenticatedUser) {
    const data = updateRoleProfileSchema.parse(input);
    const updateData: Prisma.RoleProfileUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.defaultExecutorType !== undefined) {
      updateData.defaultExecutorType = data.defaultExecutorType;
    }

    const roleProfile = await this.prisma.client.roleProfile.update({
      where: { id: roleProfileId },
      data: updateData
    });

    await this.auditTrail.appendEvent({
      organizationId: roleProfile.organizationId,
      actorUserId: actor.id,
      actorType: AuditActorType.HUMAN,
      action: "role_profile.updated",
      resourceType: "role_profile",
      resourceId: roleProfile.id,
      payload: {
        updatedFields: Object.keys(data)
      }
    });

    return roleProfile;
  }

  getPolicies() {
    return {
      allowedTicketWriteRoles: TICKET_WRITE_ROLES,
      adminOnlyRoles: ADMIN_ONLY_ROLES,
      branchNamingPolicy: BRANCH_NAME_POLICY,
      commitMessagePolicy: COMMIT_MESSAGE_POLICY,
      prTitlePolicy: PR_TITLE_POLICY,
      patterns: getPolicyPatterns()
    };
  }

  async updatePolicies(input: unknown, actor: AuthenticatedUser) {
    const data = updatePoliciesSchema.parse(input);
    const organization = await this.prisma.client.organization.findFirst({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true
      }
    });

    await this.auditTrail.appendEvent({
      organizationId: organization?.id,
      actorUserId: actor.id,
      actorType: AuditActorType.HUMAN,
      action: "policy.updated",
      resourceType: "policy",
      payload: {
        ...data,
        persisted: false
      }
    });

    return {
      ...this.getPolicies(),
      requestedPolicyUpdate: data,
      persisted: false,
      note: "TODO: PRODUCTION persist policy changes in a dedicated policy store."
    };
  }
}
