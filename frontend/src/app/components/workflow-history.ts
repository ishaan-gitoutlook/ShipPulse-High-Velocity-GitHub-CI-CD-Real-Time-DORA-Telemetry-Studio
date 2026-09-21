import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowHistoryService, WorkflowRevision, DiffSummary } from '../services/workflow-history';
import { YamlLintStats } from '../services/yaml-lint';

@Component({
  selector: 'app-workflow-history',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 animate-in fade-in duration-200">
      
      <!-- Top Actions Bar -->
      <div class="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
              <svg class="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              VERSION AUDIT & DIFF ENGINE
            </span>
            <span class="text-xs text-stone-400">Local & Committed Revisions</span>
          </div>
          <h3 class="text-lg font-bold text-stone-900">
            Workflow Configuration History
          </h3>
          <p class="text-xs text-stone-500 max-w-xl mt-0.5">
            Audit every commit and configuration milestone for <code class="font-mono bg-stone-100 px-1 py-0.5 rounded font-bold text-stone-800">{{ repository() }}</code>. Compare line-by-line diffs and safely rollback anytime.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            type="button"
            (click)="showSnapshotModal.set(true)"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save Snapshot</span>
          </button>

          <button 
            type="button"
            (click)="onResetDefaults()"
            title="Reset revision history to template seeds"
            class="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer">
            <span>Reset Seeds</span>
          </button>

          <button 
            type="button"
            (click)="onClearHistory()"
            title="Clear history for this repository"
            class="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer">
            <span>Clear</span>
          </button>
        </div>
      </div>

      <!-- Action Feedback Toast -->
      @if (actionToast()) {
        <div class="bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <span>{{ actionToast() }}</span>
          <button type="button" (click)="actionToast.set(null)" class="text-emerald-300 hover:text-white">&times;</button>
        </div>
      }

      <!-- Main Layout: 2 Columns (Timeline List Left, Diff/Details Inspector Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Revisions Timeline (5 Cols) -->
        <div class="lg:col-span-5 space-y-3">
          <div class="flex items-center justify-between px-1">
            <span class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Timeline Revisions ({{ repoRevisions().length }})
            </span>
            <span class="text-[11px] text-stone-400">Click to compare diff</span>
          </div>

          @if (repoRevisions().length === 0) {
            <div class="bg-white border border-stone-200 rounded-3xl p-8 text-center space-y-2">
              <p class="text-xs font-bold text-stone-700">No revisions recorded yet</p>
              <p class="text-[11px] text-stone-400">Save a milestone snapshot or commit a workflow to begin tracking history.</p>
              <button 
                type="button" 
                (click)="showSnapshotModal.set(true)"
                class="mt-2 text-xs font-bold text-purple-600 hover:underline">
                Create First Snapshot &rarr;
              </button>
            </div>
          } @else {
            <div class="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              @for (rev of repoRevisions(); track rev.id) {
                <div 
                  (click)="selectedRevisionId.set(rev.id)"
                  (keydown.enter)="selectedRevisionId.set(rev.id)"
                  tabindex="0"
                  role="button"
                  [attr.aria-pressed]="selectedRevision()?.id === rev.id"
                  [class.border-purple-600]="selectedRevision()?.id === rev.id"
                  [class.ring-2]="selectedRevision()?.id === rev.id"
                  [class.ring-purple-500/20]="selectedRevision()?.id === rev.id"
                  [class.bg-purple-50/20]="selectedRevision()?.id === rev.id"
                  [class.border-stone-200]="selectedRevision()?.id !== rev.id"
                  [class.bg-white]="selectedRevision()?.id !== rev.id"
                  class="border rounded-2xl p-4 text-left cursor-pointer transition-all hover:border-purple-300 shadow-2xs space-y-2.5">
                  
                  <!-- Card Header: Version & Badge -->
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded-md bg-stone-900 text-white font-mono text-xs font-black">
                        v{{ rev.version }}
                      </span>
                      
                      <!-- Source Badge -->
                      <span 
                        [class.bg-emerald-100]="rev.source === 'committed'"
                        [class.text-emerald-800]="rev.source === 'committed'"
                        [class.bg-purple-100]="rev.source === 'manual_snapshot'"
                        [class.text-purple-800]="rev.source === 'manual_snapshot'"
                        [class.bg-amber-100]="rev.source === 'rollback'"
                        [class.text-amber-800]="rev.source === 'rollback'"
                        [class.bg-blue-100]="rev.source === 'template_switch'"
                        [class.text-blue-800]="rev.source === 'template_switch'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {{ rev.source.replace('_', ' ') }}
                      </span>
                    </div>

                    <span class="text-[11px] text-stone-400 font-mono">
                      {{ rev.formattedDate }}
                    </span>
                  </div>

                  <!-- Commit / Note Title -->
                  <p class="text-xs font-bold text-stone-900 leading-snug line-clamp-2">
                    {{ rev.commitMessage }}
                  </p>

                  <!-- Card Footer: Health & Meta -->
                  <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <div class="flex items-center gap-2">
                      <span class="text-stone-500 font-mono">{{ rev.templateName || rev.templateId }}</span>
                      <span class="text-stone-300">•</span>
                      <span class="text-stone-500 font-mono">{{ rev.jobsCount }} Job{{ rev.jobsCount === 1 ? '' : 's' }}</span>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <span 
                        [class.text-emerald-600]="rev.healthScore >= 90"
                        [class.text-amber-600]="rev.healthScore >= 70 && rev.healthScore < 90"
                        [class.text-rose-600]="rev.healthScore < 70"
                        class="font-mono font-bold text-[11px]">
                        {{ rev.healthScore }}% Health
                      </span>
                    </div>
                  </div>

                </div>
              }
            </div>
          }
        </div>

        <!-- RIGHT COLUMN: Selected Revision Diff & Inspection (7 Cols) -->
        <div class="lg:col-span-7 space-y-4">
          @if (!selectedRevision()) {
            <div class="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 space-y-2">
              <p class="text-sm font-semibold">Select a revision from the timeline to inspect changes</p>
            </div>
          } @else {
            <div class="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
              
              <!-- Inspector Header -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2.5 py-0.5 rounded-md bg-stone-900 text-white font-mono text-xs font-black">
                      Revision v{{ selectedRevision()!.version }}
                    </span>
                    <span class="text-xs text-stone-500 font-mono">{{ selectedRevision()!.filePath }}</span>
                  </div>
                  <h4 class="text-sm font-bold text-stone-900">
                    {{ selectedRevision()!.commitMessage }}
                  </h4>
                  <p class="text-[11px] text-stone-400 mt-0.5">
                    Branch: <code class="font-mono text-stone-700 bg-stone-100 px-1 py-0.5 rounded">{{ selectedRevision()!.branch }}</code>
                    &bull; Author: <span class="font-medium text-stone-600">{{ selectedRevision()!.author }}</span>
                    &bull; {{ selectedRevision()!.formattedDate }}
                  </p>
                </div>

                <!-- Primary Rollback & Restore Button -->
                <div class="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    (click)="onRollback(selectedRevision()!)"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
                    <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Rollback & Restore v{{ selectedRevision()!.version }}</span>
                  </button>
                </div>
              </div>

              <!-- View Mode Tabs (Diff vs Full YAML vs Env Vars) -->
              <div class="flex items-center justify-between border-b border-stone-100 pb-3">
                <div class="flex items-center gap-1.5">
                  <button 
                    type="button"
                    (click)="inspectorMode.set('diff')"
                    [class.bg-stone-900]="inspectorMode() === 'diff'"
                    [class.text-white]="inspectorMode() === 'diff'"
                    [class.bg-stone-100]="inspectorMode() !== 'diff'"
                    [class.text-stone-700]="inspectorMode() !== 'diff'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                    <span>Line-by-Line Diff</span>
                    @if (diffSummary()) {
                      <span class="text-[10px] font-mono opacity-80">
                        (+{{ diffSummary()!.additions }} / -{{ diffSummary()!.deletions }})
                      </span>
                    }
                  </button>

                  <button 
                    type="button"
                    (click)="inspectorMode.set('code')"
                    [class.bg-stone-900]="inspectorMode() === 'code'"
                    [class.text-white]="inspectorMode() === 'code'"
                    [class.bg-stone-100]="inspectorMode() !== 'code'"
                    [class.text-stone-700]="inspectorMode() !== 'code'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                    Full Version YAML
                  </button>

                  <button 
                    type="button"
                    (click)="inspectorMode.set('env')"
                    [class.bg-stone-900]="inspectorMode() === 'env'"
                    [class.text-white]="inspectorMode() === 'env'"
                    [class.bg-stone-100]="inspectorMode() !== 'env'"
                    [class.text-stone-700]="inspectorMode() !== 'env'"
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                    Environment Variables ({{ selectedRevision()!.envVars.length }})
                  </button>
                </div>

                <!-- Secondary Actions: Copy & Download -->
                <div class="flex items-center gap-1.5">
                  <button 
                    type="button"
                    (click)="onCopyRevisionYaml(selectedRevision()!)"
                    class="text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    @if (copiedYaml()) {
                      <span class="text-emerald-600 font-bold">Copied!</span>
                    } @else {
                      <span>Copy</span>
                    }
                  </button>

                  <button 
                    type="button"
                    (click)="onDownloadRevisionYaml(selectedRevision()!)"
                    class="text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <span>Download</span>
                  </button>

                  <button 
                    type="button"
                    (click)="onDeleteRevision(selectedRevision()!.id)"
                    title="Delete this revision from local history"
                    class="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer">
                    Delete
                  </button>
                </div>
              </div>

              <!-- DIFF MODE: Myers Unified Line Diff Inspector -->
              @if (inspectorMode() === 'diff') {
                <div class="space-y-3">
                  <!-- Diff Status Bar -->
                  <div class="flex items-center justify-between text-xs bg-stone-100 rounded-xl px-3.5 py-2 text-stone-700">
                    <div class="flex items-center gap-3 font-mono">
                      <span>Comparing: <strong class="text-purple-700">v{{ selectedRevision()!.version }}</strong> &rarr; <strong class="text-indigo-700">Current Working Code</strong></span>
                    </div>
                    @if (diffSummary()) {
                      <div class="flex items-center gap-2 font-mono text-[11px]">
                        <span class="text-emerald-600 font-bold">+{{ diffSummary()!.additions }} added</span>
                        <span class="text-rose-600 font-bold">-{{ diffSummary()!.deletions }} removed</span>
                        <span class="text-stone-400">• {{ diffSummary()!.changesCount }} changes</span>
                      </div>
                    }
                  </div>

                  @if (diffSummary() && diffSummary()!.changesCount === 0) {
                    <div class="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                      ✓ No differences detected. Current working workflow is identical to Revision v{{ selectedRevision()!.version }}.
                    </div>
                  } @else if (diffSummary()) {
                    <div class="bg-stone-950 rounded-2xl border border-stone-800 font-mono text-xs overflow-hidden max-h-[440px] overflow-y-auto">
                      <div class="divide-y divide-stone-900/60">
                        @for (line of diffSummary()!.lines; track $index) {
                          <div 
                            [class.bg-emerald-950/40]="line.type === 'added'"
                            [class.text-emerald-300]="line.type === 'added'"
                            [class.bg-rose-950/40]="line.type === 'removed'"
                            [class.text-rose-300]="line.type === 'removed'"
                            [class.text-stone-400]="line.type === 'unchanged'"
                            class="flex items-start px-2 py-0.5 leading-[20px] font-mono text-[11.5px] hover:bg-stone-900/50">
                            
                            <!-- Left Line Number (Old) -->
                            <span class="w-9 text-right pr-2 select-none text-stone-600 shrink-0 text-[10px]">
                              {{ line.oldLineNumber !== undefined ? line.oldLineNumber : '' }}
                            </span>

                            <!-- Right Line Number (New) -->
                            <span class="w-9 text-right pr-2 select-none text-stone-600 shrink-0 text-[10px] border-r border-stone-800 mr-2">
                              {{ line.newLineNumber !== undefined ? line.newLineNumber : '' }}
                            </span>

                            <!-- Sign Marker -->
                            <span 
                              [class.text-emerald-400]="line.type === 'added'"
                              [class.text-rose-400]="line.type === 'removed'"
                              [class.text-stone-600]="line.type === 'unchanged'"
                              class="w-4 select-none font-bold shrink-0">
                              {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
                            </span>

                            <!-- Content -->
                            <span class="whitespace-pre flex-1 overflow-x-auto select-text">{{ line.content }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- CODE MODE: Full Revision YAML Viewer -->
              @if (inspectorMode() === 'code') {
                <div class="bg-stone-950 rounded-2xl border border-stone-800 font-mono text-xs p-4 text-emerald-400 max-h-[440px] overflow-y-auto whitespace-pre leading-relaxed select-text">
                  <code>{{ selectedRevision()!.yamlContent }}</code>
                </div>
              }

              <!-- ENV MODE: Environment Variables Snapshot Table -->
              @if (inspectorMode() === 'env') {
                <div class="space-y-3">
                  @if (!selectedRevision()!.envVars || selectedRevision()!.envVars.length === 0) {
                    <div class="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                      No custom environment variables were defined in this revision snapshot.
                    </div>
                  } @else {
                    <div class="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden text-xs">
                      <div class="px-4 py-2.5 bg-stone-100 border-b border-stone-200 font-bold text-stone-700 flex items-center justify-between">
                        <span>Environment Key</span>
                        <span>Configured Value / Secret Expression</span>
                      </div>
                      <div class="divide-y divide-stone-200">
                        @for (env of selectedRevision()!.envVars; track env.id) {
                          <div class="px-4 py-2.5 flex items-center justify-between font-mono">
                            <div class="flex items-center gap-2">
                              <span class="font-bold text-stone-900">{{ env.key }}</span>
                              @if (env.isSecret) {
                                <span class="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 text-[10px] font-bold">SECRET</span>
                              }
                            </div>
                            <span class="text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                              {{ getEnvDisplay(env.key, env.value, env.isSecret) }}
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

            </div>
          }
        </div>

      </div>

      <!-- Save Milestone Snapshot Modal -->
      @if (showSnapshotModal()) {
        <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 class="text-base font-bold text-stone-900">Save Workflow Milestone Snapshot</h4>
              <button (click)="showSnapshotModal.set(false)" class="text-stone-400 hover:text-stone-600">&times;</button>
            </div>

            <p class="text-xs text-stone-500">
              Create a named checkpoint of your current working workflow for <code class="font-bold text-stone-800">{{ repository() }}</code>.
            </p>

            <div class="space-y-3 text-xs">
              <div>
                <span class="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                  Milestone Tag Name
                </span>
                <input 
                  type="text" 
                  [value]="snapshotTag()"
                  (input)="snapshotTag.set($any($event.target).value)"
                  placeholder="e.g. Pre-Release Build Milestone"
                  class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500" />
              </div>

              <div>
                <span class="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                  Note / Commit Description
                </span>
                <textarea 
                  rows="3"
                  [value]="snapshotNote()"
                  (input)="snapshotNote.set($any($event.target).value)"
                  placeholder="Describe key changes in this milestone..."
                  class="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-purple-500 resize-none font-sans"
                ></textarea>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button 
                type="button"
                (click)="showSnapshotModal.set(false)"
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer">
                Cancel
              </button>

              <button 
                type="button"
                (click)="onSaveSnapshotNow()"
                class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                Save Snapshot
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class WorkflowHistoryComponent {
  repository = input<string>('');
  currentYaml = input<string>('');
  currentEnvVars = input<{ id: string; key: string; value: string; isSecret?: boolean }[]>([]);
  currentBranch = input<string>('main');
  currentFilePath = input<string>('.github/workflows/deploy.yml');
  currentTemplateId = input<string>('nodejs');
  yamlStats = input<YamlLintStats | null>(null);

  rollback = output<WorkflowRevision>();
  switchToEditor = output<void>();
  snapshotSaved = output<WorkflowRevision>();

  private historyService = inject(WorkflowHistoryService);

  repoRevisions = computed(() => this.historyService.getRevisionsForRepo(this.repository()));
  selectedRevisionId = signal<string | null>(null);

  selectedRevision = computed<WorkflowRevision | null>(() => {
    const list = this.repoRevisions();
    const selId = this.selectedRevisionId();
    if (selId) {
      const found = list.find(r => r.id === selId);
      if (found) return found;
    }
    return list[0] || null;
  });

  diffSummary = computed<DiffSummary | null>(() => {
    const rev = this.selectedRevision();
    if (!rev) return null;
    return this.historyService.computeDiff(rev.yamlContent, this.currentYaml());
  });

  inspectorMode = signal<'diff' | 'code' | 'env'>('diff');
  showSnapshotModal = signal<boolean>(false);
  snapshotTag = signal<string>('Milestone Snapshot');
  snapshotNote = signal<string>('Saved workflow configuration state');
  actionToast = signal<string | null>(null);
  copiedYaml = signal<boolean>(false);

  onRollback(rev: WorkflowRevision) {
    this.rollback.emit(rev);
  }

  onSaveSnapshotNow() {
    const stats = this.yamlStats();
    const newRev = this.historyService.addRevision({
      repository: this.repository(),
      branch: this.currentBranch(),
      filePath: this.currentFilePath(),
      templateId: this.currentTemplateId(),
      templateName: 'Manual Snapshot',
      commitMessage: this.snapshotNote().trim() || 'Manual workflow configuration milestone',
      yamlContent: this.currentYaml(),
      envVars: this.currentEnvVars(),
      healthScore: stats ? stats.healthScore : 95,
      securityRating: stats ? stats.securityRating : 'A+',
      errorsCount: 0,
      warningsCount: 0,
      jobsCount: stats ? stats.jobsCount : 1,
      triggers: stats ? stats.triggers : ['push'],
      source: 'manual_snapshot',
      tag: this.snapshotTag().trim() || 'Snapshot'
    });

    this.selectedRevisionId.set(newRev.id);
    this.showSnapshotModal.set(false);
    this.snapshotSaved.emit(newRev);
    this.actionToast.set(`✓ Saved milestone snapshot v${newRev.version}`);
    setTimeout(() => this.actionToast.set(null), 3500);
  }

  onDeleteRevision(id: string) {
    this.historyService.deleteRevision(id);
    this.actionToast.set('Revision removed from history.');
    setTimeout(() => this.actionToast.set(null), 3000);
  }

  onClearHistory() {
    this.historyService.clearRepoHistory(this.repository());
    this.actionToast.set('Repository revision history cleared.');
    setTimeout(() => this.actionToast.set(null), 3000);
  }

  onResetDefaults() {
    this.historyService.resetToDefaultSeeds();
    this.actionToast.set('Workflow revision history reset to template defaults.');
    setTimeout(() => this.actionToast.set(null), 3000);
  }

  async onCopyRevisionYaml(rev: WorkflowRevision) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(rev.yamlContent);
        this.copiedYaml.set(true);
        setTimeout(() => this.copiedYaml.set(false), 2500);
      }
    } catch (err) {
      console.warn('Failed to copy YAML:', err);
    }
  }

  onDownloadRevisionYaml(rev: WorkflowRevision) {
    const blob = new Blob([rev.yamlContent], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deploy-${this.repository()}-v${rev.version}.yml`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getEnvDisplay(key: string, value: string, isSecret?: boolean): string {
    if (isSecret) {
      return '${{ secrets.' + key + ' }}';
    }
    return value || '(empty)';
  }
}
