import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    getAllUsers,
    toggleBlockUser,
    deleteUser,
    createCaseworker
} from "../controllers/userController.js";

const router = express.Router();

// Nur Admin darf
router.get("/", verifyToken, requireRole(["admin"]), getAllUsers);
router.post("/", verifyToken, requireRole(["admin"]), createCaseworker);
router.put("/:id/block", verifyToken, requireRole(["admin"]), toggleBlockUser);
router.delete("/:id", verifyToken, requireRole(["admin"]), deleteUser);

export default router;