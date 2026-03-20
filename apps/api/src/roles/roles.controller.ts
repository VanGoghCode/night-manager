import { Controller, Get, Inject, Param } from "@nestjs/common";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  async listRoles(): Promise<unknown> {
    return this.rolesService.listRoles();
  }

  @Get(":slug")
  async getRoleBySlug(@Param("slug") slug: string): Promise<unknown> {
    return this.rolesService.getRoleBySlug(slug);
  }
}
