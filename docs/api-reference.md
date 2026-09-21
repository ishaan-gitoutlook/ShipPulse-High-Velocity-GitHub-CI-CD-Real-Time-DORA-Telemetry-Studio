# ShipPulse - API Reference

All client interactions are routed through the **FastAPI API Gateway** running on port `5000`. In development, Angular's SSR server proxies `/api/*` directly to this gateway via `proxy.conf.json`.

Interactive OpenAPI/Swagger documentation is available for each active service:
- **API Gateway**: `http://localhost:5000/docs`
- **Auth Service**: `http://localhost:5001/docs`
- **Workflow Service**: `http://localhost:5002/docs`
- **Pipeline Service**: `http://localhost:5003/docs`
- **Webhook Service**: `http://localhost:5004/docs`

---

## 🌐 Gateway System Health

### Aggregated Health Check
```http
GET /api/health
```
Queries downstream microservices concurrently and returns the composite health status of the entire cluster.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "gateway": "operational",
  "timestamp": 1726943400,
  "downstream": {
    "auth_service": "healthy",
    "workflow_service": "healthy",
    "pipeline_service": "healthy",
    "webhook_service": "healthy"
  }
}
```

---

## 🔐 Auth & Identity Service (Port 5001)

### Generate GitHub OAuth URL
```http
GET /api/auth/url?host_url={client_origin}
```
Generates a secure GitHub OAuth 2.0 authorization URL with a cryptographically randomized CSRF state token.

**Response `200 OK`**:
```json
{
  "url": "https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=repo,workflow,user&state=...",
  "state": "8a9f24b1c8e..."
}
```

### OAuth Code Exchange
```http
POST /api/auth/exchange
Content-Type: application/json
```
**Request Body**:
```json
{
  "code": "847291a82f",
  "state": "8a9f24b1c8e..."
}
```
**Response `200 OK`**:
```json
{
  "token": "gho_xxxxxxxxxxxxxxxxxxxx",
  "username": "octocat",
  "avatar_url": "https://avatars.githubusercontent.com/u/583231"
}
```

### Get Authenticated User Profile
```http
GET /api/github/user
Authorization: Bearer <github_token>
```

### List User Repositories
```http
GET /api/github/repos
Authorization: Bearer <github_token>
```

---

## ⚙️ Workflow & Workspace Service (Port 5002)

### List Virtual Repository Files
```http
GET /api/github/repos/{owner}/{repo}/files
```

### Fetch Specific File Content
```http
GET /api/github/repos/{owner}/{repo}/file?path=src/calculator.js
```

### Save/Hot-Patch File Content
```http
POST /api/github/repos/{owner}/{repo}/file
Content-Type: application/json
```
**Request Body**:
```json
{
  "path": "src/calculator.js",
  "content": "// Updated source code\n..."
}
```

### Generate GitHub Actions Workflow (Gemini AI Engine)
```http
POST /api/github/repos/{owner}/{repo}/generate-workflow
Content-Type: application/json
```
**Request Body**:
```json
{
  "name": "Production CI/CD",
  "environment": "production",
  "cloud_provider": "aws",
  "node_version": "22",
  "enable_slsa": true
}
```
**Response `200 OK`**:
```json
{
  "yaml": "name: Production CI/CD\non:\n  push:\n    branches: [main]\n...",
  "workflow_path": ".github/workflows/shippulse.yml",
  "generated_at": "2026-09-22T00:00:00Z"
}
```

### Execute Sandboxed Debug Command
```http
POST /api/github/repos/{owner}/{repo}/exec
Content-Type: application/json
```
**Request Body**:
```json
{
  "command": "npm test"
}
```

### AST-Based YAML Syntax & Security Linter
```http
POST /api/yaml/lint
Content-Type: application/json
```
**Request Body**:
```json
{
  "yaml_content": "name: CI\non: push\njobs:\n  build:\n    runs-on: ubuntu-latest\n"
}
```
**Response `200 OK`**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

---

## 🚀 Pipeline & Telemetry Service (Port 5003)

### Trigger Deployment Run
```http
POST /api/github/deploy
Content-Type: application/json
```
**Request Body**:
```json
{
  "repo_name": "scientific--calculator-2",
  "branch": "main",
  "workflow_yaml": "...",
  "environment": "production"
}
```
**Response `200 OK`**:
```json
{
  "success": true,
  "deploy_id": "deploy_8b29f0",
  "status": "In Progress",
  "message": "Deployment started"
}
```

### Stream Pipeline Logs
```http
GET /api/github/pipeline/{deploy_id}/logs
```
Returns structured live telemetry logs with step status (`PASS`, `FAIL`, `IN_PROGRESS`).

### Pipeline Action Control (State Machine)
```http
POST /api/github/pipeline/{deploy_id}/action
Content-Type: application/json
```
**Request Body**:
```json
{
  "action": "pause" // "pause", "resume", "cancel", "retry"
}
```

---

## 🔔 Webhook & Event Service (Port 5004)

### Ingest GitHub Webhook
```http
POST /api/github/webhook
X-GitHub-Event: push
X-GitHub-Delivery: 72ee3fc0-5777-11e8-8a9c-0c3a3b05a5a9
X-Hub-Signature-256: sha256=d57c2...
Content-Type: application/json
```
Cryptographically validates HMAC-SHA256 signature using `WEBHOOK_SECRET` before ingesting the payload.

### Trigger Test Mock Push Webhook
```http
POST /api/github/webhook/test
Content-Type: application/json
```
**Request Body**:
```json
{
  "repository": "octocat/hello-world",
  "branch": "main",
  "sender": "octocat"
}
```

### Retrieve Webhook Audit History
```http
GET /api/github/webhook/history?limit=50
```
Returns recent inbound and simulated webhook deliveries with status, event types, and delivery latency.
