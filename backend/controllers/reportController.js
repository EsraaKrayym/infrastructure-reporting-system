import dbPromise from "../config/db.js";

/* =========================================
   CREATE REPORT (Citizen)
========================================= */
export const createReport = async (req, res) => {
    try {
        const db = await dbPromise;

        const {
            title,
            description,
            category,
            latitude,
            longitude,
            priority,
            address
        } = req.body;

        // Photo nur wenn es in der FormData kommt (für Admin-Web)
        const photo = req.file ? req.file.filename : null;

        if (!title || !category) {
            return res.status(400).json({
                message: "Title and category are required"
            });
        }

        console.log("🔍 CREATE REPORT DEBUG:");
        console.log("  Title:", title);
        console.log("  User ID:", req.user.id);
        console.log("  Role:", req.user.role);
        console.log("  Latitude:", latitude);
        console.log("  Longitude:", longitude);

        const result = await db.run(
            `INSERT INTO reports
             (title, description, category, latitude, longitude, user_id, status, priority, address, photo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

        console.log("✅ INSERT DONE - ID:", result.lastID);
        
        return res.status(201).json({
            message: "Report erfolgreich gespeichert",
            id: result.lastID
        });

    } catch (error) {
        console.error("❌ CREATE REPORT ERROR:", error);
        console.error("REQUEST BODY:", req.body);
        console.error("REQUEST USER:", req.user);
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   GET REPORTS
   Citizen → eigene
   Caseworker → alle
========================================= */
export const getReports = async (req, res) => {
    try {
        const db = await dbPromise;

        // Citizen → nur eigene Reports
        if (req.user.role === "citizen") {
            const reports = await db.all(
                "SELECT * FROM reports WHERE user_id = ?",
                [req.user.id]
            );
            return res.json(reports);
        }

        // Caseworker → alle Reports
        if (req.user.role === "caseworker") {
            const reports = await db.all("SELECT * FROM reports");
            return res.json(reports);
        }

        res.status(403).json({ message: "Access denied" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/* =========================================
   UPDATE STATUS (Caseworker only)
   + Audit Log
========================================= */
export const updateReportStatus = async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;
        const { status } = req.body;

        // Nur Caseworker darf Status ändern
        if (req.user.role !== "caseworker") {
            return res.status(403).json({ message: "Caseworker access required" });
        }

        // Alten Status holen
        const report = await db.get(
            "SELECT status FROM reports WHERE id = ?",
            [id]
        );

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        const oldStatus = report.status;

        // Status aktualisieren
        await db.run(
            "UPDATE reports SET status = ? WHERE id = ?",
            [status, id]
        );

        // 🔥 Audit Log speichern
        await db.run(
            `INSERT INTO audit_logs 
            (report_id, changed_by, action) 
            VALUES (?, ?, ?)`,
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
export const updatePriority = async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;
    const { priority } = req.body;

    if (req.user.role !== "caseworker") {
        return res.status(403).json({ message: "Caseworker access required" });
    }

    await db.run(
        "UPDATE reports SET priority = ? WHERE id = ?",
        [priority, id]
    );

    await db.run(
        `INSERT INTO audit_logs (report_id, changed_by, action)
         VALUES (?, ?, ?)`,
        [id, req.user.id, `Priority changed to ${priority}`]
    );

    res.json({ message: "Priority updated" });
};