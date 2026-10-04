const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { clientOrigins } = require("./config");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origine CORS non autorisée."));
  }
}));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "taskflow-api", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable." });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

module.exports = app;
