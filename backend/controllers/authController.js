import dbPromise from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";





export const register = async (req, res) => {
    try {
        const db = await dbPromise;
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await db.get(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.run(
            "INSERT INTO users (name, email, password, role, blocked) VALUES (?, ?, ?, ?, ?)",
            [name, email, hashedPassword, "citizen", 0]
        );

        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const login = async (req, res) => {
    try {
        const db = await dbPromise;
        const { email, password } = req.body;

        const user = await db.get(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // 🔥 Block-Prüfung gehört hier rein
        if (user.blocked === 1) {
            return res.status(403).json({ message: "Account blocked" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};