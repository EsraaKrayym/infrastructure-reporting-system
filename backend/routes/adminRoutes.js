import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { blockUser, deleteUser } from "../controllers/adminController.js";

const router = express.Router();

router.put("/users/:id/block",
    verifyToken,
    requireRole(["admin"]),
    blockUser
);

router.delete("/users/:id",
    verifyToken,
    requireRole(["admin"]),
    deleteUser
);

export default router;