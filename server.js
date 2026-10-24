const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ status: "ok", service: "production-monitor" }));

const lineState = Array.from({ length: 8 }, (_, index) => ({
  id: `LINE-${String(index + 1).padStart(2, "0")}`,
  name: `Production line ${index + 1}`,
  units: 120 + index * 17,
  target: 160 + index * 10,
  status: index === 5 ? "warning" : "running",
  updatedAt: new Date().toISOString()
}));

function broadcast() {
  lineState.forEach((line, index) => {
    line.units += (index % 3) + 1;
    line.updatedAt = new Date().toISOString();
    if (line.units >= line.target) line.status = "complete";
    else if (line.units / line.target < 0.72) line.status = "warning";
    else line.status = "running";
  });
  const message = JSON.stringify({ type: "snapshot", sentAt: new Date().toISOString(), lines: lineState });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "snapshot", sentAt: new Date().toISOString(), lines: lineState }));
  socket.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === "request-snapshot") {
        socket.send(JSON.stringify({ type: "snapshot", sentAt: new Date().toISOString(), lines: lineState }));
      }
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  });
});

const interval = setInterval(broadcast, 2000);
server.listen(PORT, () => console.log(`Production monitor running at http://localhost:${PORT}`));
process.on("SIGINT", () => { clearInterval(interval); server.close(() => process.exit(0)); });
