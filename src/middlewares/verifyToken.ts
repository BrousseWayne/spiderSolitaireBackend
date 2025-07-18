import { type Response, type NextFunction, type Request } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/conf.ts";
import { type AuthenticatedRequest } from "../types/authenticatedRequestType.ts";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      email: string;
      userId: number;
    };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.sendStatus(401);
  }
}
