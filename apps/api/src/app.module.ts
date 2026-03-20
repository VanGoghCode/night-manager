import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AdminController } from "./admin/admin.controller";
import { AdminService } from "./admin/admin.service";
import { AuditTrailService } from "./audit-trail.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { RolesGuard } from "./common/guards/roles.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PrismaService } from "./prisma.service";
import { TicketsController } from "./tickets/tickets.controller";
import { TicketsService } from "./tickets/tickets.service";

@Module({
  controllers: [AuthController, TicketsController, AdminController],
  providers: [
    PrismaService,
    AuditTrailService,
    AuthService,
    TicketsService,
    AdminService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard
    }
  ]
})
export class AppModule {}
