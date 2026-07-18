import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (!allowedMimeTypes.includes(String(file.mimetype || "").toLowerCase())) {
        return cb(new Error("Nur JPG, PNG oder WEBP Bilder sind erlaubt"));
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});