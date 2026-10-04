const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

function mapTask(task) {
  return { ...task, completed: Boolean(task.completed), status: task.status };
}

router.get("/", (req, res) => {
  const tasks = db
    .prepare("SELECT id, title, description, completed, status, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
    .all(req.user.id)
    .map(mapTask);
  return res.json({ tasks });
});

router.post("/", (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";

  if (!title || title.length > 120 || description.length > 2000) {
    return res.status(400).json({ error: "Titre requis (1-120 caractères) et description de 0-2000 caractères." });
  }

  const result = db
    .prepare("INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, 'todo')")
    .run(req.user.id, title, description);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(result.lastInsertRowid, req.user.id);
  return res.status(201).json({ task: mapTask(task) });
});

router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const description = typeof req.body.description === "string" ? req.body.description.trim() : "";
  const requestedStatus = ["todo", "doing", "done"].includes(req.body.status) ? req.body.status : null;
  const completed = requestedStatus ? requestedStatus === "done" : (req.body.completed === true || req.body.completed === false ? req.body.completed : null);
  const status = requestedStatus || (completed ? "done" : "todo");

  if (!Number.isInteger(id) || !title || title.length > 120 || description.length > 2000 || completed === null) {
    return res.status(400).json({ error: "Données de tâche invalides." });
  }

  const result = db
    .prepare("UPDATE tasks SET title = ?, description = ?, completed = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
    .run(title, description, completed ? 1 : 0, status, id, req.user.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Tâche introuvable." });
  }
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(id, req.user.id);
  return res.json({ task: mapTask(task) });
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Identifiant invalide." });
  }

  const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, req.user.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Tâche introuvable." });
  }
  return res.status(204).send();
});

module.exports = router;
