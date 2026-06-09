import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { ok, created, badRequest, formatZodIssue } from "../utils/response";
import {
  createDeploymentSchema,
  webhookDeploymentSchema,
  deploymentParamsSchema,
} from "../validation/deployment";
import { projectParamsSchema } from "../validation/project";
import {
  redeployProject,
  webhookDeploy,
  getDeployment,
} from "../services/deployment.service";

export const createDeploymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = projectParamsSchema.safeParse(req.params);
    if (!params.success) {
      badRequest(res, "Invalid project ID", params.error.issues.map(formatZodIssue));
      return;
    }

    const parsed = createDeploymentSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, "Validation failed", parsed.error.issues.map(formatZodIssue));
      return;
    }

    const deployment = await redeployProject(
      req.userId!,
      params.data.id,
      parsed.data.branch,
    );
    created(res, deployment);
  },
);

export const webhookDeploymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = projectParamsSchema.safeParse(req.params);
    if (!params.success) {
      badRequest(res, "Invalid project ID", params.error.issues.map(formatZodIssue));
      return;
    }

    const parsed = webhookDeploymentSchema.safeParse(req.body);
    if (!parsed.success) {
      badRequest(res, "Validation failed", parsed.error.issues.map(formatZodIssue));
      return;
    }

    const deployment = await webhookDeploy(
      req.userId!,
      params.data.id,
      parsed.data,
    );
    created(res, deployment);
  },
);

export const getDeploymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const params = deploymentParamsSchema.safeParse(req.params);
    if (!params.success) {
      badRequest(res, "Invalid parameters", params.error.issues.map(formatZodIssue));
      return;
    }

    const result = await getDeployment(
      req.userId!,
      params.data.id,
      params.data.deploymentId,
    );
    ok(res, result);
  },
);
