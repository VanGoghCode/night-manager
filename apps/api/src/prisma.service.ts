import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { getPrismaClient, type PrismaClient } from "@night-manager/database";

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = getPrismaClient();

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
