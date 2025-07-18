import { type Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: { email: string; userId: number };
}
