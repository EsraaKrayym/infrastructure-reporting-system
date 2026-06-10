import express from "express";
import {
    createReport,
    getReports, updatePriority,
    updateReportStatus
} from "../controllers/reportController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// Citizen → eigene Reports sehen
router.get("/my", verifyToken, requireRole(["citizen"]), getReports);

// Caseworker → alle Reports sehen
router.get("/", verifyToken, requireRole(["admin"]), getReports);

// Caseworker → Status ändern
router.put("/:id/status", verifyToken, requireRole(["admin"]), updateReportStatus);

router.put(
    "/:id/priority",
    verifyToken,
    requireRole(["admin"]),
    updatePriority
);
router.post(
    "/",
    verifyToken,
    upload.single("photo"),
    createReport
);
export default router;