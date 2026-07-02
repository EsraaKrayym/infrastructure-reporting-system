import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import bcrypt from "bcryptjs";
import userRoutes from "./routes/userRoutes.js";
import pool from "./config/db.js";
dotenv.config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

const ensureDefaultAdmin = async () => {
    try {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@cityreport.de";
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "123456";
        const adminName = process.env.DEFAULT_ADMIN_NAME || "Administrator";

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await pool.query(
            `INSERT INTO users (name, email, password, role, blocked)
             VALUES ($1, $2, $3, 'admin', false)
             ON CONFLICT (email)
             DO UPDATE SET
                 name = EXCLUDED.name,
                 password = EXCLUDED.password,
                 role = 'admin',
                 blocked = false`,
            [adminName, adminEmail, hashedPassword]
        );

        console.log(`Default admin ready: ${adminEmail}`);
    } catch (error) {
        console.error("Failed to ensure default admin:", error.message);
    }
};

app.get("/", (req, res) => {
    res.send("Backend läuft 🚀");
});

const PORT = process.env.PORT || 5000;
//const PORT = 5000;
//
// app.listen(PORT, () => {
//     console.log(`Server läuft auf Port ${PORT}`);
// });
const startServer = async () => {
    await ensureDefaultAdmin();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server läuft auf Port ${PORT}`);
    });
};

startServer();