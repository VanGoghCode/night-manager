import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Req
} from "@nestjs/common";
import type { AuthenticatedUser } from "@night-manager/auth";
import { z } from "zod";
import type { AuthenticatedRequest } from "../common/authenticated-request";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import { AuthService } from "./auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function normalizeBody(body: unknown) {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    let input: z.infer<typeof loginSchema>;

    try {
      input = loginSchema.parse(normalizeBody(body));
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException({
          message: "Invalid login payload.",
          issues: error.flatten()
        });
      }

      throw error;
    }

    try {
      return await this.authService.login(input.email, input.password, {
        ipAddress: request.ip,
        userAgent:
          typeof request.headers["user-agent"] === "string"
            ? request.headers["user-agent"]
            : undefined
      });
    } catch (error) {
      this.logger.error("Login failed unexpectedly.", error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    return {
      user: await this.authService.getCurrentUser(user.id)
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: AuthenticatedRequest
  ) {
    if (request.sessionId) {
      await this.authService.logout(request.sessionId, user);
    }

    return {
      success: true
    };
  }
}
