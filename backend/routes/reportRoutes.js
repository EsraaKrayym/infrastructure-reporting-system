import express from "express";
import {
    createReport,
    getReports,
    updateReportStatus
} from "../controllers/reportController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createReport);
router.get("/", verifyToken, getReports);
router.put("/:id/status", verifyToken, updateReportStatus);

export default router;
