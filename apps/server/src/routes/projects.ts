import express from "express";
import { requireAuth } from "../middleware/auth";
import { createProject } from "../controllers/project.controller";
import type { Router } from "express";

const router: Router = express.Router();

router.post("/", requireAuth, createProject);

export default router;
