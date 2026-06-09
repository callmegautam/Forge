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

const router: Router = express.Router();

router.get("/", requireAuth, listProjectsHandler);
router.get("/:id", requireAuth, getProjectHandler);
router.post("/", requireAuth, createProjectHandler);
router.patch("/:id", requireAuth, updateProjectHandler);
router.delete("/:id", requireAuth, deleteProjectHandler);

export default router;
