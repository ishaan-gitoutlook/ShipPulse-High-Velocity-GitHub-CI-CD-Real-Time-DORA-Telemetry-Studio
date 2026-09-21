"""
ShipPulse - Common Microservices Configuration
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Search and load root .env
root_dir = Path(__file__).resolve().parent.parent.parent
env_paths = [
    root_dir / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path.cwd() / ".env"
]
for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break


class Settings:
    # Service Ports
    GATEWAY_PORT: int = int(os.environ.get("GATEWAY_PORT", 5000))
    AUTH_PORT: int = int(os.environ.get("AUTH_PORT", 5001))
    WORKFLOW_PORT: int = int(os.environ.get("WORKFLOW_PORT", 5002))
    PIPELINE_PORT: int = int(os.environ.get("PIPELINE_PORT", 5003))
    WEBHOOK_PORT: int = int(os.environ.get("WEBHOOK_PORT", 5004))

    # Intra-cluster Service URLs (default to localhost, override with Docker service names)
    AUTH_SERVICE_URL: str = os.environ.get("AUTH_SERVICE_URL", f"http://127.0.0.1:{AUTH_PORT}")
    WORKFLOW_SERVICE_URL: str = os.environ.get("WORKFLOW_SERVICE_URL", f"http://127.0.0.1:{WORKFLOW_PORT}")
    PIPELINE_SERVICE_URL: str = os.environ.get("PIPELINE_SERVICE_URL", f"http://127.0.0.1:{PIPELINE_PORT}")
    WEBHOOK_SERVICE_URL: str = os.environ.get("WEBHOOK_SERVICE_URL", f"http://127.0.0.1:{WEBHOOK_PORT}")

    # Application URLs & Credentials
    APP_URL: str = os.environ.get("APP_URL", "http://localhost:3000")
    CORS_ORIGIN: str = os.environ.get("CORS_ORIGIN", "*")
    GITHUB_CLIENT_ID: str = os.environ.get("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.environ.get("GITHUB_CLIENT_SECRET", "")
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    WEBHOOK_SECRET: str = os.environ.get("WEBHOOK_SECRET", "whsec_shippulse_default_key")


settings = Settings()
