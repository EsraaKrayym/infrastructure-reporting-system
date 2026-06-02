import pool from "../config/db.js";

// Alle User holen (Admin)
export const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role, blocked FROM users ORDER BY id DESC"
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