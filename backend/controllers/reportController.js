import fs from "fs";
import path from "path";
import pool from "../config/db.js";

const CATEGORY_ALIASES = {
    road_damage: "Straßenschäden",
    street_light: "Beleuchtung",
    waste: "Müll",
    other: "Sonstiges",
    "müll & sauberkeit": "Müll",
};

const STATUS_ALIASES = {
    new: "Neu",
    neu: "Neu",
    in_review: "In Prüfung",
    "in prüfung": "In Prüfung",
    in_progress: "In Bearbeitung",
    "in bearbeitung": "In Bearbeitung",
    done: "Erledigt",
    repaired: "Erledigt",
    fixed: "Erledigt",
    completed: "Erledigt",
    rejected: "Abgelehnt",
    declined: "Abgelehnt",
    abgelehnt: "Abgelehnt",
};

const REPORT_SELECT = `
    SELECT
        r.id,
        r.title,
        r.description,
        r.category_id,
        c.name AS category,
        r.latitude,
        r.longitude,
        r.user_id,
        r.status_id,
        s.name AS status,
        r.priority,
        r.address,
        r.photo,
        r.created_at
    FROM reports r
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN report_statuses s ON s.id = r.status_id
`;

const normalizeCategoryName = (rawCategory) => {
    const key = String(rawCategory || "").trim().toLowerCase();
    return CATEGORY_ALIASES[key] || String(rawCategory || "").trim();
};

const normalizeStatusName = (rawStatus) => {
    const key = String(rawStatus || "").trim().toLowerCase();
    return STATUS_ALIASES[key] || String(rawStatus || "").trim();
};

const buildPhotoValue = (file) => {
    if (!file) return null;

    if (file.buffer) {
        const mimeType = String(file.mimetype || "image/jpeg").toLowerCase();
        const base64 = file.buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }

    return file.filename || null;
};

