import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", verifyToken, requireRole(["admin", "caseworker"]), getCategories);
router.post("/", verifyToken, requireRole(["admin", "caseworker"]), createCategory);
router.put("/:id", verifyToken, requireRole(["admin", "caseworker"]), updateCategory);
router.delete("/:id", verifyToken, requireRole(["admin", "caseworker"]), deleteCategory);

export default router;
