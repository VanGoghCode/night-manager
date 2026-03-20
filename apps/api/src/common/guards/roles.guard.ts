import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { hasRequiredRole, type PlatformRole } from "@night-manager/auth";
import type { AuthenticatedRequest } from "../authenticated-request";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const requiredRoles =
      Reflect.getMetadata(ROLES_KEY, context.getHandler()) ??
      Reflect.getMetadata(ROLES_KEY, context.getClass()) ??
      ([] as PlatformRole[]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException("Authentication is required.");
    }

    if (!hasRequiredRole(request.user.role, requiredRoles)) {
      throw new ForbiddenException("You do not have permission to perform this action.");
    }

    return true;
  }
}
