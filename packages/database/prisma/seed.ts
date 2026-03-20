import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ApprovalStatus,
  AssignmentStatus,
  AgentRunStatus,
  AuditActorType,
  EnvironmentType,
  ExecutorType,
  PrismaClient,
  RepositoryProvider,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserType
} from "@prisma/client";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");

function loadEnvFile(filePath: string, override = false) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = line.split("=");
    const value = valueParts.join("=");

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(repoRoot, ".env.local"), true);

const prisma = new PrismaClient();

function checksum(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function ensureAssignment(ticketId: string, assignedRole: string, assignedById: string) {
  const existing = await prisma.assignment.findFirst({
    where: {
      ticketId,
      assignedRole
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.assignment.create({
    data: {
      ticketId,
      assignedRole,
      executorType: ExecutorType.AI,
      assignedById,
      status: AssignmentStatus.ACTIVE
    }
  });
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "night-manager-labs" },
    update: { name: "Night Manager Labs" },
    create: { name: "Night Manager Labs", slug: "night-manager-labs" }
  });

  const team = await prisma.team.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "platform-core"
      }
    },
    update: { name: "Platform Core" },
    create: {
      organizationId: organization.id,
      name: "Platform Core",
      slug: "platform-core",
      description: "Owns the Night Manager control plane MVP"
    }
  });

  const humanOwner = await prisma.user.upsert({
    where: { email: "owner@nightmanager.local" },
    update: { displayName: "Night Manager Owner" },
    create: {
      email: "owner@nightmanager.local",
      displayName: "Night Manager Owner",
      userType: UserType.HUMAN
    }
  });

  const aiProjectManager = await prisma.user.upsert({
    where: { email: "ai-pm@nightmanager.local" },
    update: { displayName: "AI Project Manager" },
    create: {
      email: "ai-pm@nightmanager.local",
      displayName: "AI Project Manager",
      userType: UserType.AI
    }
  });

  const moduleRecord = await prisma.module.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "workflow-engine"
      }
    },
    update: { name: "Workflow Engine" },
    create: {
      organizationId: organization.id,
      teamId: team.id,
      name: "Workflow Engine",
      slug: "workflow-engine",
      description: "Tracks workflow state progression for Night Manager tickets"
    }
  });

  const repository = await prisma.repository.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "night-manager"
      }
    },
    update: { defaultBranch: "main" },
    create: {
      organizationId: organization.id,
      moduleId: moduleRecord.id,
      name: "night-manager",
      slug: "night-manager",
      provider: RepositoryProvider.GITHUB,
      externalId: "night-manager/night-manager",
      defaultBranch: "main"
    }
  });

  const environment = await prisma.environment.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "dev"
      }
    },
    update: { environmentType: EnvironmentType.DEVELOPMENT },
    create: {
      organizationId: organization.id,
      name: "Development",
      slug: "dev",
      environmentType: EnvironmentType.DEVELOPMENT
    }
  });

  const workflow = await prisma.workflow.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "default-ticket-flow"
      }
    },
    update: { name: "Default Ticket Flow", isDefault: true },
    create: {
      organizationId: organization.id,
      name: "Default Ticket Flow",
      slug: "default-ticket-flow",
      isDefault: true
    }
  });

  const draft = await prisma.workflowState.upsert({
    where: {
      workflowId_key: {
        workflowId: workflow.id,
        key: "draft"
      }
    },
    update: { name: "Draft", sortOrder: 1, isInitial: true, isTerminal: false },
    create: {
      workflowId: workflow.id,
      key: "draft",
      name: "Draft",
      sortOrder: 1,
      stateCategory: "planning",
      isInitial: true,
      isTerminal: false
    }
  });

  const inProgress = await prisma.workflowState.upsert({
    where: {
      workflowId_key: {
        workflowId: workflow.id,
        key: "in_progress"
      }
    },
    update: { name: "In Progress", sortOrder: 2, isInitial: false, isTerminal: false },
    create: {
      workflowId: workflow.id,
      key: "in_progress",
      name: "In Progress",
      sortOrder: 2,
      stateCategory: "delivery",
      isInitial: false,
      isTerminal: false
    }
  });

  const review = await prisma.workflowState.upsert({
    where: {
      workflowId_key: {
        workflowId: workflow.id,
        key: "review"
      }
    },
    update: { name: "Review", sortOrder: 3, isTerminal: false },
    create: {
      workflowId: workflow.id,
      key: "review",
      name: "Review",
      sortOrder: 3,
      stateCategory: "quality",
      isTerminal: false
    }
  });

  const done = await prisma.workflowState.upsert({
    where: {
      workflowId_key: {
        workflowId: workflow.id,
        key: "done"
      }
    },
    update: { name: "Done", sortOrder: 4, isTerminal: true },
    create: {
      workflowId: workflow.id,
      key: "done",
      name: "Done",
      sortOrder: 4,
      stateCategory: "complete",
      isTerminal: true
    }
  });

  await prisma.workflowTransition.upsert({
    where: {
      workflowId_fromStateId_toStateId: {
        workflowId: workflow.id,
        fromStateId: draft.id,
        toStateId: inProgress.id
      }
    },
    update: { name: "Start work", requiresApproval: false },
    create: {
      workflowId: workflow.id,
      fromStateId: draft.id,
      toStateId: inProgress.id,
      name: "Start work",
      requiresApproval: false
    }
  });

  const reviewTransition = await prisma.workflowTransition.upsert({
    where: {
      workflowId_fromStateId_toStateId: {
        workflowId: workflow.id,
        fromStateId: inProgress.id,
        toStateId: review.id
      }
    },
    update: { name: "Submit for review", requiresApproval: true },
    create: {
      workflowId: workflow.id,
      fromStateId: inProgress.id,
      toStateId: review.id,
      name: "Submit for review",
      requiresApproval: true
    }
  });

  await prisma.workflowTransition.upsert({
    where: {
      workflowId_fromStateId_toStateId: {
        workflowId: workflow.id,
        fromStateId: review.id,
        toStateId: done.id
      }
    },
    update: { name: "Approve completion", requiresApproval: true },
    create: {
      workflowId: workflow.id,
      fromStateId: review.id,
      toStateId: done.id,
      name: "Approve completion",
      requiresApproval: true
    }
  });

  const roleProfile = await prisma.roleProfile.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "ai-project-manager"
      }
    },
    update: { title: "AI Project Manager" },
    create: {
      organizationId: organization.id,
      slug: "ai-project-manager",
      title: "AI Project Manager",
      description: "Generates and manages Night Manager tickets",
      defaultExecutorType: ExecutorType.AI
    }
  });

  const markdownContent = `# AI Project Manager\n\n## Scope\n- Generate and refine tickets\n- Respect explicit human overrides\n`;
  const roleMarkdown = await prisma.roleMarkdownFile.upsert({
    where: {
      roleProfileId_version: {
        roleProfileId: roleProfile.id,
        version: 1
      }
    },
    update: {
      content: markdownContent,
      checksum: checksum(markdownContent),
      isActive: true,
      publishedAt: new Date()
    },
    create: {
      roleProfileId: roleProfile.id,
      version: 1,
      fileName: "ai-project-manager.md",
      content: markdownContent,
      checksum: checksum(markdownContent),
      isActive: true,
      createdById: humanOwner.id,
      publishedAt: new Date()
    }
  });

  const ticket = await prisma.ticket.upsert({
    where: { id: "ticket_sample_workflow_engine_foundation" },
    update: {
      title: "Bootstrap workflow engine persistence foundation",
      workflowStateId: draft.id,
      status: TicketStatus.READY
    },
    create: {
      id: "ticket_sample_workflow_engine_foundation",
      organizationId: organization.id,
      teamId: team.id,
      moduleId: moduleRecord.id,
      repoId: repository.id,
      environmentId: environment.id,
      workflowId: workflow.id,
      workflowStateId: draft.id,
      title: "Bootstrap workflow engine persistence foundation",
      description:
        "Create the first persisted workflow records, role profiles, and audit scaffolding for the Night Manager MVP.",
      type: TicketType.FEATURE,
      status: TicketStatus.READY,
      priority: TicketPriority.HIGH,
      humanOwnerId: humanOwner.id,
      assignedRole: roleProfile.slug,
      assignedExecutorType: ExecutorType.AI,
      createdById: aiProjectManager.id,
      metadata: {
        ticketId: "NM-1",
        branch: "feature/workflow-engine/NM-1-bootstrap-persistence-foundation"
      }
    }
  });

  const assignment = await ensureAssignment(ticket.id, roleProfile.slug, aiProjectManager.id);

  await prisma.approval.upsert({
    where: { id: "approval_sample_ticket_review" },
    update: { status: ApprovalStatus.PENDING },
    create: {
      id: "approval_sample_ticket_review",
      organizationId: organization.id,
      ticketId: ticket.id,
      workflowTransitionId: reviewTransition.id,
      requestedById: aiProjectManager.id,
      approverUserId: humanOwner.id,
      status: ApprovalStatus.PENDING,
      notes: "Awaiting human review approval"
    }
  });

  await prisma.agentRun.upsert({
    where: { id: "agent_run_sample_ticket_review" },
    update: { status: AgentRunStatus.QUEUED },
    create: {
      id: "agent_run_sample_ticket_review",
      organizationId: organization.id,
      ticketId: ticket.id,
      assignmentId: assignment.id,
      roleProfileId: roleProfile.id,
      roleMarkdownFileId: roleMarkdown.id,
      status: AgentRunStatus.QUEUED,
      executorType: ExecutorType.AI,
      metadata: {
        workerPool: "default",
        requestedBy: "seed"
      }
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: organization.id,
      actorUserId: aiProjectManager.id,
      actorType: AuditActorType.AI,
      action: "ticket.seeded",
      resourceType: "ticket",
      resourceId: ticket.id,
      ticketId: ticket.id,
      payload: {
        seeded: true,
        assignedRole: roleProfile.slug
      }
    }
  });

  console.log(JSON.stringify({
    organization: organization.slug,
    team: team.slug,
    module: moduleRecord.slug,
    repository: repository.slug,
    ticket: ticket.id
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