export const getReportPhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "SELECT photo FROM reports WHERE id = $1 LIMIT 1",
            [id]
        );

        if (result.rows.length === 0 || !result.rows[0].photo) {
            return res.status(404).send("Photo not found");
        }

        const photo = String(result.rows[0].photo);

        if (photo.startsWith("data:image/")) {
            const match = photo.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
            if (!match) {
                return res.status(400).send("Invalid image data");
            }

            const mimeType = match[1];
            const buffer = Buffer.from(match[2], "base64");
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Cache-Control", "public, max-age=3600");
            return res.send(buffer);
        }

        if (/^https?:\/\//i.test(photo)) {
            return res.redirect(photo);
        }

        const fileName = path.basename(photo);
        const uploadPath = path.resolve(process.cwd(), "uploads", fileName);

        if (fs.existsSync(uploadPath)) {
            return res.sendFile(uploadPath);
        }

        return res.status(404).send("Photo file not available");
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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

        const photo = buildPhotoValue(req.file);

        if (!title || !category) {
            return res.status(400).json({
                message: "Title and category are required"
            });
        }

        const normalizedCategory = normalizeCategoryName(category);
        const normalizedPriority = String(priority || "medium").toLowerCase();
        const allowedPriorities = ["low", "medium", "high"];

        if (!allowedPriorities.includes(normalizedPriority)) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const categoryResult = await pool.query(
            `SELECT id, name
             FROM categories
             WHERE LOWER(name) = LOWER($1)
             LIMIT 1`,
            [normalizedCategory]
        );

        if (categoryResult.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid category"
            });
        }

        const statusResult = await pool.query(
            `SELECT id
             FROM report_statuses
             WHERE LOWER(name) = LOWER('Neu')
             LIMIT 1`
        );

        if (statusResult.rows.length === 0) {
            return res.status(500).json({
                message: "Default status 'Neu' is missing"
            });
        }

        const result = await pool.query(
            `INSERT INTO reports
            (title, description, category_id, latitude, longitude, user_id, status_id, priority, address, photo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING id`,
            [
                title,
                description || "Keine Beschreibung",
                categoryResult.rows[0].id,
                latitude,
                longitude,
                req.user.id,
                statusResult.rows[0].id,
                normalizedPriority,
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
                `${REPORT_SELECT}
                 WHERE r.user_id = $1
                 ORDER BY r.created_at DESC`,
                [req.user.id]
            );
            return res.json(result.rows);
        }

        if (
            req.user.role === "caseworker" ||
            req.user.role === "admin") {
            const result = await pool.query(
                `${REPORT_SELECT}
                 ORDER BY r.created_at DESC`
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

        const normalizedStatus = normalizeStatusName(status);

        const result = await pool.query(
            `SELECT r.id, r.status_id, s.name AS status
             FROM reports r
             LEFT JOIN report_statuses s ON s.id = r.status_id
             WHERE r.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        const oldStatus = result.rows[0].status;

        const statusResult = await pool.query(
            `SELECT id, name
             FROM report_statuses
             WHERE LOWER(name) = LOWER($1)
             LIMIT 1`,
            [normalizedStatus]
        );

        if (statusResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const newStatus = statusResult.rows[0].name;

        await pool.query(
            "UPDATE reports SET status_id = $1 WHERE id = $2",
            [statusResult.rows[0].id, id]
        );

        await pool.query(
            `INSERT INTO audit_logs (report_id, changed_by, action, old_value, new_value)
             VALUES ($1,$2,$3,$4,$5)`,
            [
                id,
                req.user.id,
                `Status changed from ${oldStatus} to ${newStatus}`,
                oldStatus,
                newStatus,
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

        const allowedPriorities = ["low", "medium", "high"];
        if (!allowedPriorities.includes(String(priority || "").toLowerCase())) {
            return res.status(400).json({ message: "Invalid priority" });
        }

        const oldPriorityResult = await pool.query(
            "SELECT priority FROM reports WHERE id = $1",
            [id]
        );

        if (oldPriorityResult.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        const oldPriority = oldPriorityResult.rows[0].priority;
        const newPriority = String(priority).toLowerCase();

        await pool.query(
            "UPDATE reports SET priority = $1 WHERE id = $2",
            [newPriority, id]
        );

        await pool.query(
            `INSERT INTO audit_logs (report_id, changed_by, action, old_value, new_value)
             VALUES ($1,$2,$3,$4,$5)`,
            [
                id,
                req.user.id,
                `Priority changed from ${oldPriority} to ${newPriority}`,
                oldPriority,
                newPriority,
            ]
        );

        res.json({ message: "Priority updated" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   UPDATE REPORT (Caseworker)
========================================= */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            category,
            status,
            priority,
            address,
        } = req.body;

        if (req.user.role !== "caseworker") {
            return res.status(403).json({ message: "Caseworker access required" });
        }

        const currentResult = await pool.query(
            `SELECT
                r.id,
                r.title,
                r.description,
                r.category_id,
                c.name AS category,
                r.status_id,
                s.name AS status,
                r.priority,
                r.address
             FROM reports r
             LEFT JOIN categories c ON c.id = r.category_id
             LEFT JOIN report_statuses s ON s.id = r.status_id
             WHERE r.id = $1`,
            [id]
        );

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ message: "Report not found" });
        }

        const current = currentResult.rows[0];

        let nextCategoryId = current.category_id;
        let nextStatusId = current.status_id;
        let nextPriority = current.priority;

        if (category !== undefined) {
            const normalizedCategory = normalizeCategoryName(category);
            const categoryResult = await pool.query(
                `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                [normalizedCategory]
            );

            if (categoryResult.rows.length === 0) {
                return res.status(400).json({ message: "Invalid category" });
            }

            nextCategoryId = categoryResult.rows[0].id;
        }

        if (status !== undefined) {
            const normalizedStatus = normalizeStatusName(status);
            const statusResult = await pool.query(
                `SELECT id FROM report_statuses WHERE LOWER(name) = LOWER($1) LIMIT 1`,
                [normalizedStatus]
            );

            if (statusResult.rows.length === 0) {
                return res.status(400).json({ message: "Invalid status" });
            }

            nextStatusId = statusResult.rows[0].id;
        }

        if (priority !== undefined) {
            const normalizedPriority = String(priority || "").toLowerCase();
            const allowedPriorities = ["low", "medium", "high"];

            if (!allowedPriorities.includes(normalizedPriority)) {
                return res.status(400).json({ message: "Invalid priority" });
            }

            nextPriority = normalizedPriority;
        }

        await pool.query(
            `UPDATE reports
             SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category_id = $3,
                status_id = $4,
                priority = $5,
                address = COALESCE($6, address)
             WHERE id = $7`,
            [
                title ?? null,
                description ?? null,
                nextCategoryId,
                nextStatusId,
                nextPriority,
                address ?? null,
                id,
            ]
        );

        const updatedResult = await pool.query(
            `SELECT
                r.id,
                r.title,
                r.description,
                r.category_id,
                c.name AS category,
                r.status_id,
                s.name AS status,
                r.priority,
                r.address
             FROM reports r
             LEFT JOIN categories c ON c.id = r.category_id
             LEFT JOIN report_statuses s ON s.id = r.status_id
             WHERE r.id = $1`,
            [id]
        );

        const updated = updatedResult.rows[0];

        await pool.query(
            `INSERT INTO audit_logs (report_id, changed_by, action, old_value, new_value)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                id,
                req.user.id,
                "Report updated",
                JSON.stringify({
                    title: current.title,
                    description: current.description,
                    category: current.category,
                    status: current.status,
                    priority: current.priority,
                    address: current.address,
                }),
                JSON.stringify({
                    title: updated.title,
                    description: updated.description,
                    category: updated.category,
                    status: updated.status,
                    priority: updated.priority,
                    address: updated.address,
                }),
            ]
        );

        return res.json({
            message: "Report updated",
            report: updated,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};