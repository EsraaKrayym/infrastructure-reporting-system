import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@cityreport.de";
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "123456";
        const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || "Administrator";

        let result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        // Falls der Standard-Admin fehlt, automatisch erstellen (Prototype-Stabilität)
        if (result.rows.length === 0 && email === defaultAdminEmail) {
            const hashedDefaultPassword = await bcrypt.hash(defaultAdminPassword, 10);

            await pool.query(
                `INSERT INTO users (name, email, password, role, blocked)
                 VALUES ($1, $2, $3, 'admin', false)
                 ON CONFLICT (email)
                 DO UPDATE SET
                    name = EXCLUDED.name,
                    password = EXCLUDED.password,
                    role = 'admin',
                    blocked = false`,
                [defaultAdminName, defaultAdminEmail, hashedDefaultPassword]
            );

            result = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
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
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy-Fall: Klartext-Passwort in DB -> einmalig migrieren
            isMatch = password === user.password;

            if (isMatch) {
                const newHash = await bcrypt.hash(password, 10);
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
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "supersecretkey",
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
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

        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password,role, blocked)
             VALUES ($1, $2, $3,$4,$5)
             RETURNING id`,
            [name, email, hashedPassword,"citizen",false]
        );

        res.status(201).json({
            message: "User registered successfully",
            id: result.rows[0].id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
