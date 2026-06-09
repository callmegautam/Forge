import type { Response } from "express";
import type { z } from "zod";

interface SuccessBody<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorBody {
  success: false;
  error: string;
  issues?: Array<{ field: string; message: string }>;
}

export function ok<T>(res: Response, data: T, message?: string): void {
  const body: SuccessBody<T> = { success: true, data };
  if (message) body.message = message;
  res.status(200).json(body);
}

export function unauthorized(res: Response): void {
  res
    .status(401)
    .json({ success: false, error: "Unauthorized" } satisfies ErrorBody);
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data } satisfies SuccessBody<T>);
}

export function badRequest(
  res: Response,
  error: string,
  issues?: Array<{ field: string; message: string }>,
): void {
  const body: ErrorBody = { success: false, error };
  if (issues) body.issues = issues;
  res.status(400).json(body);
}

export function notFound(res: Response, error = "Resource not found"): void {
  res.status(404).json({ success: false, error } satisfies ErrorBody);
}

export function formatZodIssue(issue: z.ZodIssue): {
  field: string;
  message: string;
} {
  return {
    field: issue.path.join(".") || "(root)",
    message: issue.message,
  };
}
