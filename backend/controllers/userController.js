import pool from "../config/db.js";
import bcrypt from "bcryptjs";

export const getCurrentUser = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.blocked,
                u.created_at,
                u.role_id,
                r.name AS role,
                r.description AS role_description
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.id = $1
             LIMIT 1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateCurrentUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Name ist erforderlich" });
        }

        if (!email || !String(email).trim()) {
            return res.status(400).json({ message: "E-Mail ist erforderlich" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedName = String(name).trim();

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1 AND id <> $2",
            [normalizedEmail, req.user.id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "E-Mail bereits vergeben" });
        }

        let passwordClause = "";
        const values = [normalizedName, normalizedEmail, req.user.id];

        if (password && String(password).trim()) {
            if (String(password).length < 6) {
                return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben" });
            }

            const hashedPassword = await bcrypt.hash(String(password), 10);
            values.splice(2, 0, hashedPassword);
            passwordClause = ", password = $3";
        }

        await pool.query(
            `UPDATE users
             SET name = $1,
                 email = $2
                 ${passwordClause}
             WHERE id = $${password && String(password).trim() ? 4 : 3}`,
            values
        );

        const updatedUser = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.blocked,
                u.created_at,
                u.role_id,
                r.name AS role,
                r.description AS role_description
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             WHERE u.id = $1
             LIMIT 1`,
            [req.user.id]
        );

        res.json({
            message: "Profil erfolgreich aktualisiert",
            user: updatedUser.rows[0],
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Alle User holen (Admin)
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.blocked,
                u.created_at,
                u.role_id,
                r.name AS role,
                r.description AS role_description
             FROM users u
             LEFT JOIN roles r ON r.id = u.role_id
             ORDER BY u.created_at DESC, u.id DESC`
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// User blockieren
export const toggleBlockUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await pool.query(
            "SELECT blocked FROM users WHERE id = $1",
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const newStatus = !user.rows[0].blocked;

        await pool.query(
            "UPDATE users SET blocked = $1 WHERE id = $2",
            [newStatus, id]
        );

        res.json({ message: "User updated" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// User löschen
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM users WHERE id = $1",
            [id]
        );

        res.json({ message: "User deleted" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Sachbearbeiter anlegen (Admin)
export const createCaseworker = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;

        const allowedRoles = ["citizen", "caseworker", "admin"];
        const normalizedRole = String(role || "caseworker").toLowerCase();

        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({ message: "Ungültige Rolle" });
        }

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: "Passwort muss mindestens 6 Zeichen haben" });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: "E-Mail bereits vergeben" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();

        const result = await pool.query(
            `INSERT INTO users (name, email, password, role_id, blocked)
             VALUES (
                 $1,
                 $2,
                 $3,
                 (SELECT id FROM roles WHERE name = $4 LIMIT 1),
                 false
             )
             RETURNING id, name, email, role_id, blocked`,
            [fullName, String(email).trim().toLowerCase(), hashedPassword, normalizedRole]
        );

        const createdUser = result.rows[0];
        const roleResult = await pool.query(
            "SELECT name, description FROM roles WHERE id = $1",
            [createdUser.role_id]
        );
        const createdRole = roleResult.rows[0] || null;

        res.status(201).json({
            message: "Benutzer erfolgreich erstellt",
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                blocked: createdUser.blocked,
                role_id: createdUser.role_id,
                role: createdRole?.name || normalizedRole,
                role_description: createdRole?.description || null,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};