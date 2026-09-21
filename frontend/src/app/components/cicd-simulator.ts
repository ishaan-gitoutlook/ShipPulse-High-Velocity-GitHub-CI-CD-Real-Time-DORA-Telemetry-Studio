import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CicdSimulatorService, ChaosScenario, LogLine } from '../services/cicd-simulator';
import { DoraMetricsService } from '../services/dora-metrics';

@Component({
  selector: 'app-cicd-simulator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
      
      <!-- Top Header & Controls -->
      <div class="p-5 border-b border-stone-200 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold tracking-tight text-white">CI/CD Virtual Runner & Chaos Sandbox</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-800 text-stone-300 border border-stone-700">
                  DRY RUN ENGINE
                </span>
              </div>
              <p class="text-xs text-stone-400">Simulate end-to-end GitHub Actions runner execution with real-time logs & fault injection.</p>
            </div>
          </div>
        </div>

        <!-- Controls: Chaos Selector + Speed + Run Button -->
        <div class="flex items-center flex-wrap gap-2.5">
          
          <!-- Chaos Fault Injector Selector -->
          <div class="flex items-center gap-1.5 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700">
            <span class="text-stone-400 text-xs font-semibold">Chaos Fault:</span>
            <select 
              [value]="selectedChaos()"
              (change)="onChaosChange($event)"
              class="bg-transparent text-xs font-bold text-amber-300 focus:outline-hidden cursor-pointer">
              @for (sc of simService.chaosScenarios; track sc.id) {
                <option [value]="sc.id" class="bg-stone-900 text-white">{{ sc.title }}</option>
              }
            </select>
          </div>

          <!-- Speed multiplier -->
          <div class="flex items-center bg-stone-800 rounded-xl p-0.5 border border-stone-700 text-xs font-bold">
            <button 
              type="button"
              (click)="selectedSpeed.set(1)"
              [class.bg-stone-700]="selectedSpeed() === 1"
              [class.text-white]="selectedSpeed() === 1"
              [class.text-stone-400]="selectedSpeed() !== 1"
              class="px-2 py-1 rounded-lg transition-colors cursor-pointer">
              1x
            </button>
            <button 
              type="button"
              (click)="selectedSpeed.set(2)"
              [class.bg-stone-700]="selectedSpeed() === 2"
              [class.text-white]="selectedSpeed() === 2"
              [class.text-stone-400]="selectedSpeed() !== 2"
              class="px-2 py-1 rounded-lg transition-colors cursor-pointer">
              2x
            </button>
            <button 
              type="button"
              (click)="selectedSpeed.set(4)"
              [class.bg-stone-700]="selectedSpeed() === 4"
              [class.text-white]="selectedSpeed() === 4"
              [class.text-stone-400]="selectedSpeed() !== 4"
              class="px-2 py-1 rounded-lg transition-colors cursor-pointer">
              4x
            </button>
          </div>

          <!-- Start / Stop Button -->
          @if (simService.status() === 'running') {
            <button 
              type="button"
              (click)="simService.stopSimulation()"
              class="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Abort Run
            </button>
          } @else {
            <button 
              type="button"
              (click)="startRun()"
              class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Simulate Dry Run
            </button>
          }

          <button 
            type="button"
            (click)="simService.reset()"
            title="Reset simulation"
            class="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Active Status Banner -->
      @if (simService.status() !== 'idle') {
        <div 
          [class.bg-blue-50]="simService.status() === 'running'"
          [class.border-blue-200]="simService.status() === 'running'"
          [class.bg-emerald-50]="simService.status() === 'success'"
          [class.border-emerald-200]="simService.status() === 'success'"
          [class.bg-rose-50]="simService.status() === 'failed'"
          [class.border-rose-200]="simService.status() === 'failed'"
          class="px-6 py-2.5 border-b flex items-center justify-between text-xs transition-colors">
          
          <div class="flex items-center gap-3">
            @if (simService.status() === 'running') {
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span class="font-bold text-blue-900">Virtual Runner in progress (Step {{ simService.currentStepIndex() + 1 }} of {{ simService.totalStepsCount() }})...</span>
            } @else if (simService.status() === 'success') {
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span class="font-bold text-emerald-900">All {{ simService.totalStepsCount() }} pipeline steps completed successfully with Exit Code 0!</span>
            } @else if (simService.status() === 'failed') {
              <span class="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span class="font-bold text-rose-900">Pipeline Failed: {{ simService.lastResult()?.failureReason }}</span>
            }
          </div>

          <div class="flex items-center gap-4 text-stone-500 font-mono text-[11px]">
            <span>Passed: <strong class="text-emerald-600">{{ simService.completedStepsCount() }}</strong></span>
            <span>Total Duration: <strong>{{ totalDurationSec() }}s</strong></span>
          </div>
        </div>
      }

      <!-- Main Split View: Steps List (Left) + Terminal Console (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        
        <!-- Left: Step Sequence & Progress -->
        <div class="lg:col-span-5 border-r border-stone-200 p-4 bg-stone-50/50 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Pipeline Execution Steps</span>
              <span class="text-[11px] font-mono text-stone-500">{{ stepsList().length }} steps</span>
            </div>

            <!-- Steps List -->
            <div class="space-y-2">
              @for (step of stepsList(); track step.id; let i = $index) {
                <div 
                  role="button"
                  tabindex="0"
                  (click)="selectedStepIndex.set(i)"
                  (keydown.enter)="selectedStepIndex.set(i)"
                  (keydown.space)="selectedStepIndex.set(i)"
                  [class.ring-2]="selectedStepIndex() === i"
                  [class.ring-stone-900]="selectedStepIndex() === i"
                  [class.bg-white]="selectedStepIndex() === i || step.status === 'running'"
                  [class.bg-stone-100]="selectedStepIndex() !== i && step.status !== 'running'"
                  [class.border-emerald-300]="step.status === 'success'"
                  [class.border-rose-300]="step.status === 'failed'"
                  class="p-3 rounded-2xl border border-stone-200 transition-all cursor-pointer shadow-2xs hover:border-stone-300">
                  
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      
                      <!-- Status Icon -->
                      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        [class.bg-stone-200]="step.status === 'pending'"
                        [class.text-stone-500]="step.status === 'pending'"
                        [class.bg-blue-100]="step.status === 'running'"
                        [class.text-blue-700]="step.status === 'running'"
                        [class.bg-emerald-100]="step.status === 'success'"
                        [class.text-emerald-700]="step.status === 'success'"
                        [class.bg-rose-100]="step.status === 'failed'"
                        [class.text-rose-700]="step.status === 'failed'"
                        [class.bg-stone-100]="step.status === 'skipped'"
                        [class.text-stone-400]="step.status === 'skipped'">
                        
                        @if (step.status === 'pending') {
                          <span>{{ i + 1 }}</span>
                        } @else if (step.status === 'running') {
                          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                          </svg>
                        } @else if (step.status === 'success') {
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        } @else if (step.status === 'failed') {
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        } @else if (step.status === 'skipped') {
                          <span>-</span>
                        }
                      </div>

                      <div class="truncate">
                        <p class="text-xs font-bold text-stone-900 truncate">{{ step.name }}</p>
                        <p class="text-[10px] font-mono text-stone-500 truncate">{{ step.commandOrAction }}</p>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      @if (step.durationMs > 0) {
                        <span class="text-[10px] font-mono text-stone-400 font-semibold">{{ (step.durationMs / 1000).toFixed(1) }}s</span>
                      }
                      <span 
                        [class.text-emerald-600]="step.status === 'success'"
                        [class.text-rose-600]="step.status === 'failed'"
                        [class.text-blue-600]="step.status === 'running'"
                        [class.text-stone-400]="step.status === 'pending' || step.status === 'skipped'"
                        class="block text-[10px] font-semibold uppercase">
                        {{ step.status }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Selected Chaos details card -->
          @if (activeChaosConfig(); as chaos) {
            <div class="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs">
              <div class="flex items-center gap-2 text-amber-900 font-bold mb-1">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active Fault: {{ chaos.title }}</span>
              </div>
              <p class="text-amber-800 text-[11px] mb-2 leading-relaxed">{{ chaos.description }}</p>
              <div class="text-[10px] font-mono text-amber-700 bg-amber-100/50 p-2 rounded-xl">
                💡 <strong>Remediation:</strong> {{ chaos.remediationTip }}
              </div>
            </div>
          }
        </div>

        <!-- Right: Real-time Terminal Log Console -->
        <div class="lg:col-span-7 bg-stone-950 text-stone-100 p-4 flex flex-col font-mono text-xs">
          
          <!-- Terminal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-stone-800 mb-3 text-stone-400 text-[11px]">
            <div class="flex items-center gap-2">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
              <span class="font-bold text-stone-300 ml-1">runner&#64;github-actions-ubuntu22</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                type="button"
                (click)="copyLogs()"
                class="hover:text-white px-2 py-1 bg-stone-900 rounded border border-stone-800 text-[10px] cursor-pointer">
                {{ copySuccess() ? '✓ Copied' : 'Copy Logs' }}
              </button>
            </div>
          </div>

          <!-- Log Lines Viewer -->
          <div class="flex-1 overflow-y-auto max-h-[380px] space-y-1 select-text scrollbar-thin scrollbar-thumb-stone-800">
            @if (displayedLogs().length === 0) {
              <div class="h-64 flex flex-col items-center justify-center text-stone-600 text-center px-4">
                <svg class="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Virtual Runner ready. Click "Simulate Dry Run" to execute pipeline steps.</p>
              </div>
            } @else {
              @for (log of displayedLogs(); track $index) {
                <div class="flex items-start gap-2 text-[11px] leading-[18px]">
                  <span class="text-stone-600 select-none shrink-0">{{ log.timestamp }}</span>
                  
                  <span 
                    [class.text-stone-300]="log.type === 'stdout'"
                    [class.text-rose-400]="log.type === 'stderr'"
                    [class.text-blue-400]="log.type === 'info'"
                    [class.text-amber-400]="log.type === 'warn'"
                    [class.text-emerald-400]="log.type === 'success'"
                    [class.text-stone-500]="log.type === 'debug'"
                    class="break-all font-mono">
                    {{ log.text }}
                  </span>
                </div>
              }
            }
          </div>

          <!-- Failure Resolution Bar if failed -->
          @if (simService.status() === 'failed' && simService.lastResult(); as res) {
            <div class="mt-3 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-[11px] flex items-center justify-between gap-3 animate-in fade-in">
              <div>
                <p class="font-bold text-rose-300">Failure in: {{ res.failedStepName }}</p>
                <p class="text-rose-400 text-[10px]">{{ res.remediationAdvice }}</p>
              </div>
              <button 
                type="button"
                (click)="handleAutoRollback()"
                class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-xs">
                Trigger Auto-Rollback
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class CicdSimulatorComponent {
  yamlText = input<string>('');
  envVars = input<{ key: string; value: string; isSecret?: boolean }[]>([]);
  repository = input<string>('auto-deploy-hub');
  branch = input<string>('main');

  rollbackTriggered = output<string>();

  simService = inject(CicdSimulatorService);
  doraService = inject(DoraMetricsService);

  selectedChaos = signal<ChaosScenario>('none');
  selectedSpeed = signal<number>(1);
  selectedStepIndex = signal<number>(0);
  copySuccess = signal<boolean>(false);

  stepsList = computed(() => {
    const s = this.simService.steps();
    if (s.length > 0) return s;
    return this.simService.generateStepsFromYaml(this.yamlText(), this.envVars());
  });

  activeChaosConfig = computed(() => {
    return this.simService.chaosScenarios.find(c => c.id === this.selectedChaos());
  });

  displayedLogs = computed<LogLine[]>(() => {
    const currentSteps = this.simService.steps();
    if (currentSteps.length === 0) return [];
    
    // Return aggregate logs of all steps executed so far
    const allLogs: LogLine[] = [];
    currentSteps.forEach(step => {
      if (step.logs.length > 0) {
        allLogs.push(...step.logs);
      }
    });
    return allLogs;
  });

  totalDurationSec = computed(() => {
    const s = this.simService.steps();
    const totalMs = s.reduce((a, b) => a + b.durationMs, 0);
    return (totalMs / 1000).toFixed(1);
  });

  onChaosChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value as ChaosScenario;
    this.selectedChaos.set(val);
  }

  startRun() {
    const steps = this.simService.generateStepsFromYaml(this.yamlText(), this.envVars());
    this.simService.startSimulation(steps, this.selectedChaos(), this.selectedSpeed());
  }

  handleAutoRollback() {
    this.simService.triggerAutoRollback();
    this.doraService.recordRollback('sim-fail', this.repository(), this.branch(), '8f1e29c');
    this.rollbackTriggered.emit('sim-fail');
  }

  copyLogs() {
    const logs = this.displayedLogs().map(l => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(logs);
    this.copySuccess.set(true);
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
