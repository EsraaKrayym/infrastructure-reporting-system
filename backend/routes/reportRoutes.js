import express from "express";
import {
    createReport,
    getReports,
    getReportPhoto,
    updatePriority,
    updateReport,
    updateReportStatus
} from "../controllers/reportController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();


// Citizen → eigene Reports sehen
router.get("/my", verifyToken, requireRole(["citizen"]), getReports);

router.get("/:id/photo", getReportPhoto);

// Caseworker → alle Reports sehen
router.get("/", verifyToken, requireRole(["admin","caseworker"]), getReports);

// Caseworker → Status ändern
router.put("/:id/status", verifyToken, requireRole(["caseworker"]), updateReportStatus);

router.put(
    "/:id/priority",
    verifyToken,
    requireRole(["caseworker"]),
    updatePriority
);

router.put(
    "/:id",
    verifyToken,
    requireRole(["caseworker"]),
    updateReport
);

router.post(
    "/",
    verifyToken,
    requireRole(["citizen"]),
    upload.single("photo"),
    createReport
);
export default router;