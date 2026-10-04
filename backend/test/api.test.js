process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.DATABASE_PATH = ":memory:";
process.env.CLIENT_ORIGIN = "http://localhost:8080";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../src/app");

test("GET /api/health renvoie un état opérationnel", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
});

test("register, login et accès protégé fonctionnent", async () => {
  const register = await request(app)
    .post("/api/auth/register")
    .send({ email: "test@example.com", password: "password123" });
  assert.equal(register.status, 201);
  assert.ok(register.body.token);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "password123" });
  assert.equal(login.status, 200);

  const tasks = await request(app)
    .get("/api/tasks")
    .set("Authorization", `Bearer ${login.body.token}`);
  assert.equal(tasks.status, 200);
  assert.deepEqual(tasks.body.tasks, []);
});

