import express from "express";
import type { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from "../controllers/project.controller";
import {
  createDeploymentHandler,
  webhookDeploymentHandler,
  getDeploymentHandler,
} from "../controllers/deployment.controller";

const router: Router = express.Router();

router.get("/", requireAuth, listProjectsHandler);
router.get("/:id", requireAuth, getProjectHandler);
router.post("/", requireAuth, createProjectHandler);
router.patch("/:id", requireAuth, updateProjectHandler);
router.delete("/:id", requireAuth, deleteProjectHandler);

router.get("/:id/deployments/:deploymentId", requireAuth, getDeploymentHandler);
router.post("/:id/deployments", requireAuth, createDeploymentHandler);
router.post("/:id/deployments/trigger", requireAuth, webhookDeploymentHandler);

export default router;
