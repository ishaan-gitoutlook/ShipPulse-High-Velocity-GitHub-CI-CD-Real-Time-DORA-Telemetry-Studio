# Contributing to ShipPulse

Thank you for your interest in contributing to **ShipPulse**! We welcome bug fixes, documentation improvements, new workflow templates, and architectural enhancements.

---

## Code of Conduct

Please maintain a respectful, constructive, and inclusive tone in all issues, pull requests, and community discussions.

---

## Getting Started

1. **Fork and Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/ShipPulse.git
   cd ShipPulse
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Provide your GitHub OAuth App credentials, Gemini API key, and webhook secret as needed.

3. **Install Dependencies**:
   ```bash
   # Install Frontend dependencies
   npm --prefix frontend install

   # Install Python Microservices dependencies
   pip install -r backend/requirements.txt
   ```

4. **Run Local Development**:
   ```bash
   # Launch both the Python Microservices Cluster & Angular Frontend
   python scripts/run-all.py
   # Or using the root npm script
   npm run dev
   ```
   Starts Angular on `http://localhost:3000` with API proxying enabled to the API Gateway on `http://localhost:5000`.

---

## Development Workflow & Quality Standards

Before submitting a Pull Request, run the full verification runner to ensure all automated checks pass:

```bash
python scripts/verify-all.py
```

Or test each domain individually:
```bash
# Frontend ESLint (0 errors required)
npm run lint

# Frontend TypeScript typecheck
npm run typecheck

# Frontend Vitest suite
npm test

# Python Microservices Pytest suite
pytest backend/tests -v

# Production build validation
npm run build
```

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature or capability
- `fix:` A bug fix or patch
- `docs:` Documentation changes only
- `refactor:` Code changes that neither fix a bug nor add a feature
- `test:` Adding or updating tests
- `chore:` Build process, dependency updates, or auxiliary tool changes

---

## Submitting a Pull Request

1. Create a feature branch: `git checkout -b feat/your-feature-name`
2. Commit your changes following conventional commit syntax.
3. Push to your fork: `git push origin feat/your-feature-name`
4. Open a Pull Request using the repository's [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
