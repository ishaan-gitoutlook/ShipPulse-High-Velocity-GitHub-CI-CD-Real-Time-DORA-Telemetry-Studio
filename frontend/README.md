# ShipPulse - Angular 21 Enterprise Frontend

The frontend of ShipPulse is an enterprise-grade Single Page Application (SPA) with Server-Side Rendering (SSR) built using **Angular 21**, **Angular Signals**, **Angular Material**, and **Tailwind CSS v4**.

---

## 🏗️ Architecture Overview

- **Framework**: Angular 21 with `@angular/ssr` and Node.js server bundle.
- **State Management**: Reactive Angular Signals (`signal`, `computed`, `effect`) ensuring granular change detection and optimal runtime performance.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` with dark-mode first enterprise aesthetics and smooth micro-animations.
- **API Integration**: Reverse-proxied via `proxy.conf.json` forwarding all `/api/*` calls to the Python API Gateway at `http://localhost:5000`.

---

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/      # UI components (dashboard, workflow editor, pipeline monitor)
│   │   ├── services/        # API clients, GitHub OAuth, WebSocket telemetry
│   │   ├── models/          # TypeScript domain interfaces and types
│   │   ├── app.config.ts    # Application dependency injection configuration
│   │   ├── app.routes.ts    # Client and SSR route definitions
│   │   └── app.ts           # Root shell component
│   ├── index.html           # HTML5 document template
│   ├── main.ts              # Client browser bootstrap entry point
│   ├── main.server.ts       # SSR engine bootstrap entry point
│   ├── server.ts            # Node.js Express server for production SSR
│   └── styles.css           # Global stylesheet and Tailwind directives
├── public/                  # Static assets, icons, and fonts
├── angular.json             # Angular CLI workspace build & budget configurations
├── eslint.config.js         # Flat ESLint rules configuration
├── proxy.conf.json          # Dev server reverse proxy configuration
├── tsconfig.json            # Base TypeScript compiler settings
├── tsconfig.app.json        # Application compilation settings
├── tsconfig.spec.json       # Vitest unit testing compiler settings
├── Dockerfile               # Production multi-stage Docker container
└── package.json             # Dependencies and build scripts
```

---

## 🛠️ Development Scripts

Run these scripts from within the `frontend/` directory (or from root via `npm --prefix frontend <script>`):

```bash
# Start Angular SSR dev server on http://localhost:3000
npm run dev

# Run ESLint validation (0 errors, 0 warnings required)
npm run lint

# Automatically fix fixable ESLint issues
npm run lint:fix

# Run strict TypeScript typecheck without emitting bundles
npm run typecheck

# Run unit tests via Vitest
npm test

# Run tests in continuous watch mode
npm run test:watch

# Compile production client bundles & SSR server
npm run build

# Start the compiled production SSR server
npm run serve:ssr
```

---

## 🔌 API Gateway Proxy

In local development, the Angular dev server automatically proxies API requests to the Python API Gateway:

```json
{
  "/api": {
    "target": "http://localhost:5000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "info"
  }
}
```

Ensure the Python API Gateway is running on port `5000` (or start both frontend and backend simultaneously using `npm run dev` from the repository root).
