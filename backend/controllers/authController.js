import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPassword = String(password || "");

        if (!normalizedEmail || !normalizedPassword) {
            return res.status(400).json({ message: "E-Mail und Passwort sind erforderlich" });
        }

        const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@cityreport.de";
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "123456";
        const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || "Administrator";

        let result = await pool.query(
            `SELECT u.*, r.name AS role
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.email = $1`,
            [normalizedEmail]
        );

        // Falls der Standard-Admin fehlt, automatisch erstellen (Prototype-Stabilität)
        if (result.rows.length === 0 && normalizedEmail === String(defaultAdminEmail).toLowerCase()) {
            const hashedDefaultPassword = await bcrypt.hash(defaultAdminPassword, 10);

            await pool.query(
                `INSERT INTO users (name, email, password, role_id, blocked)
                 VALUES (
                    $1,
                    $2,
                    $3,
                    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
                    false
                 )
                 ON CONFLICT (email)
                 DO UPDATE SET
                    name = EXCLUDED.name,
                    password = EXCLUDED.password,
                    role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
                    blocked = false`,
                [defaultAdminName, defaultAdminEmail, hashedDefaultPassword]
            );

            result = await pool.query(
                `SELECT u.*, r.name AS role
                 FROM users u
                 LEFT JOIN roles r ON r.id = u.role_id
                 WHERE u.email = $1`,
                [normalizedEmail]
            );
        }

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];

        if (user.blocked) {
            return res.status(403).json({ message: "Account blocked" });
        }

        let isMatch = false;

        // Normalfall: bcrypt hash
        if (typeof user.password === "string" && user.password.startsWith("$2")) {
            isMatch = await bcrypt.compare(normalizedPassword, user.password);
        } else {
            // Legacy-Fall: Klartext-Passwort in DB -> einmalig migrieren
            isMatch = normalizedPassword === user.password;

            if (isMatch) {
                const newHash = await bcrypt.hash(normalizedPassword, 10);
                await pool.query(
                    "UPDATE users SET password = $1 WHERE id = $2",
                    [newHash, user.id]
                );
            }
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role || "citizen" },
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || "citizen"
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const normalizedName = String(name || "").trim();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPassword = String(password || "");

        if (!normalizedName || !normalizedEmail || !normalizedPassword) {
            return res.status(400).json({ message: "Name, E-Mail und Passwort sind erforderlich" });
        }

        const allowedRoles = ["citizen", "caseworker", "admin"];
        const normalizedRole = allowedRoles.includes(String(role || "").toLowerCase())
            ? String(role).toLowerCase()
            : "citizen";

        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role_id, blocked)
             VALUES (
                 $1,
                 $2,
                 $3,
                 (SELECT id FROM roles WHERE name = $4 LIMIT 1),
                 false
             )
             RETURNING id`,
            [normalizedName, normalizedEmail, hashedPassword, normalizedRole]
        );

        res.status(201).json({
            message: "User registered successfully",
            id: result.rows[0].id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
