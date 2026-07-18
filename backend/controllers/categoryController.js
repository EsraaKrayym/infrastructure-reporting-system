import pool from "../config/db.js";

export const getCategories = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                c.id,
                c.name,
                c.description,
                COUNT(r.id)::int AS report_count
             FROM categories c
             LEFT JOIN reports r ON r.category_id = c.id
             GROUP BY c.id, c.name, c.description
             ORDER BY c.name ASC`
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const normalizedName = String(name || "").trim();
        const normalizedDescription = String(description || "").trim();

        if (!normalizedName || !normalizedDescription) {
            return res.status(400).json({ message: "Name und Beschreibung sind erforderlich" });
        }

        const existing = await pool.query(
            `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [normalizedName]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Kategorie existiert bereits" });
        }

        const result = await pool.query(
            `INSERT INTO categories (name, description)
             VALUES ($1, $2)
             RETURNING id, name, description`,
            [normalizedName, normalizedDescription]
        );

        res.status(201).json({
            message: "Kategorie erfolgreich erstellt",
            category: {
                ...result.rows[0],
                report_count: 0,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const normalizedName = String(name || "").trim();
        const normalizedDescription = String(description || "").trim();

        if (!normalizedName || !normalizedDescription) {
            return res.status(400).json({ message: "Name und Beschreibung sind erforderlich" });
        }

        const existing = await pool.query(
            `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2 LIMIT 1`,
            [normalizedName, id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Kategorie existiert bereits" });
        }

        const result = await pool.query(
            `UPDATE categories
             SET name = $1,
                 description = $2
             WHERE id = $3
             RETURNING id, name, description`,
            [normalizedName, normalizedDescription, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Kategorie nicht gefunden" });
        }

        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS report_count FROM reports WHERE category_id = $1`,
            [id]
        );

        res.json({
            message: "Kategorie aktualisiert",
            category: {
                ...result.rows[0],
                report_count: countResult.rows[0]?.report_count ?? 0,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const reportsUsingCategory = await pool.query(
            `SELECT COUNT(*)::int AS report_count FROM reports WHERE category_id = $1`,
            [id]
        );

        if ((reportsUsingCategory.rows[0]?.report_count ?? 0) > 0) {
            return res.status(400).json({
                message: "Kategorie kann nicht gelöscht werden, solange Meldungen zugeordnet sind",
            });
        }

        const result = await pool.query(
            `DELETE FROM categories WHERE id = $1 RETURNING id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Kategorie nicht gefunden" });
        }

        res.json({ message: "Kategorie gelöscht" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
