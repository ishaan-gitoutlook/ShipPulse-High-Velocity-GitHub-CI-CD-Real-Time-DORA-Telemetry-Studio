"""
ShipPulse - Multi-Microservice Local Concurrency Supervisor
Starts the API Gateway and all 4 domain microservices concurrently with graceful termination.
"""

import sys
import os
import time
import signal
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SERVICES = [
    {
        "name": "Auth & Identity Service",
        "port": 5001,
        "module": "services.auth.main:app",
        "cwd": BASE_DIR
    },
    {
        "name": "Workflow & Workspace Service",
        "port": 5002,
        "module": "services.workflow.main:app",
        "cwd": BASE_DIR
    },
    {
        "name": "Pipeline & Telemetry Service",
        "port": 5003,
        "module": "services.pipeline.main:app",
        "cwd": BASE_DIR
    },
    {
        "name": "Webhook & Event Service",
        "port": 5004,
        "module": "services.webhook.main:app",
        "cwd": BASE_DIR
    },
    {
        "name": "API Gateway (Unified Reverse Proxy)",
        "port": 5000,
        "module": "gateway.main:app",
        "cwd": BASE_DIR
    }
]

processes = []


def terminate_processes(signum=None, frame=None):
    print("\n[Supervisor] Shutting down ShipPulse microservices gracefully...")
    for p in processes:
        if p.poll() is None:
            p.terminate()
    time.sleep(1)
    for p in processes:
        if p.poll() is None:
            p.kill()
    print("[Supervisor] All microservices stopped.")
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, terminate_processes)
    signal.signal(signal.SIGTERM, terminate_processes)

    print("=" * 70)
    print("  🚀 Starting ShipPulse Python Microservices Cluster")
    print("=" * 70)

    # Set PYTHONPATH to include backend root
    env = os.environ.copy()
    current_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{str(BASE_DIR)}{os.pathsep}{current_pythonpath}"

    for svc in SERVICES:
        cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            svc["module"],
            "--host",
            "0.0.0.0",
            "--port",
            str(svc["port"])
        ]
        print(f"  [+] Launching {svc['name']:<35} on port {svc['port']}...")
        p = subprocess.Popen(cmd, cwd=svc["cwd"], env=env)
        processes.append(p)
        time.sleep(0.5)

    print("=" * 70)
    print("  ✅ All 5 microservices running:")
    print("     - API Gateway:    http://localhost:5000 (OpenAPI: http://localhost:5000/docs)")
    print("     - Auth Service:   http://localhost:5001 (OpenAPI: http://localhost:5001/docs)")
    print("     - Workflow Svc:   http://localhost:5002 (OpenAPI: http://localhost:5002/docs)")
    print("     - Pipeline Svc:   http://localhost:5003 (OpenAPI: http://localhost:5003/docs)")
    print("     - Webhook Svc:    http://localhost:5004 (OpenAPI: http://localhost:5004/docs)")
    print("  Press Ctrl+C to terminate the cluster.")
    print("=" * 70)

    try:
        while True:
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    svc_name = SERVICES[i]["name"]
                    print(f"  [!] Process {svc_name} exited with code {p.returncode}. Restarting...")
                    cmd = [
                        sys.executable,
                        "-m",
                        "uvicorn",
                        SERVICES[i]["module"],
                        "--host",
                        "0.0.0.0",
                        "--port",
                        str(SERVICES[i]["port"])
                    ]
                    processes[i] = subprocess.Popen(cmd, cwd=SERVICES[i]["cwd"], env=env)
            time.sleep(2)
    except KeyboardInterrupt:
        terminate_processes()


if __name__ == "__main__":
    main()
