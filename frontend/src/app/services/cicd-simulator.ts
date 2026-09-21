import { Injectable, signal, computed } from '@angular/core';

export type SimulationStatus = 'idle' | 'running' | 'success' | 'failed' | 'cancelled';

export interface SimulatedStep {
  id: string;
  name: string;
  commandOrAction: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  durationMs: number;
  logs: LogLine[];
  exitCode?: number;
}

export interface LogLine {
  text: string;
  type: 'stdout' | 'stderr' | 'info' | 'warn' | 'success' | 'debug';
  timestamp: string;
}

export type ChaosScenario = 
  | 'none'
  | 'flaky_test'
  | 'missing_secret'
  | 'npm_timeout'
  | 'docker_oom'
  | 'lint_failure'
  | 'cert_expired';

export interface ChaosOption {
  id: ChaosScenario;
  title: string;
  description: string;
  targetStep: string;
  remediationTip: string;
  icon: string;
}

export interface SimulationResult {
  workflowName: string;
  durationMs: number;
  status: 'success' | 'failed';
  failedStepName?: string;
  failureReason?: string;
  remediationAdvice?: string;
  stepsSummary: { total: number; passed: number; failed: number; skipped: number };
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class CicdSimulatorService {
  status = signal<SimulationStatus>('idle');
  currentStepIndex = signal<number>(-1);
  steps = signal<SimulatedStep[]>([]);
  activeChaos = signal<ChaosScenario>('none');
  simulationSpeed = signal<number>(1); // 1x, 2x, 4x
  autoRollbackTriggered = signal<boolean>(false);
  lastResult = signal<SimulationResult | null>(null);

  readonly chaosScenarios: ChaosOption[] = [
    {
      id: 'none',
      title: 'Nominal (Happy Path)',
      description: 'Standard flawless build, test, and production deployment execution.',
      targetStep: 'None',
      remediationTip: 'All workflow steps will complete with exit code 0.',
      icon: 'check_circle'
    },
    {
      id: 'flaky_test',
      title: 'Flaky Unit/E2E Test Failure',
      description: 'Simulates Jest / Vitest assertion failure in "Run test suite" step.',
      targetStep: 'Run test suite',
      remediationTip: 'Use retry policies or fix unstable asynchronous assertions before merging.',
      icon: 'bug_report'
    },
    {
      id: 'missing_secret',
      title: 'Missing GitHub Secret / Auth Token',
      description: 'Simulates production deployment step failing due to empty ${{ secrets.DEPLOY_TOKEN }}.',
      targetStep: 'Deploy to Cloud',
      remediationTip: 'Verify repository secrets in Settings > Secrets and variables > Actions.',
      icon: 'key_off'
    },
    {
      id: 'npm_timeout',
      title: 'Package Registry Network 504 Timeout',
      description: 'Simulates npm/yarn registry connection timeout during dependency installation.',
      targetStep: 'Install dependencies',
      remediationTip: 'Add actions/cache@v4 caching to bypass upstream registry network flakes.',
      icon: 'wifi_off'
    },
    {
      id: 'docker_oom',
      title: 'Docker Build Daemon Out-of-Memory',
      description: 'Simulates runner container running out of RAM during multi-stage Docker build.',
      targetStep: 'Build container image',
      remediationTip: 'Enable BuildKit caching or switch to a larger GitHub-hosted runner (e.g. 4-core).',
      icon: 'memory'
    },
    {
      id: 'lint_failure',
      title: 'Strict Linter / Type-Check Violation',
      description: 'Simulates TypeScript compilation or ESLint fatal error.',
      targetStep: 'Lint & Typecheck',
      remediationTip: 'Run "npm run lint -- --fix" locally or configure workflow pre-commit hooks.',
      icon: 'rule'
    },
    {
      id: 'cert_expired',
      title: 'Expired Cloud TLS Certificate',
      description: 'Simulates SSL handshake verification failure while connecting to cloud deployment target.',
      targetStep: 'Deploy to Cloud',
      remediationTip: 'Renew server certificate or verify custom domain DNS propagation.',
      icon: 'security_update_warning'
    }
  ];

  totalStepsCount = computed(() => this.steps().length);
  completedStepsCount = computed(() => this.steps().filter(s => s.status === 'success').length);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Generate steps based on parsed YAML or standard template
  generateStepsFromYaml(yamlText: string, envVars?: { key: string; value: string; isSecret?: boolean }[]): SimulatedStep[] {
    const defaultSteps: SimulatedStep[] = [
      {
        id: 's1',
        name: 'Set up job runner & checkout code',
        commandOrAction: 'actions/checkout@v4',
        status: 'pending',
        durationMs: 0,
        logs: envVars && envVars.length > 0
          ? [{
              text: `Context initialized with ${envVars.length} repository variable(s)/secret(s).`,
              type: 'info' as const,
              timestamp: '00:00:01'
            }]
          : []
      },
      {
        id: 's2',
        name: 'Setup runtime environment (Node.js/Python/Go)',
        commandOrAction: 'actions/setup-node@v4',
        status: 'pending',
        durationMs: 0,
        logs: []
      },
      {
        id: 's3',
        name: 'Install dependencies',
        commandOrAction: 'npm ci --prefer-offline',
        status: 'pending',
        durationMs: 0,
        logs: []
      },
      {
        id: 's4',
        name: 'Lint & Typecheck',
        commandOrAction: 'npm run lint && tsc --noEmit',
        status: 'pending',
        durationMs: 0,
        logs: []
      },
      {
        id: 's5',
        name: 'Run test suite',
        commandOrAction: 'npm test -- --coverage',
        status: 'pending',
        durationMs: 0,
        logs: []
      },
      {
        id: 's6',
        name: 'Build production bundle / container',
        commandOrAction: 'npm run build',
        status: 'pending',
        durationMs: 0,
        logs: []
      },
      {
        id: 's7',
        name: 'Deploy to Cloud / Production target',
        commandOrAction: 'google-github-actions/deploy-cloudrun@v2',
        status: 'pending',
        durationMs: 0,
        logs: []
      }
    ];

    // If Docker or custom template found, tweak step names
    if (yamlText.includes('docker') || yamlText.includes('build-push-action')) {
      defaultSteps[5].name = 'Build container image';
      defaultSteps[5].commandOrAction = 'docker build -t app:v1 .';
    }

    return defaultSteps;
  }

  startSimulation(steps: SimulatedStep[], chaos: ChaosScenario = 'none', speedMultiplier = 1) {
    this.stopSimulation();
    this.activeChaos.set(chaos);
    this.simulationSpeed.set(speedMultiplier);
    this.autoRollbackTriggered.set(false);
    this.status.set('running');
    this.currentStepIndex.set(0);

    const freshSteps: SimulatedStep[] = steps.map(s => ({
      ...s,
      status: 'pending',
      durationMs: 0,
      logs: []
    }));

    this.steps.set(freshSteps);
    this.executeStep(0);
  }

  private executeStep(index: number) {
    const currentSteps = [...this.steps()];
    if (index >= currentSteps.length) {
      // All steps passed successfully!
      this.status.set('success');
      this.currentStepIndex.set(-1);
      const totalDur = currentSteps.reduce((a, b) => a + b.durationMs, 0);
      this.lastResult.set({
        workflowName: 'CI/CD Automated Deployment',
        durationMs: totalDur,
        status: 'success',
        stepsSummary: {
          total: currentSteps.length,
          passed: currentSteps.length,
          failed: 0,
          skipped: 0
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const step = currentSteps[index];
    step.status = 'running';
    this.currentStepIndex.set(index);
    this.steps.set([...currentSteps]);

    const chaos = this.activeChaos();
    const shouldFail = this.checkShouldFail(step, chaos);

    const stepLogs = this.generateStepLogs(step, shouldFail, chaos);
    let logIndex = 0;
    const baseInterval = 120 / this.simulationSpeed();

    this.intervalId = setInterval(() => {
      if (logIndex < stepLogs.length) {
        step.logs.push(stepLogs[logIndex]);
        step.durationMs += Math.round(baseInterval * 1.5);
        this.steps.set([...this.steps()]);
        logIndex++;
      } else {
        if (this.intervalId !== null) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }

        if (shouldFail) {
          step.status = 'failed';
          step.exitCode = 1;
          this.status.set('failed');
          this.currentStepIndex.set(-1);

          // Mark remaining steps as skipped
          for (let k = index + 1; k < currentSteps.length; k++) {
            currentSteps[k].status = 'skipped';
          }
          this.steps.set([...currentSteps]);

          const failureReason = this.getFailureReason(chaos);
          const advice = this.getRemediationAdvice(chaos);

          this.lastResult.set({
            workflowName: 'CI/CD Automated Deployment',
            durationMs: currentSteps.reduce((a, b) => a + b.durationMs, 0),
            status: 'failed',
            failedStepName: step.name,
            failureReason,
            remediationAdvice: advice,
            stepsSummary: {
              total: currentSteps.length,
              passed: index,
              failed: 1,
              skipped: currentSteps.length - index - 1
            },
            timestamp: new Date().toISOString()
          });

        } else {
          step.status = 'success';
          step.exitCode = 0;
          this.steps.set([...currentSteps]);
          // Next step
          this.executeStep(index + 1);
        }
      }
    }, baseInterval);
  }

  stopSimulation() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.status() === 'running') {
      this.status.set('cancelled');
    }
  }

  reset() {
    this.stopSimulation();
    this.status.set('idle');
    this.currentStepIndex.set(-1);
    this.steps.update(steps => steps.map(s => ({ ...s, status: 'pending', durationMs: 0, logs: [] })));
    this.lastResult.set(null);
  }

  triggerAutoRollback() {
    this.autoRollbackTriggered.set(true);
  }

  private checkShouldFail(step: SimulatedStep, chaos: ChaosScenario): boolean {
    if (chaos === 'none') return false;
    if (chaos === 'flaky_test' && step.name.includes('test')) return true;
    if (chaos === 'missing_secret' && (step.name.includes('Deploy') || step.name.includes('Cloud'))) return true;
    if (chaos === 'npm_timeout' && step.name.includes('dependencies')) return true;
    if (chaos === 'docker_oom' && (step.name.includes('Build') || step.name.includes('container'))) return true;
    if (chaos === 'lint_failure' && step.name.includes('Lint')) return true;
    if (chaos === 'cert_expired' && (step.name.includes('Deploy') || step.name.includes('Cloud'))) return true;
    return false;
  }

  private generateStepLogs(step: SimulatedStep, willFail: boolean, chaos: ChaosScenario): LogLine[] {
    const now = () => new Date().toISOString().substring(11, 19);
    const logs: LogLine[] = [
      { text: `[runner] Initializing step: "${step.name}"`, type: 'info', timestamp: now() },
      { text: `[runner] Executing: ${step.commandOrAction}`, type: 'debug', timestamp: now() }
    ];

    if (step.commandOrAction.includes('actions/checkout')) {
      logs.push(
        { text: 'Syncing repository with commit sha 8f1e29c on refs/heads/main', type: 'stdout', timestamp: now() },
        { text: 'Fetching 1 commit (depth 1)...', type: 'stdout', timestamp: now() },
        { text: 'HEAD is now at 8f1e29c "feat: pipeline release v2.0"', type: 'success', timestamp: now() }
      );
    } else if (step.name.includes('Setup runtime')) {
      logs.push(
        { text: 'Found toolcache for Node.js 22.11.0 (x64)', type: 'stdout', timestamp: now() },
        { text: 'Adding /opt/hostedtoolcache/node/22.11.0/x64/bin to PATH', type: 'stdout', timestamp: now() },
        { text: 'node -v => v22.11.0', type: 'success', timestamp: now() },
        { text: 'npm -v => 10.9.0', type: 'success', timestamp: now() }
      );
    } else if (step.name.includes('dependencies')) {
      if (willFail && chaos === 'npm_timeout') {
        logs.push(
          { text: 'npm info using npm@10.9.0', type: 'stdout', timestamp: now() },
          { text: 'npm http fetch GET 504 https://registry.npmjs.org/@angular/core 30012ms (ETIMEDOUT)', type: 'stderr', timestamp: now() },
          { text: 'npm ERR! code ETIMEDOUT', type: 'stderr', timestamp: now() },
          { text: 'npm ERR! syscall connect ETIMEDOUT 104.16.27.35:443', type: 'stderr', timestamp: now() },
          { text: 'npm ERR! A complete log of this run can be found in: /home/runner/.npm/_logs', type: 'stderr', timestamp: now() }
        );
      } else {
        logs.push(
          { text: 'Restoring cache key: npm-linux-x64-539af827...', type: 'stdout', timestamp: now() },
          { text: 'Cache hit! Restored 482 MB in 1.4s', type: 'info', timestamp: now() },
          { text: 'added 942 packages in 3.12s', type: 'success', timestamp: now() }
        );
      }
    } else if (step.name.includes('Lint')) {
      if (willFail && chaos === 'lint_failure') {
        logs.push(
          { text: '> ng lint', type: 'stdout', timestamp: now() },
          { text: 'src/app/auth.service.ts:42:15 - error TS2322: Type "undefined" is not assignable to type "string".', type: 'stderr', timestamp: now() },
          { text: 'src/app/config.ts:18:1 - error @typescript-eslint/no-explicit-any: Unexpected any type.', type: 'stderr', timestamp: now() },
          { text: 'Lint failed with 2 errors and 0 warnings.', type: 'stderr', timestamp: now() }
        );
      } else {
        logs.push(
          { text: '> ng lint && tsc --noEmit', type: 'stdout', timestamp: now() },
          { text: 'All 64 TypeScript source files passed strict type checking.', type: 'success', timestamp: now() },
          { text: 'Linting completed with 0 errors.', type: 'success', timestamp: now() }
        );
      }
    } else if (step.name.includes('test')) {
      if (willFail && chaos === 'flaky_test') {
        logs.push(
          { text: 'PASS src/app/services/auth.spec.ts', type: 'stdout', timestamp: now() },
          { text: 'FAIL src/app/services/payment.spec.ts', type: 'stderr', timestamp: now() },
          { text: '  ● PaymentGateway › should capture checkout order within timeout', type: 'stderr', timestamp: now() },
          { text: '    Expected: "success_200"', type: 'stderr', timestamp: now() },
          { text: '    Received: "timeout_408"', type: 'stderr', timestamp: now() },
          { text: '    at Object.<anonymous> (src/app/services/payment.spec.ts:88:21)', type: 'stderr', timestamp: now() },
          { text: 'Tests: 1 failed, 48 passed, 49 total', type: 'stderr', timestamp: now() }
        );
      } else {
        logs.push(
          { text: 'RUNS Jest test runner with coverage...', type: 'stdout', timestamp: now() },
          { text: 'PASS src/app/components/workflow.spec.ts (1.8s)', type: 'stdout', timestamp: now() },
          { text: 'PASS src/app/services/validator.spec.ts (0.9s)', type: 'stdout', timestamp: now() },
          { text: 'All 52 unit tests passed. Code coverage: 94.6%', type: 'success', timestamp: now() }
        );
      }
    } else if (step.name.includes('Build') || step.name.includes('container')) {
      if (willFail && chaos === 'docker_oom') {
        logs.push(
          { text: '[1/4] FROM node:22-alpine AS builder', type: 'stdout', timestamp: now() },
          { text: '[2/4] RUN npm run build:prod', type: 'stdout', timestamp: now() },
          { text: '<--- Last few GCs --->', type: 'stderr', timestamp: now() },
          { text: '[142:0x6b10000] 45200 ms: Mark-sweep 2048.0 (2080.0) -> 2048.0 MB', type: 'stderr', timestamp: now() },
          { text: 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory', type: 'stderr', timestamp: now() },
          { text: 'The command "/bin/sh -c npm run build:prod" returned a non-zero code: 137 (OOM Killed)', type: 'stderr', timestamp: now() }
        );
      } else {
        logs.push(
          { text: 'Bundling application for production target...', type: 'stdout', timestamp: now() },
          { text: 'Output: dist/app (284 kB gzip)', type: 'stdout', timestamp: now() },
          { text: 'Build artifact successfully packed and verified.', type: 'success', timestamp: now() }
        );
      }
    } else if (step.name.includes('Deploy') || step.name.includes('Cloud')) {
      if (willFail && chaos === 'missing_secret') {
        logs.push(
          { text: 'Authenticating with Google Cloud Service Account...', type: 'stdout', timestamp: now() },
          { text: 'Error: Credentials secret "${{ secrets.GCP_SA_KEY }}" was evaluated as empty or null.', type: 'stderr', timestamp: now() },
          { text: 'Cannot authenticate API request without a valid private key.', type: 'stderr', timestamp: now() },
          { text: 'Action failed: deploy-cloudrun@v2 exited with code 1', type: 'stderr', timestamp: now() }
        );
      } else if (willFail && chaos === 'cert_expired') {
        logs.push(
          { text: 'Initiating deployment handshake to api.production.internal...', type: 'stdout', timestamp: now() },
          { text: 'SSL certificate verification failed: certificate has expired (SEC_ERROR_EXPIRED_CERTIFICATE)', type: 'stderr', timestamp: now() },
          { text: 'Deployment aborted for security compliance.', type: 'stderr', timestamp: now() }
        );
      } else {
        logs.push(
          { text: 'Pushing image to artifact registry: asia-southeast1-docker.pkg.dev/proj/app:8f1e29c', type: 'stdout', timestamp: now() },
          { text: 'Revision app-00042 deployed to Cloud Run service.', type: 'stdout', timestamp: now() },
          { text: 'Traffic routed: 100% -> app-00042. Health check OK (200).', type: 'success', timestamp: now() },
          { text: 'Production deployment completed in 24.1s', type: 'success', timestamp: now() }
        );
      }
    }

    return logs;
  }

  private getFailureReason(chaos: ChaosScenario): string {
    switch (chaos) {
      case 'flaky_test': return 'Assertion failed in unit test suite (PaymentGateway.spec.ts)';
      case 'missing_secret': return 'Missing required secret: ${{ secrets.GCP_SA_KEY }} was empty';
      case 'npm_timeout': return 'Network ETIMEDOUT fetching packages from registry.npmjs.org';
      case 'docker_oom': return 'Container runner ran out of RAM memory (Exit Code 137 OOM)';
      case 'lint_failure': return 'Strict TypeScript compiler error TS2322 in source files';
      case 'cert_expired': return 'Target cloud endpoint TLS certificate has expired';
      default: return 'Step exited with unexpected non-zero code';
    }
  }

  private getRemediationAdvice(chaos: ChaosScenario): string {
    switch (chaos) {
      case 'flaky_test': return 'Fix asynchronous race conditions in tests or wrap flaky integration tests in a retry harness.';
      case 'missing_secret': return 'Go to GitHub Repo Settings > Secrets & Variables > Actions, and populate GCP_SA_KEY.';
      case 'npm_timeout': return 'Inject actions/cache@v4 in workflow YAML to serve dependencies from fast GitHub edge cache.';
      case 'docker_oom': return 'Increase Node.js memory ceiling: NODE_OPTIONS="--max-old-space-size=4096" or use a 4-core runner.';
      case 'lint_failure': return 'Run "npm run lint -- --fix" and ensure all TypeScript types are strictly declared without any.';
      case 'cert_expired': return 'Renew Let\'s Encrypt / Google Cloud Managed SSL certificate on the target domain.';
      default: return 'Review the full step logs above to identify the root error code.';
    }
  }
}
