const API_URL = "http://localhost:3000/api";
let authMode = "login";
let activeFilter = "all";
let tasks = [];
let token = localStorage.getItem("taskflow_token");

const $ = (selector) => document.querySelector(selector);
const authScreen = $("#auth-screen");
const workspace = $("#workspace");

function setAuthenticated(isAuthenticated) {
  const authView = document.querySelector("#auth-screen");
  const workspaceView = document.querySelector("#workspace");
  if (!authView || !workspaceView) return;
  authView.classList.toggle("hidden", isAuthenticated);
  workspaceView.classList.toggle("hidden", !isAuthenticated);
}

function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  $("#toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function showFormMessage(selector, message = "") {
  $(selector).textContent = message;
}

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data?.error || "Une erreur est survenue.");
  return data;
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  $("#auth-eyebrow").textContent = mode === "login" ? "WELCOME BACK" : "START FOCUSED";
  $("#auth-title").textContent = mode === "login" ? "Content de vous revoir." : "Créez votre espace.";
  $("#auth-subtitle").textContent = mode === "login" ? "Connectez-vous pour retrouver votre espace de travail." : "Quelques secondes pour commencer à travailler avec clarté.";
  $("#auth-submit").textContent = mode === "login" ? "Se connecter" : "Créer mon compte";
  $("#password").autocomplete = mode === "login" ? "current-password" : "new-password";
  showFormMessage("#auth-message");
}

document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.mode)));

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = $("#auth-submit");
  submit.textContent = "Connexion...";
  try {
    const data = await api(`/auth/${authMode === "login" ? "login" : "register"}`, {
      method: "POST",
      body: JSON.stringify({ email: $("#email").value, password: $("#password").value })
    });
    token = data.token;
    localStorage.setItem("taskflow_token", token);
    $("#profile-email").textContent = data.user.email;
    $("#first-name").textContent = data.user.email.split("@")[0].split(/[._-]/)[0];
    setAuthenticated(true);
    await loadTasks();
  } catch (error) {
    showFormMessage("#auth-message", error.message);
  } finally {
    submit.textContent = authMode === "login" ? "Se connecter" : "Créer mon compte";
  }
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;"
  }[character]));
}

function renderTasks() {
  const query = $("#search").value.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    const matchesFilter = activeFilter === "all" || (activeFilter === "done" ? task.completed : !task.completed);
    const matchesSearch = `${task.title} ${task.description}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
  $("#task-list").innerHTML = visibleTasks.map((task) => `
    <article class="task-card ${task.completed ? "done" : ""}">
      <input class="task-check" type="checkbox" data-complete="${task.id}" ${task.completed ? "checked" : ""} aria-label="Marquer ${escapeHtml(task.title)} comme terminée">
      <div class="task-body"><h3>${escapeHtml(task.title)}</h3><p>${escapeHtml(task.description || "Aucun contexte ajouté.")}</p><div class="task-meta"><span class="task-tag">${task.completed ? "TERMINÉE" : "PRIORITÉ"}</span><span>Créée ${new Date(task.created_at).toLocaleDateString("fr-FR")}</span></div></div>
      <div class="task-actions"><button data-delete="${task.id}" title="Supprimer">×</button></div>
    </article>`).join("");
  $("#empty-state").classList.toggle("hidden", visibleTasks.length > 0);
  updateMetrics();
}

function updateMetrics() {
  const done = tasks.filter((task) => task.completed).length;
  const open = tasks.length - done;
  const rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  $("#completion-rate").textContent = `${rate}%`;
  $("#completion-progress").style.width = `${rate}%`;
  $("#completion-detail").textContent = `${done} tâche${done > 1 ? "s" : ""} terminée${done > 1 ? "s" : ""} sur ${tasks.length}`;
  $("#open-count").textContent = open;
  $("#done-count").textContent = done;
  $("#task-count-label").textContent = `${tasks.length} tâche${tasks.length > 1 ? "s" : ""} dans votre espace de travail.`;
}

async function loadTasks() {
  try {
    const data = await api("/tasks");
    tasks = data.tasks;
    renderTasks();
  } catch (error) {
    showToast(error.message, "error");
    if (error.message.includes("Token")) logout();
  }
}

function openModal() {
  $("#task-modal").classList.remove("hidden");
  $("#task-title").focus();
}

function closeModal() {
  $("#task-modal").classList.add("hidden");
  $("#task-form").reset();
  showFormMessage("#task-message");
}

$("#new-task").addEventListener("click", openModal);
$("#empty-new-task").addEventListener("click", openModal);
$("#close-modal").addEventListener("click", closeModal);
$("#cancel-modal").addEventListener("click", closeModal);
$("#task-modal").addEventListener("click", (event) => { if (event.target.id === "task-modal") closeModal(); });
$("#search").addEventListener("input", renderTasks);

document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
  renderTasks();
}));

$("#task-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/tasks", { method: "POST", body: JSON.stringify({ title: $("#task-title").value, description: $("#task-description").value }) });
    closeModal();
    showToast("Votre tâche a été créée.");
    await loadTasks();
  } catch (error) { showFormMessage("#task-message", error.message); }
});

$("#task-list").addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete]");
  const checkbox = event.target.closest("[data-complete]");
  try {
    if (deleteButton) {
      await api(`/tasks/${deleteButton.dataset.delete}`, { method: "DELETE" });
      showToast("Tâche supprimée.");
      await loadTasks();
    } else if (checkbox) {
      const task = tasks.find((item) => item.id === Number(checkbox.dataset.complete));
      await api(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ title: task.title, description: task.description, completed: checkbox.checked }) });
      await loadTasks();
    }
  } catch (error) { showToast(error.message, "error"); }
});

function logout() {
  token = null;
  localStorage.removeItem("taskflow_token");
  tasks = [];
  setAuthenticated(false);
  setAuthMode("login");
}

$("#logout").addEventListener("click", logout);

if (token) {
  setAuthenticated(true);
  loadTasks();
} else {
  setAuthenticated(false);
}
