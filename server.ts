import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("pets.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    birthday TEXT NOT NULL,
    owner_name TEXT,
    owner_contact TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/pets", (req, res) => {
    const pets = db.prepare("SELECT * FROM pets ORDER BY name ASC").all();
    res.json(pets);
  });

  app.post("/api/pets", (req, res) => {
    const { name, species, breed, birthday, owner_name, owner_contact } = req.body;
    const info = db.prepare(`
      INSERT INTO pets (name, species, breed, birthday, owner_name, owner_contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, species, breed, birthday, owner_name, owner_contact);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/pets/:id", (req, res) => {
    db.prepare("DELETE FROM pets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/birthdays", (req, res) => {
    const month = req.query.month; // Expected format "MM" (01-12)
    if (!month) {
      return res.status(400).json({ error: "Month is required" });
    }
    
    // SQLite doesn't have a simple way to extract month from string if not ISO, 
    // but we'll store as YYYY-MM-DD
    const pets = db.prepare("SELECT * FROM pets WHERE strftime('%m', birthday) = ?").all(month);
    res.json(pets);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
