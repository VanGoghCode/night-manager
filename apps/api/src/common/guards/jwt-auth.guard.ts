import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import type { AuthenticatedRequest } from "../authenticated-request";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const isPublic =
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler()) ??
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getClass());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Missing access token.");
    }

    const session = await this.authService.validateAccessToken(token);
    request.user = session.user;
    request.sessionId = session.sessionId;
    request.token = token;

    return true;
  }

  private extractToken(request: AuthenticatedRequest) {
    const authorizationHeader = request.headers.authorization;

    if (authorizationHeader?.startsWith("Bearer ")) {
      return authorizationHeader.slice("Bearer ".length);
    }

    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    for (const segment of cookieHeader.split(";")) {
      const [rawName, rawValue] = segment.trim().split("=");
      if (rawName === "night_manager_access_token" && rawValue) {
        return decodeURIComponent(rawValue);
      }
    }

    return undefined;
  }
}
