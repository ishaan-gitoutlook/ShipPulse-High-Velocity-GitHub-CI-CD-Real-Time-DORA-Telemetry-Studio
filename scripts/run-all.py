#!/usr/bin/env python3
"""
ShipPulse - Master Full-Stack Orchestrator
Launches both the Python Microservices Cluster (Ports 5000-5004) and the Angular 21 Frontend (Port 3000)
concurrently with graceful process cleanup on SIGINT (Ctrl+C).
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path

# Fix Windows console UTF-8 encoding
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"

processes = []


def cleanup(signum=None, frame=None):
    print("\n\n" + "=" * 70)
    print("  [SHUTDOWN] Gracefully terminating ShipPulse full-stack runtime...")
    print("=" * 70)
    for p in processes:
        if p.poll() is None:
            p.terminate()
    time.sleep(1)
    for p in processes:
        if p.poll() is None:
            p.kill()
    print("  All services successfully terminated. Goodbye!\n")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print("=" * 75)
    print("  ShipPulse - Enterprise Full-Stack Monorepo Supervisor")
    print("=" * 75)
    print(f"  Root:     {ROOT_DIR}")
    print(f"  Frontend: {FRONTEND_DIR}")
    print(f"  Backend:  {BACKEND_DIR}")
    print("-" * 75)

    # Launch Backend Microservices Cluster
    print("  [1/2] Starting Python Microservices Cluster...")
    backend_cmd = [sys.executable, str(BACKEND_DIR / "run_microservices.py")]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(ROOT_DIR))
    processes.append(backend_proc)

    time.sleep(3)

    # Launch Frontend Server
    print("  [2/2] Starting Angular 21 SSR Client Application...")
    is_win = sys.platform.startswith("win")
    npm_cmd = "npm.cmd" if is_win else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR),
        shell=is_win
    )
    processes.append(frontend_proc)

    print("-" * 75)
    print("  FULL-STACK SYSTEM ONLINE:")
    print("     - Web Application (UI):  http://localhost:3000")
    print("     - API Gateway:           http://localhost:5000")
    print("     - Microservices Docs:    http://localhost:5000/docs")
    print("     - Auth Microservice:     http://localhost:5001")
    print("     - Workflow Microservice: http://localhost:5002")
    print("     - Pipeline Microservice: http://localhost:5003")
    print("     - Webhook Microservice:  http://localhost:5004")
    print("  Press Ctrl+C at any time to terminate all processes.")
    print("=" * 75)

    try:
        while True:
            for p in processes:
                if p.poll() is not None:
                    print(f"\n[!] A sub-process exited unexpectedly with code {p.returncode}.")
                    cleanup()
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
