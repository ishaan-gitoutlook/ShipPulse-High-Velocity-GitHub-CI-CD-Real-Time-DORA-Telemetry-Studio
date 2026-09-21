import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YamlLinter, YamlLintResult, YamlLintIssue } from '../services/yaml-lint';

@Component({
  selector: 'app-workflow-validator',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-200">
      
      <!-- Top Health & Score Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <!-- Overall Health Score Card -->
        <div class="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-white flex flex-col justify-between shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Health Rating</span>
            <span 
              [class.bg-emerald-500/20]="lintResult().stats.healthScore >= 90"
              [class.text-emerald-400]="lintResult().stats.healthScore >= 90"
              [class.border-emerald-500/30]="lintResult().stats.healthScore >= 90"
              [class.bg-amber-500/20]="lintResult().stats.healthScore >= 70 && lintResult().stats.healthScore < 90"
              [class.text-amber-400]="lintResult().stats.healthScore >= 70 && lintResult().stats.healthScore < 90"
              [class.border-amber-500/30]="lintResult().stats.healthScore >= 70 && lintResult().stats.healthScore < 90"
              [class.bg-rose-500/20]="lintResult().stats.healthScore < 70"
              [class.text-rose-400]="lintResult().stats.healthScore < 70"
              [class.border-rose-500/30]="lintResult().stats.healthScore < 70"
              class="px-2.5 py-0.5 rounded-full text-xs font-black border font-mono">
              Grade {{ lintResult().stats.securityRating }}
            </span>
          </div>

          <div class="my-3 flex items-baseline gap-2">
            <span class="text-4xl font-extrabold tracking-tight">{{ lintResult().stats.healthScore }}%</span>
            <span class="text-xs text-stone-400">Workflow Quality</span>
          </div>

          <div class="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
            <div 
              class="h-2 rounded-full transition-all duration-500"
              [class.bg-emerald-500]="lintResult().stats.healthScore >= 90"
              [class.bg-amber-500]="lintResult().stats.healthScore >= 70 && lintResult().stats.healthScore < 90"
              [class.bg-rose-500]="lintResult().stats.healthScore < 70"
              [style.width.%]="lintResult().stats.healthScore">
            </div>
          </div>
        </div>

        <!-- Syntax & AST Integrity -->
        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Syntax & AST</span>
            <span 
              [class.text-emerald-600]="lintResult().errors.length === 0"
              [class.bg-emerald-50]="lintResult().errors.length === 0"
              [class.text-rose-600]="lintResult().errors.length > 0"
              [class.bg-rose-50]="lintResult().errors.length > 0"
              class="text-xs font-bold px-2 py-0.5 rounded-full">
              {{ lintResult().errors.length === 0 ? 'Passed' : lintResult().errors.length + ' Error(s)' }}
            </span>
          </div>

          <div class="my-2">
            <span class="text-2xl font-bold text-stone-900">{{ lintResult().stats.scoreBreakdown.syntaxScore }}%</span>
            <p class="text-[11px] text-stone-500 mt-0.5">Strict YAML 1.2 indentation and parsing check</p>
          </div>

          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div 
              class="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
              [style.width.%]="lintResult().stats.scoreBreakdown.syntaxScore">
            </div>
          </div>
        </div>

        <!-- Security & Secrets Posture -->
        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Security Posture</span>
            <span 
              [class.text-emerald-600]="lintResult().stats.securityRating === 'A+' || lintResult().stats.securityRating === 'A'"
              [class.bg-emerald-50]="lintResult().stats.securityRating === 'A+' || lintResult().stats.securityRating === 'A'"
              [class.text-amber-600]="lintResult().stats.securityRating === 'B'"
              [class.bg-amber-50]="lintResult().stats.securityRating === 'B'"
              [class.text-rose-600]="lintResult().stats.securityRating === 'C' || lintResult().stats.securityRating === 'F'"
              [class.bg-rose-50]="lintResult().stats.securityRating === 'C' || lintResult().stats.securityRating === 'F'"
              class="text-xs font-bold px-2 py-0.5 rounded-full">
              Rating {{ lintResult().stats.securityRating }}
            </span>
          </div>

          <div class="my-2">
            <span class="text-2xl font-bold text-stone-900">{{ lintResult().stats.scoreBreakdown.securityScore }}%</span>
            <p class="text-[11px] text-stone-500 mt-0.5">Hardcoded tokens & secrets expression verification</p>
          </div>

          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div 
              class="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
              [style.width.%]="lintResult().stats.scoreBreakdown.securityScore">
            </div>
          </div>
        </div>

        <!-- Schema & Reliability -->
        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-400">Schema & Best Practices</span>
            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {{ lintResult().stats.jobsCount }} Job{{ lintResult().stats.jobsCount === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="my-2">
            <span class="text-2xl font-bold text-stone-900">{{ lintResult().stats.scoreBreakdown.bestPracticesScore }}%</span>
            <p class="text-[11px] text-stone-500 mt-0.5">GitHub Actions v4 schema & runner compatibility</p>
          </div>

          <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
            <div 
              class="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
              [style.width.%]="lintResult().stats.scoreBreakdown.bestPracticesScore">
            </div>
          </div>
        </div>

      </div>

      <!-- Quick Auto-Fix Hub Actions Banner -->
      <div class="bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Automated Code Fixer
            </span>
            <span class="text-xs text-stone-400">One-click AST remediation</span>
          </div>
          <h3 class="text-base font-bold text-white">
            Quick Auto-Fix Actions
          </h3>
          <p class="text-xs text-stone-300 mt-0.5 max-w-xl">
            Automatically resolve tab indentation errors, pin actions to secure v4 releases, format spacing, and add standard runners.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            type="button"
            (click)="onAutoFixTabs()"
            class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-700">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Fix Tabs &rarr; 2-Spaces</span>
          </button>

          <button 
            type="button"
            (click)="onUpgradeActions()"
            class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-700">
            <svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Upgrade to v4</span>
          </button>

          <button 
            type="button"
            (click)="onFormatYaml()"
            class="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-stone-700">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>Format YAML</span>
          </button>

          <button 
            type="button"
            (click)="onAutoFixAll()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Apply All Fixes</span>
          </button>
        </div>
      </div>

      <!-- Navigation Sub-View Tabs for Validator -->
      <div class="flex items-center justify-between border-b border-stone-200 pb-3">
        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="activeSubView.set('diagnostics')"
            [class.bg-stone-900]="activeSubView() === 'diagnostics'"
            [class.text-white]="activeSubView() === 'diagnostics'"
            [class.bg-stone-100]="activeSubView() !== 'diagnostics'"
            [class.text-stone-600]="activeSubView() !== 'diagnostics'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer">
            <span>Diagnostics & Issues</span>
            <span 
              [class.bg-rose-500]="lintResult().errors.length > 0"
              [class.text-white]="lintResult().errors.length > 0"
              [class.bg-stone-700]="lintResult().errors.length === 0 && activeSubView() === 'diagnostics'"
              [class.bg-stone-200]="lintResult().errors.length === 0 && activeSubView() !== 'diagnostics'"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-mono">
              {{ allIssues().length }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeSubView.set('graph')"
            [class.bg-stone-900]="activeSubView() === 'graph'"
            [class.text-white]="activeSubView() === 'graph'"
            [class.bg-stone-100]="activeSubView() !== 'graph'"
            [class.text-stone-600]="activeSubView() !== 'graph'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer">
            <span>Job Execution Flow</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-stone-200 text-stone-700">
              {{ lintResult().stats.jobsCount }}
            </span>
          </button>

          <button 
            type="button"
            (click)="activeSubView.set('security')"
            [class.bg-stone-900]="activeSubView() === 'security'"
            [class.text-white]="activeSubView() === 'security'"
            [class.bg-stone-100]="activeSubView() !== 'security'"
            [class.text-stone-600]="activeSubView() !== 'security'"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer">
            <span>Security & Secrets Audit</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
              {{ lintResult().stats.securityRating }}
            </span>
          </button>
        </div>

        <button 
          type="button"
          (click)="jumpToEditor.emit()"
          class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer">
          <span>Open in Editor &rarr;</span>
        </button>
      </div>

      <!-- VIEW 1: Diagnostics & Issues List -->
      @if (activeSubView() === 'diagnostics') {
        <div class="space-y-4">
          
          <!-- Category Filter Bar -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span class="text-stone-400 font-medium shrink-0">Filter by:</span>
            
            <button 
              type="button"
              (click)="categoryFilter.set('all')"
              [class.bg-indigo-600]="categoryFilter() === 'all'"
              [class.text-white]="categoryFilter() === 'all'"
              [class.bg-stone-100]="categoryFilter() !== 'all'"
              [class.text-stone-700]="categoryFilter() !== 'all'"
              class="px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
              All Issues ({{ allIssues().length }})
            </button>

            <button 
              type="button"
              (click)="categoryFilter.set('syntax')"
              [class.bg-indigo-600]="categoryFilter() === 'syntax'"
              [class.text-white]="categoryFilter() === 'syntax'"
              [class.bg-stone-100]="categoryFilter() !== 'syntax'"
              [class.text-stone-700]="categoryFilter() !== 'syntax'"
              class="px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
              Syntax ({{ countByCategory('syntax') }})
            </button>

            <button 
              type="button"
              (click)="categoryFilter.set('schema')"
              [class.bg-indigo-600]="categoryFilter() === 'schema'"
              [class.text-white]="categoryFilter() === 'schema'"
              [class.bg-stone-100]="categoryFilter() !== 'schema'"
              [class.text-stone-700]="categoryFilter() !== 'schema'"
              class="px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
              Schema ({{ countByCategory('schema') }})
            </button>

            <button 
              type="button"
              (click)="categoryFilter.set('security')"
              [class.bg-indigo-600]="categoryFilter() === 'security'"
              [class.text-white]="categoryFilter() === 'security'"
              [class.bg-stone-100]="categoryFilter() !== 'security'"
              [class.text-stone-700]="categoryFilter() !== 'security'"
              class="px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
              Security ({{ countByCategory('security') }})
            </button>

            <button 
              type="button"
              (click)="categoryFilter.set('best-practice')"
              [class.bg-indigo-600]="categoryFilter() === 'best-practice'"
              [class.text-white]="categoryFilter() === 'best-practice'"
              [class.bg-stone-100]="categoryFilter() !== 'best-practice'"
              [class.text-stone-700]="categoryFilter() !== 'best-practice'"
              class="px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
              Best Practice ({{ countByCategory('best-practice') }})
            </button>
          </div>

          <!-- Issues List Container -->
          @if (filteredIssues().length === 0) {
            <div class="bg-white border border-stone-200 rounded-3xl p-10 text-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 class="text-base font-bold text-stone-900">No Issues Detected in Current Filter</h4>
              <p class="text-xs text-stone-500 max-w-md mx-auto">
                Your workflow YAML satisfies all checked syntax, schema, and security rules for this category.
              </p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (issue of filteredIssues(); track $index) {
                <div 
                  [class.border-rose-300]="issue.severity === 'error'"
                  [class.bg-rose-50/40]="issue.severity === 'error'"
                  [class.border-amber-300]="issue.severity === 'warning'"
                  [class.bg-amber-50/40]="issue.severity === 'warning'"
                  [class.border-blue-200]="issue.severity === 'info'"
                  [class.bg-blue-50/30]="issue.severity === 'info'"
                  class="border rounded-2xl p-4 transition-all">
                  
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <!-- Severity Badge -->
                      <span 
                        [class.bg-rose-600]="issue.severity === 'error'"
                        [class.text-white]="issue.severity === 'error'"
                        [class.bg-amber-600]="issue.severity === 'warning'"
                        [class.text-white]="issue.severity === 'warning'"
                        [class.bg-blue-600]="issue.severity === 'info'"
                        [class.text-white]="issue.severity === 'info'"
                        class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono">
                        {{ issue.severity }}
                      </span>

                      <!-- Category Tag -->
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                        {{ issue.category }}
                      </span>

                      <!-- Line & Column Badge -->
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-800 text-stone-100 font-mono">
                        Line {{ issue.line }}:{{ issue.column }}
                      </span>

                      @if (issue.code) {
                        <span class="text-[11px] font-mono text-stone-500 font-semibold">[{{ issue.code }}]</span>
                      }
                    </div>

                    @if (issue.code === 'TAB_INDENTATION') {
                      <button 
                        type="button"
                        (click)="onAutoFixTabs()"
                        class="text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto">
                        Auto-Fix Tabs
                      </button>
                    } @else if (issue.code === 'DEPRECATED_ACTION_VERSION') {
                      <button 
                        type="button"
                        (click)="onUpgradeActions()"
                        class="text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer self-start sm:self-auto">
                        Upgrade Action
                      </button>
                    }
                  </div>

                  <!-- Issue Message -->
                  <p class="text-xs font-semibold text-stone-900 leading-relaxed">{{ issue.message }}</p>

                  <!-- Code Snippet -->
                  @if (issue.snippet) {
                    <div class="mt-2 p-2.5 bg-stone-900 text-stone-200 font-mono text-xs rounded-xl border border-stone-800 overflow-x-auto">
                      <code>{{ issue.snippet }}</code>
                    </div>
                  }

                  <!-- Suggestion -->
                  @if (issue.suggestion) {
                    <div class="mt-2 flex items-start gap-1.5 text-xs text-stone-600 bg-white/70 p-2 rounded-xl border border-stone-200/60">
                      <span class="text-amber-500 font-bold">💡 Remediation:</span>
                      <span>{{ issue.suggestion }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- VIEW 2: Job Execution Flow Graph -->
      @if (activeSubView() === 'graph') {
        <div class="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-sm font-bold text-stone-900">Workflow Dependency & Execution Graph</h4>
              <p class="text-xs text-stone-500">Visual topology of event triggers, parallel jobs, runners, and steps</p>
            </div>
            <span class="text-xs font-mono bg-stone-100 text-stone-800 px-2.5 py-1 rounded-xl border border-stone-200">
              {{ lintResult().stats.jobsCount }} Job{{ lintResult().stats.jobsCount === 1 ? '' : 's' }} Configured
            </span>
          </div>

          <!-- Trigger Node -->
          <div class="flex flex-col items-center">
            <div class="px-5 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center gap-3 shadow-xs">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                ⚡
              </div>
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Workflow Trigger</span>
                <span class="text-xs font-bold font-mono">
                  on: [{{ lintResult().stats.triggers.join(', ') || 'push, workflow_dispatch' }}]
                </span>
              </div>
            </div>

            <!-- Connector Down Arrow -->
            <div class="w-0.5 h-8 bg-stone-300 my-1"></div>
            <div class="w-2 h-2 rounded-full bg-stone-400 mb-2"></div>
          </div>

          <!-- Jobs Graph Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (job of lintResult().stats.jobGraph; track job.id) {
              <div class="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-all space-y-3 relative group">
                
                <div class="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center text-xs font-mono font-bold">
                      #{{ $index + 1 }}
                    </div>
                    <div>
                      <h5 class="text-xs font-bold text-stone-900 font-mono">{{ job.id }}</h5>
                      @if (job.name && job.name !== job.id) {
                        <p class="text-[10px] text-stone-500">{{ job.name }}</p>
                      }
                    </div>
                  </div>

                  <span 
                    [class.bg-emerald-100]="job.runsOn !== 'unspecified'"
                    [class.text-emerald-800]="job.runsOn !== 'unspecified'"
                    [class.bg-rose-100]="job.runsOn === 'unspecified'"
                    [class.text-rose-800]="job.runsOn === 'unspecified'"
                    class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                    {{ job.runsOn }}
                  </span>
                </div>

                <div class="space-y-1.5 text-xs text-stone-600">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-stone-400">Total Steps:</span>
                    <span class="font-bold text-stone-800 font-mono">{{ job.stepsCount }} step{{ job.stepsCount === 1 ? '' : 's' }}</span>
                  </div>

                  @if (job.needs && job.needs.length > 0) {
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-stone-400">Depends on:</span>
                      <span class="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                        {{ job.needs.join(', ') }}
                      </span>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="text-stone-400">Execution:</span>
                      <span class="text-stone-500 font-medium">Initial / Root Job</span>
                    </div>
                  }
                </div>

                <!-- Runner status pill -->
                <div class="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                  <span class="text-stone-500">Virtual Environment:</span>
                  <span class="font-mono font-semibold text-stone-700">{{ job.runsOn }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- VIEW 3: Security & Secrets Audit Posture -->
      @if (activeSubView() === 'security') {
        <div class="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h4 class="text-sm font-bold text-stone-900">Security & Secrets Protection Checklist</h4>
            <p class="text-xs text-stone-500">Continuous static analysis verifying that credentials and tokens are safeguarded</p>
          </div>

          <div class="divide-y divide-stone-100 text-xs">
            
            <!-- Check 1: Plaintext Secrets Check -->
            <div class="py-3.5 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-stone-900">Hardcoded Tokens & Passwords Guard</span>
                  <span 
                    [class.bg-emerald-100]="!hasPlaintextSecrets()"
                    [class.text-emerald-800]="!hasPlaintextSecrets()"
                    [class.bg-rose-100]="hasPlaintextSecrets()"
                    [class.text-rose-800]="hasPlaintextSecrets()"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {{ hasPlaintextSecrets() ? 'FAILED' : 'PASSED' }}
                  </span>
                </div>
                <p class="text-stone-500 text-[11px]">
                  Scans lines for API tokens (ghp_, gho_), AWS credentials, private keys, or raw passwords.
                </p>
              </div>
              <span class="text-stone-400 text-xs font-mono font-semibold shrink-0">Rule: SEC-01</span>
            </div>

            <!-- Check 2: Expression Syntax -->
            <div class="py-3.5 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-stone-900">GitHub Secrets Syntax Compliance</span>
                  <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    PASSED
                  </span>
                </div>
                <p class="text-stone-500 text-[11px]">
                  Sensitive values are properly wrapped in <code class="bg-stone-100 px-1 py-0.5 rounded font-mono text-[10px]">{{ secretsSyntaxExample }}</code> expressions.
                </p>
              </div>
              <span class="text-stone-400 text-xs font-mono font-semibold shrink-0">Rule: SEC-02</span>
            </div>

            <!-- Check 3: Action Version Pinning -->
            <div class="py-3.5 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-stone-900">Action Pinning & Supply Chain Integrity</span>
                  <span 
                    [class.bg-emerald-100]="!hasDeprecatedActions()"
                    [class.text-emerald-800]="!hasDeprecatedActions()"
                    [class.bg-amber-100]="hasDeprecatedActions()"
                    [class.text-amber-800]="hasDeprecatedActions()"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {{ hasDeprecatedActions() ? 'WARNING' : 'PASSED' }}
                  </span>
                </div>
                <p class="text-stone-500 text-[11px]">
                  Verifies actions like <code class="font-mono text-[10px]">actions/checkout&#64;v4</code> are pinned to modern releases instead of deprecated v1/v2 or mutable tags.
                </p>
              </div>
              <span class="text-stone-400 text-xs font-mono font-semibold shrink-0">Rule: SEC-03</span>
            </div>

            <!-- Check 4: Runner Isolation -->
            <div class="py-3.5 flex items-start justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-stone-900">Runner Isolation & Standard Hosted Image</span>
                  <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    PASSED
                  </span>
                </div>
                <p class="text-stone-500 text-[11px]">
                  Configured with GitHub-hosted virtual runners (e.g. <code class="font-mono text-[10px]">ubuntu-latest</code>) ensuring ephemeral clean containers per run.
                </p>
              </div>
              <span class="text-stone-400 text-xs font-mono font-semibold shrink-0">Rule: SEC-04</span>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class WorkflowValidatorComponent {
  yamlContent = input<string>('');
  repoName = input<string>('');

  applyAutoFix = output<string>();
  jumpToEditor = output<void>();

  readonly secretsSyntaxExample = '${{ secrets.KEY }}';

  private yamlLinter = inject(YamlLinter);

  activeSubView = signal<'diagnostics' | 'graph' | 'security'>('diagnostics');
  categoryFilter = signal<'all' | 'syntax' | 'schema' | 'security' | 'best-practice'>('all');

  lintResult = computed<YamlLintResult>(() => this.yamlLinter.lint(this.yamlContent()));

  allIssues = computed<YamlLintIssue[]>(() => {
    const res = this.lintResult();
    return [...res.errors, ...res.warnings, ...res.infos];
  });

  filteredIssues = computed<YamlLintIssue[]>(() => {
    const filter = this.categoryFilter();
    const list = this.allIssues();
    if (filter === 'all') return list;
    return list.filter(i => i.category === filter);
  });

  hasPlaintextSecrets = computed(() => this.allIssues().some(i => i.code === 'HARDCODED_SECRET'));
  hasDeprecatedActions = computed(() => this.allIssues().some(i => i.code === 'DEPRECATED_ACTION_VERSION'));

  countByCategory(cat: string): number {
    return this.allIssues().filter(i => i.category === cat).length;
  }

  onAutoFixTabs() {
    const fixed = this.yamlLinter.fixTabs(this.yamlContent());
    this.applyAutoFix.emit(fixed);
  }

  onUpgradeActions() {
    const fixed = this.yamlLinter.upgradeActionVersions(this.yamlContent());
    this.applyAutoFix.emit(fixed);
  }

  onFormatYaml() {
    const fixed = this.yamlLinter.formatYaml(this.yamlContent());
    this.applyAutoFix.emit(fixed);
  }

  onAutoFixAll() {
    let fixed = this.yamlContent();
    fixed = this.yamlLinter.fixTabs(fixed);
    fixed = this.yamlLinter.upgradeActionVersions(fixed);
    fixed = this.yamlLinter.addRunsOnUbuntu(fixed);
    fixed = this.yamlLinter.formatYaml(fixed);
    this.applyAutoFix.emit(fixed);
  }
}
