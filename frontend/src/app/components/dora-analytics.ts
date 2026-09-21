import { Component, ChangeDetectionStrategy, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoraMetricsService } from '../services/dora-metrics';

@Component({
  selector: 'app-dora-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner & Filters -->
      <div class="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-stone-900">DORA Metrics & Cross-Repository Fleet Health</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                DEVOPS BENCHMARKS
              </span>
            </div>
            <p class="text-xs text-stone-500">Google Cloud DORA research metrics: Deployment Frequency, Lead Time, CFR, and MTTR.</p>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="flex items-center gap-3">
          
          <!-- Time Range Selector -->
          <div class="flex items-center bg-stone-100 rounded-xl p-1 text-xs font-bold">
            <button 
              type="button"
              (click)="doraService.selectedTimeRangeDays.set(7)"
              [class.bg-white]="doraService.selectedTimeRangeDays() === 7"
              [class.shadow-xs]="doraService.selectedTimeRangeDays() === 7"
              [class.text-stone-900]="doraService.selectedTimeRangeDays() === 7"
              [class.text-stone-500]="doraService.selectedTimeRangeDays() !== 7"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer">
              7 Days
            </button>
            <button 
              type="button"
              (click)="doraService.selectedTimeRangeDays.set(30)"
              [class.bg-white]="doraService.selectedTimeRangeDays() === 30"
              [class.shadow-xs]="doraService.selectedTimeRangeDays() === 30"
              [class.text-stone-900]="doraService.selectedTimeRangeDays() === 30"
              [class.text-stone-500]="doraService.selectedTimeRangeDays() !== 30"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer">
              30 Days
            </button>
            <button 
              type="button"
              (click)="doraService.selectedTimeRangeDays.set(90)"
              [class.bg-white]="doraService.selectedTimeRangeDays() === 90"
              [class.shadow-xs]="doraService.selectedTimeRangeDays() === 90"
              [class.text-stone-900]="doraService.selectedTimeRangeDays() === 90"
              [class.text-stone-500]="doraService.selectedTimeRangeDays() !== 90"
              class="px-3 py-1 rounded-lg transition-all cursor-pointer">
              90 Days
            </button>
          </div>

          <button 
            type="button"
            (click)="doraService.resetToDefaults()"
            title="Reset sample metrics"
            class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            Reset Data
          </button>
        </div>
      </div>

      <!-- DORA 4 Key Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- 1. Deployment Frequency -->
        <div class="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">Deployment Frequency</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" [class]="report().deploymentFrequency.ratingColor">
                {{ report().deploymentFrequency.rating }} Tier
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-stone-900">{{ report().deploymentFrequency.value }}</span>
            </div>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">{{ report().deploymentFrequency.description }}</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>Benchmark: {{ report().deploymentFrequency.industryBenchmark }}</span>
            <span class="text-emerald-600 font-bold">↑ 18.4%</span>
          </div>
        </div>

        <!-- 2. Lead Time for Changes -->
        <div class="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">Lead Time for Changes</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" [class]="report().leadTimeForChanges.ratingColor">
                {{ report().leadTimeForChanges.rating }} Tier
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-stone-900">{{ report().leadTimeForChanges.value }}</span>
            </div>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">{{ report().leadTimeForChanges.description }}</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>Benchmark: {{ report().leadTimeForChanges.industryBenchmark }}</span>
            <span class="text-emerald-600 font-bold">↑ 12.1%</span>
          </div>
        </div>

        <!-- 3. Change Failure Rate -->
        <div class="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">Change Failure Rate</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" [class]="report().changeFailureRate.ratingColor">
                {{ report().changeFailureRate.rating }} Tier
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-stone-900">{{ report().changeFailureRate.value }}</span>
            </div>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">{{ report().changeFailureRate.description }}</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>Benchmark: {{ report().changeFailureRate.industryBenchmark }}</span>
            <span class="text-emerald-600 font-bold">↓ -4.5%</span>
          </div>
        </div>

        <!-- 4. Mean Time to Recovery (MTTR) -->
        <div class="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-stone-500 uppercase tracking-wider">Mean Time to Recovery</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" [class]="report().meanTimeToRecovery.ratingColor">
                {{ report().meanTimeToRecovery.rating }} Tier
              </span>
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-stone-900">{{ report().meanTimeToRecovery.value }}</span>
            </div>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">{{ report().meanTimeToRecovery.description }}</p>
          </div>
          <div class="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-stone-400">
            <span>Benchmark: {{ report().meanTimeToRecovery.industryBenchmark }}</span>
            <span class="text-emerald-600 font-bold">↑ 25.0%</span>
          </div>
        </div>

      </div>

      <!-- Cross-Repository Fleet Health Matrix -->
      <div class="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        
        <div class="p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-stone-900">Cross-Repository Fleet Health Matrix</h3>
            <p class="text-xs text-stone-500">Live operational status, deployment success rates, and DORA performance across all connected repositories.</p>
          </div>

          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ fleet().length }} Active Services
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-stone-50/75 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <th class="py-3 px-4 font-semibold">Repository</th>
                <th class="py-3 px-4 font-semibold">Status</th>
                <th class="py-3 px-4 font-semibold">Success Rate</th>
                <th class="py-3 px-4 font-semibold">Avg Duration</th>
                <th class="py-3 px-4 font-semibold">Target Environment</th>
                <th class="py-3 px-4 font-semibold">Last Commit</th>
                <th class="py-3 px-4 font-semibold">DORA Tier</th>
                <th class="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (repo of fleet(); track repo.repoName) {
                <tr class="hover:bg-stone-50/60 transition-colors">
                  
                  <!-- Repo Name -->
                  <td class="py-3.5 px-4 font-bold text-stone-900 flex items-center gap-2">
                    <svg class="w-4 h-4 text-stone-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" clip-rule="evenodd" />
                    </svg>
                    <span>{{ repo.repoName }}</span>
                  </td>

                  <!-- Status -->
                  <td class="py-3.5 px-4">
                    <span 
                      [class.bg-emerald-100]="repo.status === 'healthy'"
                      [class.text-emerald-800]="repo.status === 'healthy'"
                      [class.bg-amber-100]="repo.status === 'warning'"
                      [class.text-amber-800]="repo.status === 'warning'"
                      [class.bg-rose-100]="repo.status === 'critical'"
                      [class.text-rose-800]="repo.status === 'critical'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      {{ repo.status }}
                    </span>
                  </td>

                  <!-- Success Rate -->
                  <td class="py-3.5 px-4 font-mono font-bold">
                    <span [class.text-emerald-600]="repo.successRate >= 90" [class.text-rose-600]="repo.successRate < 80">
                      {{ repo.successRate }}%
                    </span>
                    <span class="text-[10px] text-stone-400 font-normal ml-1">({{ repo.totalRuns }} runs)</span>
                  </td>

                  <!-- Avg Duration -->
                  <td class="py-3.5 px-4 font-mono text-stone-600">
                    {{ repo.avgDurationSec }}s
                  </td>

                  <!-- Active Environment -->
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-mono font-semibold">
                      {{ repo.activeEnvironment }}
                    </span>
                  </td>

                  <!-- Last Commit -->
                  <td class="py-3.5 px-4 font-mono text-[11px] text-stone-500">
                    <span class="text-stone-900 font-semibold">{{ repo.lastCommitSha }}</span> on <span class="text-stone-700">{{ repo.lastBranch }}</span>
                    <span class="block text-[10px] text-stone-400">{{ repo.lastDeployTime }}</span>
                  </td>

                  <!-- DORA Rating -->
                  <td class="py-3.5 px-4">
                    <span 
                      [class.text-emerald-600]="repo.doraRating === 'Elite'"
                      [class.text-blue-600]="repo.doraRating === 'High'"
                      [class.text-amber-600]="repo.doraRating === 'Medium'"
                      [class.text-rose-600]="repo.doraRating === 'Low'"
                      class="font-bold text-xs">
                      ★ {{ repo.doraRating }}
                    </span>
                  </td>

                  <!-- Action -->
                  <td class="py-3.5 px-4 text-right">
                    <button 
                      type="button"
                      (click)="triggerDeploy.emit(repo.repoName)"
                      class="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer">
                      Deploy
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class DoraAnalyticsComponent {
  triggerDeploy = output<string>();

  doraService = inject(DoraMetricsService);

  report = computed(() => this.doraService.doraReport());
  fleet = computed(() => this.doraService.fleetHealth());
}
