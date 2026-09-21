import { Injectable, signal, computed } from '@angular/core';

export interface RunnerCostEstimate {
  os: 'ubuntu' | 'windows' | 'macos';
  ratePerMinute: number;
  buildsPerDay: number;
  avgDurationMins: number;
  matrixJobsCount: number;
  monthlyMinutes: number;
  monthlyCostUsd: number;
  annualCostUsd: number;
  estimatedWithCacheMins: number;
  estimatedWithCacheCostUsd: number;
  monthlySavingsUsd: number;
}

export interface CachingRecommendation {
  ecosystem: string;
  detectedFiles: string[];
  recommendedAction: string;
  yamlSnippet: string;
  estimatedTimeSavedSec: number;
  priority: 'high' | 'medium' | 'low';
  explanation: string;
}

export interface AiWorkflowPatch {
  id: string;
  title: string;
  category: 'performance' | 'security' | 'cost' | 'resilience';
  description: string;
  impact: string;
  applied: boolean;
  diffExplanation: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowOptimizerService {
  // Forecaster state
  osType = signal<'ubuntu' | 'windows' | 'macos'>('ubuntu');
  buildsPerDay = signal<number>(18);
  avgDurationMins = signal<number>(4.5);
  matrixJobsCount = signal<number>(1);
  repoType = signal<'public' | 'private'>('private');

  costEstimate = computed<RunnerCostEstimate>(() => {
    const os = this.osType();
    const bpd = this.buildsPerDay();
    const dur = this.avgDurationMins();
    const matrix = this.matrixJobsCount();
    
    let ratePerMin = 0.008; // Ubuntu standard
    if (os === 'windows') ratePerMin = 0.016;
    if (os === 'macos') ratePerMin = 0.080;

    const monthlyBuilds = bpd * 30.5;
    const totalMinutes = Math.round(monthlyBuilds * dur * matrix);
    
    // Free tier deduction (2,000 mins for private repos)
    const billableMins = this.repoType() === 'public' ? 0 : Math.max(0, totalMinutes - 2000);
    const monthlyCost = parseFloat((billableMins * ratePerMin).toFixed(2));
    const annualCost = parseFloat((monthlyCost * 12).toFixed(2));

    // With aggressive caching: ~55% reduction in runtime
    const cacheDur = dur * 0.45;
    const cacheMins = Math.round(monthlyBuilds * cacheDur * matrix);
    const cacheBillable = this.repoType() === 'public' ? 0 : Math.max(0, cacheMins - 2000);
    const cacheCost = parseFloat((cacheBillable * ratePerMin).toFixed(2));
    const savings = parseFloat(Math.max(0, monthlyCost - cacheCost).toFixed(2));

    return {
      os,
      ratePerMinute: ratePerMin,
      buildsPerDay: bpd,
      avgDurationMins: dur,
      matrixJobsCount: matrix,
      monthlyMinutes: totalMinutes,
      monthlyCostUsd: monthlyCost,
      annualCostUsd: annualCost,
      estimatedWithCacheMins: cacheMins,
      estimatedWithCacheCostUsd: cacheCost,
      monthlySavingsUsd: savings
    };
  });

  // Analyze YAML for Caching opportunities
  detectCachingOpportunities(yamlText: string): CachingRecommendation[] {
    const recommendations: CachingRecommendation[] = [];

    // 1. Node / NPM / Yarn / PNPM
    if (yamlText.includes('npm') || yamlText.includes('node') || yamlText.includes('package.json')) {
      if (!yamlText.includes('actions/cache') && !yamlText.includes('cache:')) {
        recommendations.push({
          ecosystem: 'Node.js (NPM Cache)',
          detectedFiles: ['package.json', 'package-lock.json'],
          recommendedAction: 'actions/cache@v4 or setup-node cache',
          yamlSnippet: `      - name: Cache Node.js modules
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            \${{ runner.os }}-node-`,
          estimatedTimeSavedSec: 45,
          priority: 'high',
          explanation: 'Bypasses downloading 900+ node_modules on every commit, dropping install step from 55s to 4s.'
        });
      }
    }

    // 2. Python / Pip / Poetry
    if (yamlText.includes('python') || yamlText.includes('pip') || yamlText.includes('requirements.txt')) {
      if (!yamlText.includes('actions/cache') && !yamlText.includes('cache:')) {
        recommendations.push({
          ecosystem: 'Python (Pip Wheels Cache)',
          detectedFiles: ['requirements.txt', 'pyproject.toml'],
          recommendedAction: 'actions/cache@v4',
          yamlSnippet: `      - name: Cache Pip Wheels
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: \${{ runner.os }}-pip-\${{ hashFiles('**/requirements.txt') }}
          restore-keys: |
            \${{ runner.os }}-pip-`,
          estimatedTimeSavedSec: 60,
          priority: 'high',
          explanation: 'Reuses compiled binary C-extensions and pre-downloaded wheels, speeding up virtualenv bootstrap.'
        });
      }
    }

    // 3. Docker Layer Caching
    if (yamlText.includes('docker') || yamlText.includes('build-push-action')) {
      if (!yamlText.includes('cache-from: type=gha')) {
        recommendations.push({
          ecosystem: 'Docker Buildx (GitHub Actions Layer Cache)',
          detectedFiles: ['Dockerfile'],
          recommendedAction: 'docker/build-push-action GHA layer caching',
          yamlSnippet: `      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ env.IMAGE_TAG }}
          cache-from: type=gha
          cache-to: type=gha,mode=max`,
          estimatedTimeSavedSec: 90,
          priority: 'high',
          explanation: 'Stores intermediate container layers in GitHub Actions cache, skipping unchanged RUN steps.'
        });
      }
    }

    // 4. Golang Build Cache
    if (yamlText.includes('go') || yamlText.includes('go.mod')) {
      if (!yamlText.includes('actions/cache') && !yamlText.includes('cache:')) {
        recommendations.push({
          ecosystem: 'Golang (Pkg Mod & Build Cache)',
          detectedFiles: ['go.mod', 'go.sum'],
          recommendedAction: 'actions/cache@v4',
          yamlSnippet: `      - name: Cache Go build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cache/go-build
            ~/go/pkg/mod
          key: \${{ runner.os }}-go-\${{ hashFiles('**/go.sum') }}
          restore-keys: |
            \${{ runner.os }}-go-`,
          estimatedTimeSavedSec: 35,
          priority: 'medium',
          explanation: 'Caches downloaded Go modules and compiled package binaries.'
        });
      }
    }

    return recommendations;
  }

  // Generate list of available AI patches for a given workflow
  getAvailablePatches(yamlText: string): AiWorkflowPatch[] {
    const patches: AiWorkflowPatch[] = [];

    // Patch 1: Add concurrency cancellation
    if (!yamlText.includes('concurrency:')) {
      patches.push({
        id: 'patch-concurrency',
        title: 'Add Concurrency Auto-Cancellation',
        category: 'cost',
        description: 'Automatically cancels obsolete in-flight pipeline runs when new commits are pushed to the same branch.',
        impact: 'Saves ~25% unnecessary runner minutes on active pull requests.',
        applied: false,
        diffExplanation: 'Injects top-level "concurrency: group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true"'
      });
    }

    // Patch 2: Add least privilege permissions
    if (!yamlText.includes('permissions:')) {
      patches.push({
        id: 'patch-permissions',
        title: 'Enforce Least-Privilege Permissions',
        category: 'security',
        description: 'Restricts default GITHUB_TOKEN scope to read-only for contents to block token theft.',
        impact: 'Complies with SLSA Level 2 and OpenSSF Scorecard requirements.',
        applied: false,
        diffExplanation: 'Injects top-level "permissions: contents: read"'
      });
    }

    // Patch 3: Add job timeout limits
    if (!yamlText.includes('timeout-minutes:')) {
      patches.push({
        id: 'patch-timeout',
        title: 'Add Job Execution Timeout Limits',
        category: 'resilience',
        description: 'Sets a 15-minute ceiling on workflow jobs to prevent hung test runners from maxing out billing limits.',
        impact: 'Protects against infinite loop freezes and accidental runner exhaustion.',
        applied: false,
        diffExplanation: 'Injects "timeout-minutes: 15" on active jobs'
      });
    }

    // Patch 4: Add dependency caching
    if (!yamlText.includes('actions/cache') && (yamlText.includes('npm') || yamlText.includes('node'))) {
      patches.push({
        id: 'patch-caching',
        title: 'Inject Multi-Tier NPM Caching',
        category: 'performance',
        description: 'Injects actions/cache@v4 before "npm ci" to accelerate dependency resolution.',
        impact: 'Reduces typical pipeline duration by 40–60 seconds per run.',
        applied: false,
        diffExplanation: 'Inserts actions/cache@v4 step before dependency install'
      });
    }

    return patches;
  }

  // Apply a selected patch to YAML string
  applyPatchToYaml(yamlText: string, patchId: string): string {
    let result = yamlText;

    if (patchId === 'patch-concurrency') {
      if (!result.includes('concurrency:')) {
        const lines = result.split('\n');
        // Insert after name: or on:
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('on:') || lines[i].startsWith('name:')) {
            insertIndex = i + 1;
          }
          if (lines[i].startsWith('jobs:')) {
            insertIndex = i;
            break;
          }
        }
        lines.splice(insertIndex, 0, 
          'concurrency:',
          '  group: ${{ github.workflow }}-${{ github.ref }}',
          '  cancel-in-progress: true',
          ''
        );
        result = lines.join('\n');
      }
    }

