import { Injectable, signal } from '@angular/core';

export interface WorkflowEnvVarSnapshot {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

export type RevisionSource = 'committed' | 'manual_snapshot' | 'template_switch' | 'rollback';

export interface WorkflowRevision {
  id: string;
  version: number;
  timestamp: string; // ISO
  formattedDate: string;
  repository: string;
  branch: string;
  filePath: string;
  templateId: string;
  templateName: string;
  commitMessage: string;
  author: string;
  yamlContent: string;
  envVars: WorkflowEnvVarSnapshot[];
  healthScore: number;
  securityRating: string;
  errorsCount: number;
  warningsCount: number;
  jobsCount: number;
  linesCount: number;
  triggers: string[];
  source: RevisionSource;
  tag?: string;
  addedLinesCount?: number;
  removedLinesCount?: number;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffSummary {
  lines: DiffLine[];
  additions: number;
  deletions: number;
  changesCount: number;
  identical: boolean;
}

const STORAGE_KEY = 'shippulse_workflow_history_v2';
const LEGACY_STORAGE_KEY = 'autodeploy_workflow_history_v2';

@Injectable({
  providedIn: 'root'
})
export class WorkflowHistoryService {
  private revisionsSignal = signal<WorkflowRevision[]>([]);
  readonly revisions = this.revisionsSignal.asReadonly();

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.revisionsSignal.set(parsed);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load workflow history from localStorage:', err);
      }
    }

