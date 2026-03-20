import crypto from "node:crypto";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedUser } from "@night-manager/auth";
import { loadApiEnvironment } from "@night-manager/config";
import { AuditActorType, Prisma, UserType } from "@night-manager/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuditTrailService } from "../audit-trail.service";
import { PrismaService } from "../prisma.service";

interface LoginMetadata {
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

interface JwtPayload {
  sub: string;
  sid: string;
  email: string;
  displayName: string;
  role: AuthenticatedUser["role"];
}

const authenticatedUserSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  userType: true,
  passwordHash: true,
  isActive: true,
  lastLoginAt: true
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  private readonly env = loadApiEnvironment();
  private readonly accessTokenTtlSeconds = 60 * 60 * 8;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditTrailService) private readonly auditTrail: AuditTrailService
  ) {}

  async login(email: string, password: string, metadata: LoginMetadata) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
      select: authenticatedUserSelect
    });

    if (
      !user ||
      user.userType !== UserType.HUMAN ||
      !user.passwordHash ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const sessionId = crypto.randomUUID();
    const accessToken = jwt.sign(this.buildJwtPayload(user, sessionId), this.env.JWT_SECRET, {
      expiresIn: this.accessTokenTtlSeconds
    });
    const expiresAt = new Date(Date.now() + this.accessTokenTtlSeconds * 1000);

    const session = await this.prisma.client.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: this.hashToken(accessToken),
        expiresAt,
        metadata: {
          authMethod: "password",
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null
        }
      }
    });

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date()
      }
    });

    await this.auditTrail.appendEvent({
      organizationId: (await this.getDefaultOrganizationId()) ?? undefined,
      actorUserId: user.id,
      actorType: AuditActorType.HUMAN,
      action: "auth.login",
      resourceType: "session",
      resourceId: session.id,
      payload: {
        email: user.email
      }
    });

    return {
      accessToken,
      expiresAt: expiresAt.toISOString(),
      user: this.toAuthenticatedUser(user)
    };
  }

  async validateAccessToken(token: string) {
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, this.env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token.");
    }

    const session = await this.prisma.client.session.findUnique({
      where: {
        tokenHash: this.hashToken(token)
      },
      include: {
        user: {
          select: authenticatedUserSelect
        }
      }
    });

    if (
      !session ||
      !session.user ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive
    ) {
      throw new UnauthorizedException("Session is no longer valid.");
    }

    if (payload.sub !== session.user.id) {
      throw new UnauthorizedException("Token subject does not match session.");
    }

    if (payload.sid !== session.id) {
      throw new UnauthorizedException("Token session does not match stored session.");
    }

    return {
      sessionId: session.id,
      user: this.toAuthenticatedUser(session.user)
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: authenticatedUserSelect
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("User account is not available.");
    }

    return this.toAuthenticatedUser(user);
  }

  async logout(sessionId: string, user: AuthenticatedUser) {
    await this.prisma.client.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date()
      }
    });

    await this.auditTrail.appendEvent({
      organizationId: (await this.getDefaultOrganizationId()) ?? undefined,
      actorUserId: user.id,
      actorType: AuditActorType.HUMAN,
      action: "auth.logout",
      resourceType: "session",
      resourceId: sessionId,
      payload: {
        email: user.email
      }
    });
  }

  private buildJwtPayload(user: {
    id: string;
    email: string;
    displayName: string;
    role: AuthenticatedUser["role"];
  }, sessionId: string): JwtPayload {
    return {
      sub: user.id,
      sid: sessionId,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };
  }

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private toAuthenticatedUser(user: {
    id: string;
    email: string;
    displayName: string;
    role: AuthenticatedUser["role"];
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    };
  }

  private async getDefaultOrganizationId() {
    const organization = await this.prisma.client.organization.findFirst({
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true
      }
    });

    return organization?.id;
  }
}
