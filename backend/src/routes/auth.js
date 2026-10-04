const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { jwtExpiresIn, jwtSecret } = require("../config");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!emailPattern.test(email) || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        error: "Email valide et mot de passe de 8 à 128 caractères requis."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email, passwordHash);
    const user = db
      .prepare("SELECT id, email, role, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Cet email est déjà utilisé." });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const publicUser = { id: user.id, email: user.email, role: user.role, created_at: user.created_at };
    return res.json({ user: publicUser, token: createToken(publicUser) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

