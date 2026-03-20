import { Body, Controller, Get, Inject, Param, Patch, Put } from "@nestjs/common";
import { ADMIN_ONLY_ROLES, type AuthenticatedUser } from "@night-manager/auth";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";

@Controller("admin")
@Roles(...ADMIN_ONLY_ROLES)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get("role-profiles")
  async listRoleProfiles() {
    return this.adminService.listRoleProfiles();
  }

  @Patch("role-profiles/:roleProfileId")
  async updateRoleProfile(
    @Param("roleProfileId") roleProfileId: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.adminService.updateRoleProfile(roleProfileId, body, user);
  }

  @Get("policies")
  async getPolicies() {
    return this.adminService.getPolicies();
  }

  @Put("policies")
  async updatePolicies(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.updatePolicies(body, user);
  }
}
