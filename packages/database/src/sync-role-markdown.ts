import { PlatformRole } from "@prisma/client";
import { getPrismaClient } from "./index";
import { syncRoleMarkdownCatalog } from "./role-markdown-sync";

async function main() {
  const prisma = getPrismaClient();

  try {
    const adminUser = await prisma.user.findFirst({
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

    const result = await syncRoleMarkdownCatalog(prisma, {
      ...(adminUser?.id ? { createdById: adminUser.id } : {})
    });

    if (!result) {
      console.log(
        JSON.stringify(
          {
            synced: false,
            reason: "No organization found. Run the database seed first."
          },
          null,
          2
        )
      );
      return;
    }

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
