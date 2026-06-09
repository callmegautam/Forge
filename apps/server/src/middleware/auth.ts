import { auth } from "@forge/auth";
import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: req.headers as Record<string, string>,
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = session.user.id;
  next();
}
