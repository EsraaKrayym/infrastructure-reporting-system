import pool from "../config/db.js";

/* =========================================
   CREATE REPORT (Citizen)
========================================= */
export const createReport = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            latitude,
            longitude,
            priority,
            address
        } = req.body;

        const photo = req.file ? req.file.filename : null;

        if (!title || !category) {
            return res.status(400).json({
                message: "Title and category are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO reports
            (title, description, category, latitude, longitude, user_id, status, priority, address, photo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING id`,
            [
                title,
                description || "Keine Beschreibung",
                category,
                latitude,
                longitude,
                req.user.id,
                "Neu",
                priority || "medium",
                address || null,
                photo
            ]
        );

        return res.status(201).json({
            message: "Report erfolgreich gespeichert",
            id: result.rows[0].id
        });

    } catch (error) {
        console.error("CREATE REPORT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   GET REPORTS
========================================= */
export const getReports = async (req, res) => {
    try {

        if (req.user.role === "citizen") {
            const result = await pool.query(
                "SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC",
                [req.user.id]
            );
            return res.json(result.rows);
        }

        if (req.user.role === "caseworker") {
            const result = await pool.query(
                "SELECT * FROM reports ORDER BY created_at DESC"
            );
            return res.json(result.rows);
        }

        res.status(403).json({ message: "Access denied" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   UPDATE STATUS
========================================= */
export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (req.user.role !== "caseworker") {
            return res.status(403).json({ message: "Caseworker access required" });
        }

        const result = await pool.query(
            "SELECT status FROM reports WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        const oldStatus = result.rows[0].status;

        await pool.query(
            "UPDATE reports SET status = $1 WHERE id = $2",
            [status, id]
        );

        await pool.query(
            `INSERT INTO audit_logs (report_id, changed_by, action)
             VALUES ($1,$2,$3)`,
            [
                id,
                req.user.id,
                `Status changed from ${oldStatus} to ${status}`
            ]
        );

        res.json({ message: "Status updated successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   UPDATE PRIORITY
========================================= */
export const updatePriority = async (req, res) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;

        if (req.user.role !== "caseworker") {
            return res.status(403).json({ message: "Caseworker access required" });
        }

        await pool.query(
            "UPDATE reports SET priority = $1 WHERE id = $2",
            [priority, id]
        );

        await pool.query(
            `INSERT INTO audit_logs (report_id, changed_by, action)
             VALUES ($1,$2,$3)`,
            [id, req.user.id, `Priority changed to ${priority}`]
        );

        res.json({ message: "Priority updated" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};