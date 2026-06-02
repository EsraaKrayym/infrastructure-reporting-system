import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import bcrypt from "bcryptjs";
dotenv.config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
bcrypt.hash("123456", 10).then(hash => {
    console.log("HASH:", hash);
});
app.get("/", (req, res) => {
    res.send("Backend läuft 🚀");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});