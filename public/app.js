const lineGrid = document.getElementById("line-grid");
const searchInput = document.getElementById("line-search");
const statusFilter = document.getElementById("status-filter");
const roleToggle = document.getElementById("role-toggle");
let lines = [];
let role = "Supervisor";
let socket;
let retryTimer;

function statusLabel(status) {
  return status === "warning" ? "Needs attention" : status === "complete" ? "Target reached" : "Running";
}
function renderLines() {
  const search = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const filtered = lines.filter((line) =>
    (line.name.toLowerCase().includes(search) || line.id.toLowerCase().includes(search)) &&
    (filter === "all" || line.status === filter)
  );
  if (!filtered.length) {
    lineGrid.innerHTML = '<div class="loading">No production lines match your filters.</div>';
    return;
  }
  lineGrid.innerHTML = filtered.map((line) => {
    const percent = Math.min(100, Math.round((line.units / line.target) * 100));
    return `<article class="line-card" data-status="${line.status}">
      <div class="line-card-top"><div><div class="line-name">${line.name}</div><div class="line-id">${line.id}</div></div><span class="pill ${line.status}">${statusLabel(line.status)}</span></div>
      <div class="output-row"><strong>${line.units.toLocaleString()}</strong><span>of ${line.target.toLocaleString()} units</span></div>
      <div class="progress" role="progressbar" aria-label="${line.name} target progress" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div>
      <div class="line-meta"><span>${percent}% of target</span><span>${role === "Supervisor" ? "Supervisor view" : "Operator view"}</span></div>
    </article>`;
  }).join("");
}
function updateSummary() {
  document.getElementById("total-output").textContent = lines.reduce((sum, line) => sum + line.units, 0).toLocaleString();
  document.getElementById("active-lines").textContent = lines.filter((line) => line.status !== "complete").length;
  document.getElementById("warning-lines").textContent = lines.filter((line) => line.status === "warning").length;
  const completion = lines.length ? Math.round(lines.reduce((sum, line) => sum + Math.min(100, line.units / line.target * 100), 0) / lines.length) : 0;
  document.getElementById("completion").textContent = `${completion}%`;
  document.getElementById("nav-alert-count").textContent = lines.filter((line) => line.status === "warning").length;
  document.getElementById("alert-count").textContent = `${lines.filter((line) => line.status === "warning").length} open`;
  const warnings = lines.filter((line) => line.status === "warning");
  document.getElementById("alert-list").innerHTML = warnings.length ? warnings.map((line) =>
    `<div class="alert-row"><span class="alert-symbol">!</span><div><strong>${line.name} is below target pace</strong><p>Review output and check for a station delay.</p></div><span class="alert-time">Live</span></div>`
  ).join("") : '<div class="alert-row"><span class="alert-symbol">✓</span><div><strong>No active production alerts</strong><p>All lines are meeting their current pace targets.</p></div></div>';
}
function handleSnapshot(payload) {
  if (payload.type !== "snapshot" || !Array.isArray(payload.lines)) return;
  lines = payload.lines;
  document.getElementById("last-updated").textContent = new Date(payload.sentAt).toLocaleTimeString();
  renderLines();
  updateSummary();
}
function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${location.host}`);
  socket.addEventListener("open", () => {
    document.getElementById("connection-label").textContent = "Live connection";
    document.querySelector(".connection").classList.add("connected");
    socket.send(JSON.stringify({ type: "request-snapshot" }));
  });
  socket.addEventListener("message", (event) => {
    try { handleSnapshot(JSON.parse(event.data)); } catch { console.warn("Received invalid stream payload"); }
  });
  socket.addEventListener("close", () => {
    document.getElementById("connection-label").textContent = "Reconnecting…";
    document.querySelector(".connection").classList.remove("connected");
    retryTimer = setTimeout(connect, 1500);
  });
  socket.addEventListener("error", () => socket.close());
}
searchInput.addEventListener("input", renderLines);
statusFilter.addEventListener("change", renderLines);
roleToggle.addEventListener("click", () => {
  role = role === "Supervisor" ? "Operator" : "Supervisor";
  roleToggle.textContent = `View: ${role} ▾`;
  renderLines();
});
window.addEventListener("online", () => { if (!socket || socket.readyState > WebSocket.OPEN) connect(); });
window.addEventListener("offline", () => {
  document.getElementById("connection-label").textContent = "Offline · cached view";
  document.querySelector(".connection").classList.remove("connected");
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/service-worker.js").catch(() => {}));
}
window.addEventListener("beforeunload", () => clearTimeout(retryTimer));
connect();
