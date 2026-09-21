# Security Policy

ShipPulse takes security, secret management, and software supply chain integrity seriously. As an enterprise multi-account CI/CD automation hub, safeguarding credentials, OAuth tokens, and deployment pipelines is a primary design objective.

---

## Supported Versions

Only the latest major and minor release versions receive security patches.

| Version | Supported          | Security Maintenance Level |
| :--- | :---: | :--- |
| **1.0.x** | :white_check_mark: | Active support & immediate security patches |
| **< 1.0** | :x:                | Unsupported |

---

## Reporting a Vulnerability

If you discover a potential vulnerability, credential leak, or architectural security flaw within ShipPulse:

1. **Do NOT disclose the issue publicly** through GitHub Issues, Discussions, or Pull Requests.
2. Email our security team at `security@shippulse.dev` with:
   - A detailed description of the vulnerability and its potential attack vector.
   - Exact steps or proof-of-concept (PoC) code to reproduce the issue.
   - The affected subsystem (`frontend/`, `backend/gateway/`, `backend/services/auth/`, etc.).
   - Recommended mitigations if known.
3. You will receive an acknowledgment within **24–48 hours**.
4. We coordinate a private remediation branch and publish a patched release before any public disclosure.

---

## Security Architecture & Best Practices for Operators

### 1. Cryptographic Webhook Verification (HMAC-SHA256)
- The Webhook Microservice (`backend/services/webhook/`) validates every inbound GitHub webhook by calculating the HMAC-SHA256 digest over the raw request payload using the configured `WEBHOOK_SECRET` and comparing it against the `X-Hub-Signature-256` header with constant-time equality checks (`hmac.compare_digest`), preventing forgery and timing attacks.

### 2. Enterprise Security Headers (OWASP Standards)
Both the Python API Gateway and the Angular SSR Express server inject strict security headers:
- `X-Content-Type-Options: nosniff` (mitigates MIME-type sniffing)
- `X-Frame-Options: DENY` (prevents clickjacking attacks)
- `X-XSS-Protection: 1; mode=block` (browser XSS filtering)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (enforces HSTS)
- `Referrer-Policy: strict-origin-when-cross-origin` (prevents referrer leakage)
- `Content-Security-Policy: default-src 'self'; frame-ancestors 'none';` (strict frame protection)
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (disables unused hardware APIs)
- `X-Powered-By`: Explicitly suppressed to prevent framework fingerprinting.

### 3. Container Security Hardening (CIS Benchmark & NIST SP 800-190)
- All production containers (`frontend/Dockerfile`, `backend/*/Dockerfile`) run as unprivileged users (`node` with UID 1000 in frontend; `appuser` with UID 1000 in Python microservices) rather than `root`.
- Multi-stage builds strip compilation tools, SDKs, and build dependencies from the final production images.

### 4. Command Injection & Sandboxing Guardrails
- Diagnostic and test execution in the Workflow Service (`backend/services/workflow/`) enforces command whitelisting against permitted test runners (`npm`, `ng`, `pytest`, `git`, `node`) and strictly rejects shell injection tokens (`&&`, `||`, `;`, `` ` ``, `$()`, `rm`, `curl`, `wget`, `sudo`, `eval`).

### 5. Reverse-Proxy Hop-by-Hop Sanitization (RFC 7230)
- The API Gateway filters hop-by-hop headers (`connection`, `keep-alive`, `transfer-encoding`, `upgrade`, `proxy-authorization`) when proxying requests between client and downstream microservices.

### 6. DoS & Payload Size Guardrails (OWASP API4:2023)
- Ingress request entity size is capped at 10MB across both the API Gateway and the Angular SSR server. Payloads exceeding this limit receive an immediate `413 Payload Too Large` error.

### 7. Zero Secret Storage & Least Privilege CI/CD
- **Never commit `.env` files**: All secrets must reside in environment variables or cloud secret managers.
- GitHub Actions CI workflows enforce the Principle of Least Privilege (PoLP) with explicit `permissions: contents: read`.
