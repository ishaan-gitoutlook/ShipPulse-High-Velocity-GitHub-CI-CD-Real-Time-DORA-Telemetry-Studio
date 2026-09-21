# ShipPulse - Developer Setup Guide

This guide walks you through setting up ShipPulse for local development, configuring environment secrets, and running the full-stack system natively or using Docker.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v22.x LTS` or higher
- **npm**: `v10.x` or higher
- **Python**: `3.11` or higher
- **Docker & Docker Compose**: (Optional, recommended for multi-container orchestration)

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```

### Environment Variables Reference

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Optional | Client execution environment | `development` / `production` |
| `PORT` | Optional | Frontend application port | `3000` |
| `GATEWAY_PORT` | Optional | Python API Gateway ingress port | `5000` |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App Client ID | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App Client Secret | `6b91c...` |
| `GEMINI_API_KEY` | Yes | Google Gemini API Key for workflow generation | `AIzaSy...` |
| `WEBHOOK_SECRET` | Yes | HMAC-SHA256 secret for validating GitHub webhooks | `whsec_...` |
| `CORS_ORIGIN` | Optional | Allowed CORS origin for API Gateway | `http://localhost:3000` |

---

## 3. Quickstart: Native Development

### Step 1: Environment & Dependencies

#### Frontend (Node.js 22 LTS):
```bash
npm --prefix frontend install
```

#### Backend (Python 3.11+ / Virtual Environment):
```powershell
# On Windows PowerShell (activates the pre-configured workspace .venv):
.\.venv\Scripts\Activate.ps1

# If script execution is restricted by PowerShell policy:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\.venv\Scripts\Activate.ps1

# Dependencies are already installed, but can be verified with:
pip install -r backend/requirements.txt
```
*(On macOS / Linux: `source .venv/bin/activate && pip install -r backend/requirements.txt`)*

### Step 2: Start Full Stack Concurrently
You can launch both the Python microservices cluster (Ports 5000–5004) and the Angular SSR frontend (Port 3000) with a single command:

```bash
python scripts/run-all.py
```
*Or using the npm workspace script:*
```bash
npm run dev
```

### Step 3: Access Running Services

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | `http://localhost:3000` | Angular 21 SSR Client UI |
| **API Gateway** | `http://localhost:5000` | Unified Reverse Proxy (`/api/health`) |
| **Gateway OpenAPI Docs** | `http://localhost:5000/docs` | Interactive Swagger API Explorer |
| **Auth Microservice** | `http://localhost:5001/docs` | GitHub OAuth & Identity API |
| **Workflow Microservice** | `http://localhost:5002/docs` | Actions Generator & Gemini Engine |
| **Pipeline Microservice** | `http://localhost:5003/docs` | Deployments & Live Telemetry |
| **Webhook Microservice** | `http://localhost:5004/docs` | HMAC Ingestion & Event Audit |

---

## 4. Multi-Container Orchestration (Docker Compose)

ShipPulse provides a production-ready `docker-compose.yml` that builds and spins up all 5 microservices plus the Angular SSR container inside an isolated bridge network (`shippulse-net`):

```bash
# Build images and start all containers in detached mode
npm run docker:up

# Stream aggregated container logs
npm run docker:logs

# Check cluster health
curl http://localhost:5000/api/health

# Stop and remove containers
npm run docker:down
```

---

## 5. Quality Assurance & Testing

ShipPulse includes an automated verification script that executes all static analysis, compilation, and unit tests across both frontend and backend:

```bash
# Run complete verification pipeline
python scripts/verify-all.py
```

### Domain-Specific Commands

```bash
# Frontend ESLint (0 errors, 0 warnings required)
npm run lint

# Frontend TypeScript strict type-check
npm run typecheck

# Frontend unit tests (Vitest)
npm test

# Frontend production compilation (Client bundle + SSR server)
npm run build

# Backend microservices test suite (Pytest - 24 tests)
pytest backend/tests -v
```

---

## 6. Troubleshooting

### Windows Console Unicode Output
If running Python scripts directly in Windows PowerShell and you experience `UnicodeEncodeError`, the helper scripts automatically configure `sys.stdout.reconfigure(encoding='utf-8')`. Ensure you run scripts via:
```powershell
python scripts/run-all.py
# or using py launcher:
py scripts/run-all.py
```

### Port Conflicts
If port `5000` or `3000` is already bound by another process:
- Check running processes: `netstat -ano | findstr :5000`
- Kill conflicting PID: `taskkill /PID <PID> /F`

For detailed architectural information, see [docs/architecture.md](architecture.md) and [docs/api-reference.md](api-reference.md).
