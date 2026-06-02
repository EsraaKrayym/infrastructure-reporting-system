import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    getAllUsers,
    toggleBlockUser,
    deleteUser
} from "../controllers/userController.js";

const router = express.Router();

// Nur Admin darf
router.get("/", verifyToken, requireRole(["caseworker"]), getAllUsers);
router.put("/:id/block", verifyToken, requireRole(["caseworker"]), toggleBlockUser);
router.delete("/:id", verifyToken, requireRole(["caseworker"]), deleteUser);

export default router;