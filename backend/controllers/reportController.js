import dbPromise from "../config/db.js";

export const createReport = async (req, res) => {
    try {
        const db = await dbPromise;
        const { title, description, category, latitude, longitude } = req.body;

        if (!title || !category) {
            return res.status(400).json({ message: "Title and category are required" });
        }

        await db.run(
            `INSERT INTO reports 
       (title, description, category, latitude, longitude, user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description,
                category,
                latitude,
                longitude,
                req.user.id,
                "new"
            ]
        );

        res.status(201).json({ message: "Report created successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReports = async (req, res) => {
    try {
        const db = await dbPromise;
        const reports = await db.all("SELECT * FROM reports");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const db = await dbPromise;
        const { id } = req.params;
        const { status } = req.body;

        // Nur Admin darf Status ändern
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        await db.run(
            "UPDATE reports SET status = ? WHERE id = ?",
            [status, id]
        );

        res.json({ message: "Status updated successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
