const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

function authenticate(req, res, next) {
  const header = req.get("Authorization");
  const [scheme, token] = header ? header.split(" ") : [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token Bearer requis." });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Accès administrateur requis." });
  }
  return next();
}

module.exports = { authenticate, requireAdmin };
