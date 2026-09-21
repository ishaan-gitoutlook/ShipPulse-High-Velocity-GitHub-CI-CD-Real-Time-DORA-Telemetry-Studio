import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowOptimizerService } from '../services/workflow-optimizer';

@Component({
  selector: 'app-workflow-optimizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      
      <!-- Top Banner -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-stone-900">AI Workflow Optimizer & Runner Cost Forecaster</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                COST & SPEED INSIGHTS
              </span>
            </div>
            <p class="text-xs text-stone-500">Estimate GitHub Actions compute minutes, inject multi-tier caching, and apply one-click AI patches.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="activeSubTab.set('forecaster')"
            [class.bg-stone-900]="activeSubTab() === 'forecaster'"
            [class.text-white]="activeSubTab() === 'forecaster'"
            [class.bg-stone-100]="activeSubTab() !== 'forecaster'"
            [class.text-stone-700]="activeSubTab() !== 'forecaster'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            Cost & Minutes Forecaster
          </button>
          <button 
            type="button"
            (click)="activeSubTab.set('caching')"
            [class.bg-stone-900]="activeSubTab() === 'caching'"
            [class.text-white]="activeSubTab() === 'caching'"
            [class.bg-stone-100]="activeSubTab() !== 'caching'"
            [class.text-stone-700]="activeSubTab() !== 'caching'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            Caching Recommender ({{ cachingRecs().length }})
          </button>
          <button 
            type="button"
            (click)="activeSubTab.set('patches')"
            [class.bg-stone-900]="activeSubTab() === 'patches'"
            [class.text-white]="activeSubTab() === 'patches'"
            [class.bg-stone-100]="activeSubTab() !== 'patches'"
            [class.text-stone-700]="activeSubTab() !== 'patches'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            AI Patch Engine ({{ availablePatches().length }})
          </button>
        </div>
      </div>

      <!-- VIEW 1: RUNNER COST FORECASTER -->
      @if (activeSubTab() === 'forecaster') {
        <div class="space-y-6 animate-in fade-in">
          
          <!-- Metrics Overview Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div class="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <span class="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Monthly Runner Minutes</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-stone-900">{{ optimizerService.costEstimate().monthlyMinutes.toLocaleString() }}</span>
                <span class="text-xs text-stone-500">mins/mo</span>
              </div>
              <span class="text-[10px] text-stone-400 mt-1 block">Includes 2,000 free tier private mins</span>
            </div>

            <div class="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Estimated Monthly Cost</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-blue-950">\${{ optimizerService.costEstimate().monthlyCostUsd.toFixed(2) }}</span>
                <span class="text-xs text-blue-600">/ month</span>
              </div>
              <span class="text-[10px] text-blue-700 mt-1 block">Annualized: ~\${{ optimizerService.costEstimate().annualCostUsd.toFixed(2) }}/yr</span>
            </div>

            <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">With Multi-Tier Caching</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-emerald-900">\${{ optimizerService.costEstimate().estimatedWithCacheCostUsd.toFixed(2) }}</span>
                <span class="text-xs text-emerald-700 font-bold">(-55%)</span>
              </div>
              <span class="text-[10px] text-emerald-700 mt-1 block">Reduces duration to ~{{ (optimizerService.avgDurationMins() * 0.45).toFixed(1) }} mins</span>
            </div>

            <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200">
              <span class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">Potential Monthly Savings</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-indigo-950">\${{ optimizerService.costEstimate().monthlySavingsUsd.toFixed(2) }}</span>
                <span class="text-xs text-indigo-600 font-bold">saved/mo</span>
              </div>
              <span class="text-[10px] text-indigo-700 mt-1 block">ROI on pipeline optimization</span>
            </div>

          </div>

          <!-- Interactive Simulator Sliders -->
          <div class="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-5">
            <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500">Execution Frequency & Runner Parameters</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <!-- OS Runner Picker -->
              <div>
                <span class="text-xs font-semibold text-stone-700 block mb-2">Runner Operating System</span>
                <div class="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-stone-200 text-xs font-bold">
                  <button 
                    type="button"
                    (click)="optimizerService.osType.set('ubuntu')"
                    [class.bg-stone-900]="optimizerService.osType() === 'ubuntu'"
                    [class.text-white]="optimizerService.osType() === 'ubuntu'"
                    class="py-1.5 rounded-lg transition-colors cursor-pointer text-center">
                    Linux
                  </button>
                  <button 
                    type="button"
                    (click)="optimizerService.osType.set('windows')"
                    [class.bg-stone-900]="optimizerService.osType() === 'windows'"
                    [class.text-white]="optimizerService.osType() === 'windows'"
                    class="py-1.5 rounded-lg transition-colors cursor-pointer text-center">
                    Win (2x)
                  </button>
                  <button 
                    type="button"
                    (click)="optimizerService.osType.set('macos')"
                    [class.bg-stone-900]="optimizerService.osType() === 'macos'"
                    [class.text-white]="optimizerService.osType() === 'macos'"
                    class="py-1.5 rounded-lg transition-colors cursor-pointer text-center">
                    macOS (10x)
                  </button>
                </div>
              </div>

              <!-- Builds per day -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                  <span>Builds per Day</span>
                  <span class="font-mono font-bold text-stone-900">{{ optimizerService.buildsPerDay() }} runs</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  [value]="optimizerService.buildsPerDay()"
                  (input)="onBuildsChange($event)"
                  class="w-full accent-stone-900 cursor-pointer" 
                />
              </div>

              <!-- Average build duration -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                  <span>Average Duration</span>
                  <span class="font-mono font-bold text-stone-900">{{ optimizerService.avgDurationMins() }} mins</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="0.5"
                  [value]="optimizerService.avgDurationMins()"
                  (input)="onDurationChange($event)"
                  class="w-full accent-stone-900 cursor-pointer" 
                />
              </div>

              <!-- Parallel Matrix Jobs -->
              <div>
                <div class="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                  <span>Parallel Matrix Jobs</span>
                  <span class="font-mono font-bold text-stone-900">{{ optimizerService.matrixJobsCount() }} jobs</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  [value]="optimizerService.matrixJobsCount()"
                  (input)="onMatrixChange($event)"
                  class="w-full accent-stone-900 cursor-pointer" 
                />
              </div>

            </div>
          </div>
        </div>
      }

      <!-- VIEW 2: CACHING RECOMMENDER -->
      @if (activeSubTab() === 'caching') {
        <div class="space-y-4 animate-in fade-in">
          @if (cachingRecs().length === 0) {
            <div class="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
              ✓ Excellent! Your workflow already incorporates optimal dependency and layer caching steps.
            </div>
          } @else {
            @for (rec of cachingRecs(); track rec.ecosystem) {
              <div class="p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {{ rec.priority.toUpperCase() }} PRIORITY
                    </span>
                    <h4 class="text-sm font-bold text-stone-900">{{ rec.ecosystem }}</h4>
                  </div>
                  <span class="text-xs font-bold text-emerald-600">~{{ rec.estimatedTimeSavedSec }}s faster per build</span>
                </div>

                <p class="text-xs text-stone-600">{{ rec.explanation }}</p>

                <!-- Code block preview -->
                <div class="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>{{ rec.yamlSnippet }}</pre>
                </div>

                <div class="flex items-center justify-end">
                  <button 
                    type="button"
                    (click)="applyAiPatch('patch-caching')"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Inject Caching Step into Workflow
                  </button>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- VIEW 3: AI PATCH ENGINE -->
      @if (activeSubTab() === 'patches') {
        <div class="space-y-4 animate-in fade-in">
          @if (availablePatches().length === 0) {
            <div class="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
              ✓ Outstanding! All best-practice AI patches (concurrency, least privilege, timeouts, caching) are already active.
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (patch of availablePatches(); track patch.id) {
                <div class="p-4 rounded-2xl border border-stone-200 bg-white hover:border-stone-300 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <span 
                        [class.bg-blue-100]="patch.category === 'cost'"
                        [class.text-blue-800]="patch.category === 'cost'"
                        [class.bg-emerald-100]="patch.category === 'performance'"
                        [class.text-emerald-800]="patch.category === 'performance'"
                        [class.bg-rose-100]="patch.category === 'security'"
                        [class.text-rose-800]="patch.category === 'security'"
                        [class.bg-amber-100]="patch.category === 'resilience'"
                        [class.text-amber-800]="patch.category === 'resilience'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {{ patch.category }}
                      </span>
                    </div>
                    <h4 class="text-sm font-bold text-stone-900 mb-1">{{ patch.title }}</h4>
                    <p class="text-xs text-stone-600 leading-relaxed mb-2">{{ patch.description }}</p>
                    <p class="text-[11px] font-mono text-indigo-700 bg-indigo-50 p-2 rounded-xl">⚡ <strong>Impact:</strong> {{ patch.impact }}</p>
                  </div>

                  <button 
                    type="button"
                    (click)="applyAiPatch(patch.id)"
                    class="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Apply 1-Click AI Patch
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

    </div>
  `
})
export class WorkflowOptimizerComponent {
  yamlText = input<string>('');
  yamlUpdated = output<string>();

  optimizerService = inject(WorkflowOptimizerService);

  activeSubTab = signal<'forecaster' | 'caching' | 'patches'>('forecaster');

  cachingRecs = computed(() => {
    return this.optimizerService.detectCachingOpportunities(this.yamlText());
  });

  availablePatches = computed(() => {
    return this.optimizerService.getAvailablePatches(this.yamlText());
  });

  onBuildsChange(event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.optimizerService.buildsPerDay.set(val);
  }

  onDurationChange(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.optimizerService.avgDurationMins.set(val);
  }

  onMatrixChange(event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    this.optimizerService.matrixJobsCount.set(val);
  }

  applyAiPatch(patchId: string) {
    const updatedYaml = this.optimizerService.applyPatchToYaml(this.yamlText(), patchId);
    this.yamlUpdated.emit(updatedYaml);
  }
}
