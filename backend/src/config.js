const path = require("node:path");
require("dotenv").config();

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un entier compris entre 1 et 65535.");
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
}

module.exports = {
  port,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  databasePath: process.env.DATABASE_PATH === ":memory:"
    ? ":memory:"
    : path.resolve(process.env.DATABASE_PATH || "./data/taskflow.db"),
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:8080,http://127.0.0.1:8080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};
