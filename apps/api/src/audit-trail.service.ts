import { Inject, Injectable } from "@nestjs/common";
import { auditEvent } from "@night-manager/audit-sdk";
import { AuditActorType, Prisma } from "@night-manager/database";
import { PrismaService } from "./prisma.service";

interface AppendAuditEventInput {
  action: string;
  actorType: AuditActorType;
  resourceType: string;
  actorUserId?: string | undefined;
  resourceId?: string | undefined;
  ticketId?: string | undefined;
  organizationId?: string | undefined;
  payload?: Record<string, unknown> | undefined;
}

@Injectable()
export class AuditTrailService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async appendEvent(input: AppendAuditEventInput) {
    const metadata = input.payload ?? {};
    const payload = metadata as Prisma.InputJsonValue;

    await this.prisma.client.auditEvent.create({
      data: {
        actorType: input.actorType,
        action: input.action,
        resourceType: input.resourceType,
        payload,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        ...(input.resourceId ? { resourceId: input.resourceId } : {}),
        ...(input.ticketId ? { ticketId: input.ticketId } : {})
      }
    });

    auditEvent({
      actorId: input.actorUserId ?? input.actorType.toLowerCase(),
      action: input.action,
      scope: input.resourceType,
      metadata
    });
  }
}
