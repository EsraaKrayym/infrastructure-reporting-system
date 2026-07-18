import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../config/db.js";

dotenv.config(); // MUSS GANZ OBEN stehen

export const verifyToken = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userResult = await pool.query(
            `SELECT u.id, u.blocked, r.name AS role
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.id = $1`,
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = userResult.rows[0];

        if (user.blocked) {
            return res.status(403).json({ message: "Account blocked" });
        }

        req.user = {
            id: user.id,
            role: user.role || "citizen",
        };
        next();
    } catch (err) {
        console.log("JWT ERROR:", err.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};