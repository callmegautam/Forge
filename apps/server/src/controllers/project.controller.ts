import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { createProjectSchema, updateProjectSchema, projectParamsSchema } from "../validation/project";
import { createProject } from "../services/project.service";
import {
  findProjectByRepoUrl,
  findProjectById,
  findProjectsByUserId,
  updateProjectById,
  deleteProjectById,
} from "../db/projects.db";

export const createProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    });
    return;
  }

  const { repoUrl, branch, framework } = parsed.data;

  const existing = await findProjectByRepoUrl(repoUrl);
  if (existing) {
    res.status(409).json({
      success: false,
      error: "Repository already exists",
    });
    return;
  }

  const result = await createProject(req.userId!, { repoUrl, branch, framework });
  res.status(201).json({ success: true, data: result });
});

export const getProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const params = projectParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({
      success: false,
      error: "Invalid project ID",
    });
    return;
  }

  const result = await findProjectById(params.data.id);
  if (!result) {
    res.status(404).json({ success: false, error: "Project not found" });
    return;
  }

  if (result.userId !== req.userId) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  res.json({ success: true, data: result });
});

export const listProjectsHandler = asyncHandler(async (req: Request, res: Response) => {
  const projects = await findProjectsByUserId(req.userId!);
  res.json({ success: true, data: projects });
});

export const updateProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const params = projectParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({
      success: false,
      error: "Invalid project ID",
    });
    return;
  }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Validation failed",
      issues: parsed.error.issues,
    });
    return;
  }

  const existing = await findProjectById(params.data.id);
  if (!existing) {
    res.status(404).json({ success: false, error: "Project not found" });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  if (parsed.data.repoUrl) {
    const duplicate = await findProjectByRepoUrl(parsed.data.repoUrl);
    if (duplicate && duplicate.id !== params.data.id) {
      res.status(409).json({
        success: false,
        error: "Repository URL already in use",
      });
      return;
    }
  }

  const updated = await updateProjectById(params.data.id, parsed.data);
  res.json({ success: true, data: updated });
});

export const deleteProjectHandler = asyncHandler(async (req: Request, res: Response) => {
  const params = projectParamsSchema.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({
      success: false,
      error: "Invalid project ID",
    });
    return;
  }

  const existing = await findProjectById(params.data.id);
  if (!existing) {
    res.status(404).json({ success: false, error: "Project not found" });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }

  await deleteProjectById(params.data.id);
  res.json({ success: true, message: "Project deleted" });
});
