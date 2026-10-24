# Live Production Monitoring and Alerts Portal

Responsive production-monitoring portal with a Node.js/Express server and a WebSocket stream that updates simulated output for eight production lines every two seconds.

## Features
- Live WebSocket snapshots with reconnect behavior
- Eight production line cards with target progress and status labels
- Summary metrics for output, active lines, warnings, and completion
- Search and status filtering
- Supervisor/operator view toggle
- Recent alert list generated from warning statuses
- Service worker for cached application shell and offline fallback
- Cypress end-to-end tests and a GitHub Actions workflow

## Run locally
Requires Node.js 18+.

```bash
npm install
npm start
```

Open http://localhost:3000. The `/health` endpoint returns a small service-health response.

## Run Cypress
Keep the server running in one terminal, then in another:

```bash
npm run test:e2e
```

For the interactive Cypress runner:

```bash
npm run test:e2e:open
```

## Notes
This is a portfolio/demo implementation. The server generates simulated production counts; it does not connect to PLCs, MES systems, or factory hardware. The supervisor/operator toggle demonstrates role-specific view labeling, not production-grade authentication or authorization. Offline caching covers the static app shell; live WebSocket data requires a connection.
