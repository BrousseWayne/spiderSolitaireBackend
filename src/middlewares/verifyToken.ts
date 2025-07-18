import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@/lib/conf";
import { AuthenticatedRequest } from "@/types/authenticatedRequestType";

export function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
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
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(401);
  }
}
