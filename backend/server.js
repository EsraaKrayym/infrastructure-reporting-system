import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import bcrypt from "bcryptjs";
import userRoutes from "./routes/userRoutes.js";
dotenv.config();

console.log("JWT_SECRET:", process.env.JWT_SECRET);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
bcrypt.hash("123456", 10).then(hash => {
    console.log("HASH:", hash);
});
app.get("/", (req, res) => {
    res.send("Backend läuft 🚀");
});

const PORT = process.env.PORT || 5000;
//const PORT = 5000;
//
// app.listen(PORT, () => {
//     console.log(`Server läuft auf Port ${PORT}`);
// });
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server läuft auf Port ${PORT}`);
});