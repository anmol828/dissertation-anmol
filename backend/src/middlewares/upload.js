import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const createStorage = (subFolder, prefix) => {
  const destinationPath = path.resolve(__dirname, `../../uploads/${subFolder}`);
  fs.mkdirSync(destinationPath, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ext || ".jpg";
      cb(null, `${prefix}-${req.user?.id || "guest"}-${Date.now()}${safeExt}`);
    }
  });
};

const playerStorage = createStorage("players", "player");
const venueStorage = createStorage("venues", "venue");
const teamStorage = createStorage("teams", "team");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const err = new Error("Only JPG, PNG, WEBP, and GIF files are allowed");
    err.status = 400;
    return cb(err);
  }
  return cb(null, true);
};

const buildUploader = (storage) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  });

export const uploadPlayerImage = buildUploader(playerStorage);
export const uploadVenueImage = buildUploader(venueStorage);
export const uploadTeamImage = buildUploader(teamStorage);
