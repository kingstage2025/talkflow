const API_URL = "http://localhost:3000/api";
let mode = "login";
let token = localStorage.getItem("taskflow_token");

const $ = (selector) => document.querySelector(selector);
const authPanel = $("#auth-panel");
const appPanel = $("#app-panel");
const authForm = $("#auth-form");

function showMessage(selector, message = "") { $(selector).textContent = message; }
function setAuthenticated(value) {
  authPanel.classList.toggle("hidden", value);
  appPanel.classList.toggle("hidden", !value);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "Une erreur est survenue.");
  return data;
}

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
  mode = tab.dataset.mode;
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
  authForm.querySelector("button[type=submit]").textContent = mode === "login" ? "Se connecter" : "Créer mon compte";
  showMessage("#auth-message");
}));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("#auth-message", "Chargement...");
  try {
    const data = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      body: JSON.stringify({ email: $("#email").value, password: $("#password").value })
    });
    token = data.token;
    localStorage.setItem("taskflow_token", token);
    setAuthenticated(true);
    await loadTasks();
  } catch (error) { showMessage("#auth-message", error.message); }
});

async function loadTasks() {
  try {
    const { tasks } = await api("/tasks");
    $("#task-list").innerHTML = tasks.map((task) => `
      <li class="${task.completed ? "done" : ""}">
        <label><input type="checkbox" data-id="${task.id}" ${task.completed ? "checked" : ""}>
          <strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.description)}</small>
        </label>
        <button class="delete" data-delete="${task.id}" aria-label="Supprimer">Supprimer</button>
      </li>`).join("");
  } catch (error) { showMessage("#task-message", error.message); }
}

function escapeHtml(value) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char]); }

$("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/tasks", { method: "POST", body: JSON.stringify({ title: $("#task-title").value, description: $("#task-description").value }) });
    event.target.reset();
    await loadTasks();
  } catch (error) { showMessage("#task-message", error.message); }
});

$("#task-list").addEventListener("click", async (event) => {
  const deleteId = event.target.dataset.delete;
  if (deleteId) {
    await api(`/tasks/${deleteId}`, { method: "DELETE" });
    await loadTasks();
    return;
  }
  if (event.target.matches("input[type=checkbox]")) {
    const id = event.target.dataset.id;
    const task = (await api("/tasks")).tasks.find((item) => item.id === Number(id));
    await api(`/tasks/${id}`, { method: "PUT", body: JSON.stringify({ title: task.title, description: task.description, completed: event.target.checked }) });
    await loadTasks();
  }
});

$("#logout").addEventListener("click", () => {
  token = null; localStorage.removeItem("taskflow_token"); setAuthenticated(false);
});

if (token) { setAuthenticated(true); loadTasks(); }

