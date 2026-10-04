import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const PASS = process.env.PANEL_PASSWORD || "";
const uploadDir = path.resolve(root, process.env.UPLOAD_DIR || "./uploads");
const maxMb = Math.max(1, Math.min(5, Number(process.env.MAX_UPLOAD_MB || 2)));
fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(root, "public")));

function auth(req, res, next) {
  const got = Buffer.from(req.get("x-panel-password") || "");
  const expected = Buffer.from(PASS);
  if (!PASS || got.length !== expected.length || !crypto.timingSafeEqual(got, expected)) {
    return res.status(401).json({ error: "Panel password incorrect." });
  }
  next();
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".py", ".js"].includes(ext)) return cb(new Error("Only .py and .js files are accepted."));
    cb(null, true);
  }
});

app.get("/api/status", auth, (_req, res) => {
  const count = fs.readdirSync(uploadDir).filter(n => /\.(py|js)$/i.test(n)).length;
  res.json({
    status: "panel-online",
    execution: "disabled-by-default",
    runtimes: {
      node: process.version,
      python: "Uploads are stored only; no Python runtime is launched by this panel."
    },
    uploadedFiles: count
  });
});
app.get("/api/files", auth, (_req, res) => {
  const files = fs.readdirSync(uploadDir)
    .filter(n => /\.(py|js)$/i.test(n))
    .map(name => {
      const full = path.join(uploadDir, name);
      const st = fs.statSync(full);
      return { name, size: st.size, modified: st.mtime.toISOString() };
    });
  res.json({ files });
});
app.post("/api/upload", auth, (req, res, next) => {
  upload.single("tool")(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Choose a .py or .js file." });
    res.json({
      ok: true,
      file: { name: req.file.filename, originalName: path.basename(req.file.originalname), size: req.file.size },
      note: "File stored only. It has NOT been executed."
    });
  });
});
app.delete("/api/files/:name", auth, (req, res) => {
  const name = path.basename(req.params.name);
  if (name !== req.params.name || !/\.(py|js)$/i.test(name)) return res.status(400).json({ error: "Invalid filename." });
  const full = path.join(uploadDir, name);
  if (!fs.existsSync(full)) return res.status(404).json({ error: "File not found." });
  fs.unlinkSync(full);
  res.json({ ok: true });
});
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Request failed." });
});
app.listen(PORT, () => {
  console.log(`Panel listening on port ${PORT}`);
  if (!PASS) console.warn("Set PANEL_PASSWORD before using this panel.");
});
