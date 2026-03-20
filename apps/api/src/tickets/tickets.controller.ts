import { Body, Controller, Get, Inject, Param, Patch, Post } from "@nestjs/common";
import { TICKET_WRITE_ROLES, type AuthenticatedUser } from "@night-manager/auth";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { TicketsService } from "./tickets.service";

@Controller("tickets")
export class TicketsController {
  constructor(@Inject(TicketsService) private readonly ticketsService: TicketsService) {}

  @Get()
  async listTickets(): Promise<unknown> {
    return this.ticketsService.listTickets();
  }

  @Post()
  @Roles(...TICKET_WRITE_ROLES)
  async createTicket(
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<unknown> {
    return this.ticketsService.createTicket(body, user);
  }

  @Patch(":ticketId")
  @Roles(...TICKET_WRITE_ROLES)
  async updateTicket(
    @Param("ticketId") ticketId: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<unknown> {
    return this.ticketsService.updateTicket(ticketId, body, user);
  }
}
