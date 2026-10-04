const API_URL = "http://localhost:3000/api";
let token = localStorage.getItem("taskflow_token");
let tasks = [];
let authMode = "login";
let draggedTaskId = null;
const $ = (selector) => document.querySelector(selector);

function setAuthenticated(value) { $("#auth-screen").classList.toggle("hidden", value); $("#workspace").classList.toggle("hidden", !value); }
function toast(message, error = false) { const item = document.createElement("div"); item.className = `toast${error ? " error" : ""}`; item.textContent = message; $("#toast-region").append(item); setTimeout(() => item.remove(), 3000); }
function escapeHtml(value = "") { return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[c]); }
async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
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
}
document.querySelectorAll(".auth-tab").forEach((tab) => tab.addEventListener("click", () => setAuthMode(tab.dataset.mode)));
$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api(`/auth/${authMode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify({ email: $("#email").value, password: $("#password").value }) });
    token = data.token; localStorage.setItem("taskflow_token", token); $("#profile-email").textContent = data.user.email; $("#first-name").textContent = data.user.email.split("@")[0]; setAuthenticated(true); await loadTasks();
  } catch (error) { $("#auth-message").textContent = error.message; }
});
function renderTasks() {
  const query = $("#search").value.toLowerCase();
  ["todo", "doing", "done"].forEach((status) => {
    const column = $(`[data-drop-status="${status}"]`);
    const items = tasks.filter((task) => (task.status || (task.completed ? "done" : "todo")) === status && `${task.title} ${task.description}`.toLowerCase().includes(query));
    $(`[data-count="${status}"]`).textContent = items.length;
    column.innerHTML = items.map((task) => `<article class="kanban-card" draggable="true" data-card-id="${task.id}"><div class="card-top"><span class="card-label ${status}">${status === "todo" ? "PRIORITÉ" : status === "doing" ? "EN COURS" : "TERMINÉE"}</span><button data-delete="${task.id}" aria-label="Supprimer">•••</button></div><h4>${escapeHtml(task.title)}</h4><p>${escapeHtml(task.description || "Aucun contexte ajouté.")}</p><footer><span class="card-date">◷ ${new Date(task.created_at).toLocaleDateString("fr-FR")}</span><span class="mini-avatar">DM</span></footer></article>`).join("");
  });
  $("#empty-state").classList.toggle("hidden", tasks.length > 0);
  updateMetrics();
  document.querySelectorAll(".kanban-card").forEach((card) => {
    card.addEventListener("dragstart", () => { draggedTaskId = Number(card.dataset.cardId); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
}
function updateMetrics() {
  const done = tasks.filter((task) => (task.status || (task.completed ? "done" : "todo")) === "done").length;
  const open = tasks.length - done; const rate = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $("#completion-rate").textContent = `${rate}%`; $("#completion-progress").style.width = `${rate}%`; $("#completion-detail").textContent = `${done} tâche${done > 1 ? "s" : ""} terminée${done > 1 ? "s" : ""} sur ${tasks.length}`; $("#open-count").textContent = open; $("#done-count").textContent = done;
}
async function loadTasks() { try { tasks = (await api("/tasks")).tasks; renderTasks(); } catch (error) { toast(error.message, true); } }
function openModal(status = "todo") { $("#task-modal").dataset.status = status; $("#task-modal").classList.remove("hidden"); $("#task-title").focus(); }
function closeModal() { $("#task-modal").classList.add("hidden"); $("#task-form").reset(); }
$("#new-task").addEventListener("click", () => openModal()); $("#empty-new-task").addEventListener("click", () => openModal());
document.querySelectorAll("[data-add-status]").forEach((button) => button.addEventListener("click", () => openModal(button.dataset.addStatus)));
$("#close-modal").addEventListener("click", closeModal); $("#cancel-modal").addEventListener("click", closeModal); $("#search").addEventListener("input", renderTasks);
document.querySelectorAll("[data-drop-status]").forEach((zone) => {
  zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.closest(".board-column").classList.add("drop-target"); });
  zone.addEventListener("dragleave", () => zone.closest(".board-column").classList.remove("drop-target"));
  zone.addEventListener("drop", async () => {
    zone.closest(".board-column").classList.remove("drop-target");
    const task = tasks.find((item) => item.id === draggedTaskId); const status = zone.dataset.dropStatus;
    if (!task || task.status === status) return;
    try { await api(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ title: task.title, description: task.description, status }) }); await loadTasks(); toast("Carte déplacée."); } catch (error) { toast(error.message, true); }
  });
});
$("#task-form").addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/tasks", { method: "POST", body: JSON.stringify({ title: $("#task-title").value, description: $("#task-description").value }) }); closeModal(); await loadTasks(); toast("Carte créée."); } catch (error) { $("#task-message").textContent = error.message; } });
$("#board").addEventListener("click", async (event) => { const button = event.target.closest("[data-delete]"); if (!button) return; try { await api(`/tasks/${button.dataset.delete}`, { method: "DELETE" }); await loadTasks(); toast("Carte supprimée."); } catch (error) { toast(error.message, true); } });
function logout() { token = null; localStorage.removeItem("taskflow_token"); setAuthenticated(false); }
$("#logout").addEventListener("click", logout);
setAuthenticated(Boolean(token)); if (token) loadTasks();
