import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ok, created, badRequest, formatZodIssue } from "../utils/response";
import {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
} from "../validation/project";
import {
  createProject,
  getProject,
  listUserProjects,
  updateProject,
  deleteProject,
} from "../services/project.service";

export const createProjectHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, "Validation failed", parsed.error.issues.map(formatZodIssue));
      return;
    }

    const result = await createProject(req.userId!, parsed.data);
    created(res, result);
  },
);

export const getProjectHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = projectParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      badRequest(res, "Invalid project ID", parsed.error.issues.map(formatZodIssue));
      return;
    }

    const result = await getProject(parsed.data.id, req.userId!);
    ok(res, result);
  },
);

export const listProjectsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const projects = await listUserProjects(req.userId!);
    ok(res, projects);
  },
);

export const updateProjectHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = projectParamsSchema.safeParse(req.params);
    if (!params.success) {
      badRequest(res, "Invalid project ID", params.error.issues.map(formatZodIssue));
      return;
    }

    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, "Validation failed", parsed.error.issues.map(formatZodIssue));
      return;
    }

    const updated = await updateProject(
      params.data.id,
      req.userId!,
      parsed.data,
    );
    ok(res, updated);
  },
);

export const deleteProjectHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const parsed = projectParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      badRequest(res, "Invalid project ID", parsed.error.issues.map(formatZodIssue));
      return;
    }

    await deleteProject(parsed.data.id, req.userId!);
    ok(res, null, "Project deleted");
  },
);
