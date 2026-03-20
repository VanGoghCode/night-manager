import type { AuthenticatedUser } from "@night-manager/auth";
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  sessionId?: string;
  token?: string;
  user?: AuthenticatedUser;
}
