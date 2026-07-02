import multer from "multer";
import fs from "fs";
import path from "path";

const uploadsDir = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const safeName = (file.originalname || "report.jpg")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9._-]/g, "");
        cb(null, Date.now() + "-" + safeName);
    },
});

export const upload = multer({ storage });