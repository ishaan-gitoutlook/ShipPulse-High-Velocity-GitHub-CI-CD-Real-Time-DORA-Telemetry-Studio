#!/usr/bin/env python3
"""
ShipPulse - Enterprise Monorepo Verification Runner
Runs complete validation across:
  1. Frontend ESLint
  2. Frontend TypeScript Typecheck
  3. Frontend Unit Tests (Vitest)
  4. Frontend Production Build (Angular 21 Application + SSR Bundle)
  5. Backend Pytest Microservices Test Suite
"""

import sys
import time
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
IS_WIN = sys.platform.startswith("win")
NPM_CMD = "npm.cmd" if IS_WIN else "npm"


def run_step(step_name: str, cmd: list, cwd: Path) -> bool:
    print("\n" + "=" * 70)
    print(f"  [STEP] {step_name}")
    print(f"  Command: {' '.join(cmd)}")
    print(f"  Working Directory: {cwd}")
    print("=" * 70)
    start_time = time.time()
    result = subprocess.run(cmd, cwd=str(cwd), shell=IS_WIN)
    duration = time.time() - start_time
    if result.returncode == 0:
        print(f"\n  [PASS] {step_name} ({duration:.2f}s)")
        return True
    else:
        print(f"\n  [FAIL] {step_name} with exit code {result.returncode} ({duration:.2f}s)")
        return False


def main():
    print("=" * 70)
    print("  ShipPulse - Complete Enterprise Repository Verification")
    print("=" * 70)

    steps = [
        ("Frontend ESLint Verification", [NPM_CMD, "run", "lint"], FRONTEND_DIR),
        ("Frontend TypeScript Typecheck", [NPM_CMD, "run", "typecheck"], FRONTEND_DIR),
        ("Frontend Vitest Test Suite", [NPM_CMD, "test"], FRONTEND_DIR),
        ("Frontend Production & SSR Build", [NPM_CMD, "run", "build"], FRONTEND_DIR),
        ("Backend Microservices Pytest Suite", [sys.executable, "-m", "pytest", "tests", "-v"], BACKEND_DIR),
    ]

    all_passed = True
    results = []

    for name, cmd, cwd in steps:
        passed = run_step(name, cmd, cwd)
        results.append((name, passed))
        if not passed:
            all_passed = False
            break

    print("\n" + "=" * 70)
    print("  VERIFICATION SUMMARY:")
    print("=" * 70)
    for name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status:<8} {name}")
    print("=" * 70)

    if all_passed:
        print("  ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!\n")
        sys.exit(0)
    else:
        print("  SOME CHECKS FAILED. Please review the output above.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
