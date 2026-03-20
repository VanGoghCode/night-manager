import { randomUUID } from "node:crypto";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "@night-manager/auth";
import {
  AuditActorType,
  ExecutorType,
  Prisma,
  TicketPriority,
  TicketStatus,
  TicketType
} from "@night-manager/database";
import { z } from "zod";
import { AuditTrailService } from "../audit-trail.service";
import { PrismaService } from "../prisma.service";

const createTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  type: z.nativeEnum(TicketType),
  priority: z.nativeEnum(TicketPriority),
  teamId: z.string().min(1).optional(),
  moduleId: z.string().min(1).optional(),
  repoId: z.string().min(1).optional(),
  environmentId: z.string().min(1).optional(),
  humanOwnerId: z.string().min(1).optional(),
  assignedRole: z.string().min(1).optional(),
  assignedExecutorType: z.nativeEnum(ExecutorType).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(4000).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  humanOwnerId: z.string().min(1).optional(),
  assignedRole: z.string().min(1).optional(),
  assignedExecutorType: z.nativeEnum(ExecutorType).optional(),
  workflowStateId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const ticketListInclude = {
  module: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  repository: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  humanOwner: {
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true
    }
  },
  workflowState: {
    select: {
      id: true,
      key: true,
      name: true
    }
  }
} satisfies Prisma.TicketInclude;

@Injectable()
export class TicketsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditTrailService) private readonly auditTrail: AuditTrailService
  ) {}

  async listTickets() {
    const tickets = await this.prisma.client.ticket.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      include: ticketListInclude
    });

    return {
      items: tickets
    };
  }

  async createTicket(input: unknown, actor: AuthenticatedUser) {
    const data = createTicketSchema.parse(input);
    const workflow = await this.getDefaultWorkflowContext();
    const metadata = (data.metadata ?? {}) as Prisma.InputJsonValue;
    const createData: Prisma.TicketUncheckedCreateInput = {
      id: `ticket_${randomUUID()}`,
      organizationId: workflow.organizationId,
      workflowId: workflow.workflowId,
      workflowStateId: workflow.initialStateId,
      title: data.title,
      ...(data.description !== undefined ? { description: data.description } : {}),
      type: data.type,
      status: TicketStatus.READY,
      priority: data.priority,
      humanOwnerId: data.humanOwnerId ?? actor.id,
      ...(data.assignedRole !== undefined ? { assignedRole: data.assignedRole } : {}),
      assignedExecutorType: data.assignedExecutorType ?? ExecutorType.AI,
      metadata,
      createdById: actor.id,
      ...(data.teamId !== undefined ? { teamId: data.teamId } : {}),
      ...(data.moduleId !== undefined ? { moduleId: data.moduleId } : {}),
      ...(data.repoId !== undefined ? { repoId: data.repoId } : {}),
      ...(data.environmentId !== undefined ? { environmentId: data.environmentId } : {})
    };

    const ticket = await this.prisma.client.ticket.create({
      data: createData
    });

    await this.auditTrail.appendEvent({
      organizationId: ticket.organizationId,
      actorUserId: actor.id,
      actorType: AuditActorType.HUMAN,
      action: "ticket.created",
      resourceType: "ticket",
      resourceId: ticket.id,
      ticketId: ticket.id,
      payload: {
        title: ticket.title,
        type: ticket.type
      }
    });

    return ticket;
  }

  async updateTicket(ticketId: string, input: unknown, actor: AuthenticatedUser) {
    const data = updateTicketSchema.parse(input);
    const updateData: Prisma.TicketUncheckedUpdateInput = {};

    const existingTicket = await this.prisma.client.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      throw new NotFoundException("Ticket not found.");
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.humanOwnerId !== undefined) {
      updateData.humanOwnerId = data.humanOwnerId;
    }

    if (data.assignedRole !== undefined) {
      updateData.assignedRole = data.assignedRole;
    }

    if (data.assignedExecutorType !== undefined) {
      updateData.assignedExecutorType = data.assignedExecutorType;
    }

    if (data.workflowStateId !== undefined) {
      updateData.workflowStateId = data.workflowStateId;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata as Prisma.InputJsonValue;
    }

    const ticket = await this.prisma.client.ticket.update({
      where: { id: ticketId },
      data: updateData
    });

    await this.auditTrail.appendEvent({
      organizationId: ticket.organizationId,
      actorUserId: actor.id,
      actorType: AuditActorType.HUMAN,
      action: "ticket.updated",
      resourceType: "ticket",
      resourceId: ticket.id,
      ticketId: ticket.id,
      payload: {
        updatedFields: Object.keys(updateData)
      }
    });

    return ticket;
  }

  private async getDefaultWorkflowContext() {
    const workflow = await this.prisma.client.workflow.findFirst({
      where: {
        isDefault: true
      },
      select: {
        id: true,
        organizationId: true,
        states: {
          where: {
            isInitial: true
          },
          select: {
            id: true
          },
          take: 1
        }
      }
    });

    if (!workflow?.states[0]) {
      throw new NotFoundException("Default workflow is not configured.");
    }

    return {
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      initialStateId: workflow.states[0].id
    };
  }
}