    if (patchId === 'patch-permissions') {
      if (!result.includes('permissions:')) {
        const lines = result.split('\n');
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('jobs:')) {
            insertIndex = i;
            break;
          }
        }
        lines.splice(insertIndex, 0,
          'permissions:',
          '  contents: read',
          ''
        );
        result = lines.join('\n');
      }
    }

    if (patchId === 'patch-timeout') {
      // Find job header and insert timeout-minutes: 15
      result = result.replace(/(runs-on:\s*ubuntu-latest)/g, '$1\n    timeout-minutes: 15');
    }

    if (patchId === 'patch-caching') {
      // Find npm ci / npm install step and prepend cache step
      const cacheStep = `      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: \${{ runner.os }}-node-\${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            \${{ runner.os }}-node-\n\n`;

      if (result.includes('npm ci') || result.includes('npm install')) {
        const pos = result.indexOf('      - name: Install');
        if (pos !== -1) {
          result = result.substring(0, pos) + cacheStep + result.substring(pos);
        } else {
          const runPos = result.indexOf('run: npm');
          if (runPos !== -1) {
            const stepStart = result.lastIndexOf('      - name:', runPos);
            if (stepStart !== -1) {
              result = result.substring(0, stepStart) + cacheStep + result.substring(stepStart);
            }
          }
        }
      }
    }

    return result;
  }
}