    // Seed default baseline revisions
    const initialSeeds = this.generateInitialSeeds();
    this.revisionsSignal.set(initialSeeds);
    this.persistHistory(initialSeeds);
  }

  private persistHistory(list: WorkflowRevision[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.warn('Failed to persist workflow history to localStorage:', err);
      }
    }
  }

  getRevisionsForRepo(repoName: string): WorkflowRevision[] {
    const clean = repoName.includes('/') ? repoName.split('/')[1] : repoName;
    return this.revisionsSignal().filter(r => {
      const rClean = r.repository.includes('/') ? r.repository.split('/')[1] : r.repository;
      return rClean.toLowerCase() === clean.toLowerCase();
    });
  }

  addRevision(params: {
    repository: string;
    branch: string;
    filePath: string;
    templateId: string;
    templateName: string;
    commitMessage: string;
    yamlContent: string;
    envVars: WorkflowEnvVarSnapshot[];
    healthScore: number;
    securityRating: string;
    errorsCount: number;
    warningsCount: number;
    jobsCount: number;
    triggers: string[];
    source: RevisionSource;
    author?: string;
    tag?: string;
  }): WorkflowRevision {
    const cleanRepo = params.repository.includes('/') ? params.repository.split('/')[1] : params.repository;
    const existingRepoRevs = this.getRevisionsForRepo(cleanRepo);
    const nextVersion = existingRepoRevs.length > 0 ? Math.max(...existingRepoRevs.map(r => r.version)) + 1 : 1;

    const previousRev = existingRepoRevs[0]; // Most recent
    let additions = 0;
    let deletions = 0;
    if (previousRev) {
      const diff = this.computeDiff(previousRev.yamlContent, params.yamlContent);
      additions = diff.additions;
      deletions = diff.deletions;
    } else {
      additions = (params.yamlContent || '').split('\n').length;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newRev: WorkflowRevision = {
      id: 'wf-rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      version: nextVersion,
      timestamp: now.toISOString(),
      formattedDate,
      repository: cleanRepo,
      branch: params.branch || 'main',
      filePath: params.filePath || '.github/workflows/deploy.yml',
      templateId: params.templateId,
      templateName: params.templateName,
      commitMessage: params.commitMessage || `ci: update deployment workflow (v${nextVersion})`,
      author: params.author || 'ishaan-gitoutlook',
      yamlContent: params.yamlContent,
      envVars: JSON.parse(JSON.stringify(params.envVars || [])),
      healthScore: params.healthScore,
      securityRating: params.securityRating,
      errorsCount: params.errorsCount,
      warningsCount: params.warningsCount,
      jobsCount: params.jobsCount,
      linesCount: (params.yamlContent || '').split('\n').length,
      triggers: params.triggers,
      source: params.source,
      tag: params.tag || (params.source === 'committed' ? `v${nextVersion} (Committed)` : `Snapshot v${nextVersion}`),
      addedLinesCount: additions,
      removedLinesCount: deletions
    };

    const updated = [newRev, ...this.revisionsSignal()];
    this.revisionsSignal.set(updated);
    this.persistHistory(updated);
    return newRev;
  }

  deleteRevision(id: string) {
    const updated = this.revisionsSignal().filter(r => r.id !== id);
    this.revisionsSignal.set(updated);
    this.persistHistory(updated);
  }

  clearRepoHistory(repoName: string) {
    const clean = repoName.includes('/') ? repoName.split('/')[1] : repoName;
    const updated = this.revisionsSignal().filter(r => {
      const rClean = r.repository.includes('/') ? r.repository.split('/')[1] : r.repository;
      return rClean.toLowerCase() !== clean.toLowerCase();
    });
    this.revisionsSignal.set(updated);
    this.persistHistory(updated);
  }

  resetToDefaultSeeds() {
    const seeds = this.generateInitialSeeds();
    this.revisionsSignal.set(seeds);
    this.persistHistory(seeds);
  }

  /**
   * Fast Line-by-Line Diff Engine (Myers/LCS oriented)
   * Computes additions, deletions, and unchanged lines between old and new text.
   */
  computeDiff(oldText: string, newText: string): DiffSummary {
    const oldLines = (oldText || '').split('\n');
    const newLines = (newText || '').split('\n');

    if (oldText === newText) {
      return {
        lines: oldLines.map((line, idx) => ({
          type: 'unchanged',
          oldLineNumber: idx + 1,
          newLineNumber: idx + 1,
          content: line
        })),
        additions: 0,
        deletions: 0,
        changesCount: 0,
        identical: true
      };
    }

    let additions = 0;
    let deletions = 0;

    // LCS helper table
    const matrix: number[][] = [];
    for (let i = 0; i <= oldLines.length; i++) {
      matrix[i] = new Array(newLines.length + 1).fill(0);
    }

    for (let i = 1; i <= oldLines.length; i++) {
      for (let j = 1; j <= newLines.length; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
        }
      }
    }

    let i = oldLines.length;
    let j = newLines.length;
    const tempDiff: DiffLine[] = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        tempDiff.unshift({
          type: 'unchanged',
          oldLineNumber: i,
          newLineNumber: j,
          content: oldLines[i - 1]
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        tempDiff.unshift({
          type: 'added',
          newLineNumber: j,
          content: newLines[j - 1]
        });
        additions++;
        j--;
      } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
        tempDiff.unshift({
          type: 'removed',
          oldLineNumber: i,
          content: oldLines[i - 1]
        });
        deletions++;
        i--;
      }
    }

    return {
      lines: tempDiff,
      additions,
      deletions,
      changesCount: additions + deletions,
      identical: additions === 0 && deletions === 0
    };
  }

  private generateInitialSeeds(): WorkflowRevision[] {
    const date1 = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const date2 = new Date(Date.now() - 18 * 60 * 60 * 1000);
    const date3 = new Date(Date.now() - 2 * 60 * 60 * 1000);

    return [
      {
        id: 'wf-rev-seed-3',
        version: 3,
        timestamp: date3.toISOString(),
        formattedDate: date3.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        repository: 'scientific--calculator-2',
        branch: 'main',
        filePath: '.github/workflows/deploy.yml',
        templateId: 'nodejs',
        templateName: 'Node.js & Full-Stack App',
        commitMessage: 'ci: add encrypted DATABASE_URL and API_SECRET_KEY secrets binding',
        author: 'ishaan-gitoutlook',
        healthScore: 98,
        securityRating: 'A+',
        errorsCount: 0,
        warningsCount: 0,
        jobsCount: 2,
        linesCount: 65,
        triggers: ['push', 'pull_request', 'workflow_dispatch'],
        source: 'committed',
        tag: 'v3 (Current Committed)',
        addedLinesCount: 8,
        removedLinesCount: 2,
        envVars: [
          { id: 'env-1', key: 'NODE_ENV', value: 'production', isSecret: false },
          { id: 'env-2', key: 'PORT', value: '3000', isSecret: false },
          { id: 'env-3', key: 'DATABASE_URL', value: '${{ secrets.DATABASE_URL }}', isSecret: true },
          { id: 'env-4', key: 'API_SECRET_KEY', value: '${{ secrets.API_SECRET_KEY }}', isSecret: true }
        ],
        yamlContent: `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Node.js & Full-Stack Application
# Target Repository: ishaan-gitoutlook/scientific--calculator-2
# ========================================================
name: ShipPulse CI/CD (Node.js App)

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  workflow_dispatch:

env:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: \${{ secrets.DATABASE_URL }}
  API_SECRET_KEY: \${{ secrets.API_SECRET_KEY }}

jobs:
  build-and-test:
    name: 🧪 Unit Tests & Code Quality
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Clean Install Dependencies
        run: npm ci

      - name: 🧪 Execute Test Suite
        run: npm test

  deploy-sandbox:
    name: 🚀 Live Container Deployment
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4

      - name: 🚀 Start Express Microservice
        run: |
          echo "Binding container port 3000..."
          echo "✔ Service live on http://0.0.0.0:3000"
`
      },
      {
        id: 'wf-rev-seed-2',
        version: 2,
        timestamp: date2.toISOString(),
        formattedDate: date2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        repository: 'scientific--calculator-2',
        branch: 'main',
        filePath: '.github/workflows/deploy.yml',
        templateId: 'nodejs',
        templateName: 'Node.js & Full-Stack App',
        commitMessage: 'ci: upgrade action dependencies from actions/checkout@v3 to @v4',
        author: 'ishaan-gitoutlook',
        healthScore: 92,
        securityRating: 'A',
        errorsCount: 0,
        warningsCount: 1,
        jobsCount: 2,
        linesCount: 57,
        triggers: ['push', 'pull_request'],
        source: 'committed',
        tag: 'v2 (Action Upgrade)',
        addedLinesCount: 6,
        removedLinesCount: 4,
        envVars: [
          { id: 'env-1', key: 'NODE_ENV', value: 'production', isSecret: false },
          { id: 'env-2', key: 'PORT', value: '3000', isSecret: false }
        ],
        yamlContent: `# ========================================================
# ShipPulse CI/CD Pipeline
# Target Repository: ishaan-gitoutlook/scientific--calculator-2
# ========================================================
name: ShipPulse CI/CD (Node.js App)

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

env:
  NODE_ENV: production
  PORT: 3000

jobs:
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 📦 Install
        run: npm ci

      - name: 🧪 Test
        run: npm test

  deploy:
    name: 🚀 Deploy Container
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🚀 Deploy Container
        run: echo "Deploying to port 3000..."
`
      },
      {
        id: 'wf-rev-seed-1',
        version: 1,
        timestamp: date1.toISOString(),
        formattedDate: date1.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        repository: 'scientific--calculator-2',
        branch: 'main',
        filePath: '.github/workflows/deploy.yml',
        templateId: 'nodejs',
        templateName: 'Node.js & Full-Stack App',
        commitMessage: 'ci: initial automated CI workflow bootstrap',
        author: 'ishaan-gitoutlook',
        healthScore: 84,
        securityRating: 'B',
        errorsCount: 0,
        warningsCount: 2,
        jobsCount: 1,
        linesCount: 38,
        triggers: ['push'],
        source: 'committed',
        tag: 'v1 (Initial Bootstrap)',
        addedLinesCount: 38,
        removedLinesCount: 0,
        envVars: [
          { id: 'env-1', key: 'PORT', value: '3000', isSecret: false }
        ],
        yamlContent: `name: Initial CI

on:
  push:
    branches: [ "main" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
`
      }
    ];
  }
}
