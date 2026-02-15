import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import fs from "fs";
import dbPromise from "./config/db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

const initDatabase = async () => {
    const db = await dbPromise;
    const sql = fs.readFileSync("./database.sql").toString();
    await db.exec(sql);
    console.log("SQLite database initialized");
};

initDatabase();
app.get("/", (req, res) => {
    res.send("Backend läuft 🚀");
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
