import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SecurityComplianceService, SecurityAuditReport } from '../services/security-compliance';

@Component({
  selector: 'app-security-compliance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-stone-900">Pipeline Security & SLSA Compliance Suite</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                SUPPLY CHAIN DEFENSE
              </span>
            </div>
            <p class="text-xs text-stone-500">Audit your CI/CD pipeline against SLSA Level 1-3 standards, OpenSSF Scorecards, and secret leaks.</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="pinAllActions()"
            class="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pin All Actions to Commit SHAs
          </button>
        </div>
      </div>

      <!-- Scorecards & Rating Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <!-- Overall Score -->
        <div class="p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <span class="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Security Score</span>
          <div class="flex items-baseline gap-2">
            <span 
              [class.text-emerald-600]="audit().overallScore >= 80"
              [class.text-amber-600]="audit().overallScore >= 60 && audit().overallScore < 80"
              [class.text-rose-600]="audit().overallScore < 60"
              class="text-3xl font-black">
              {{ audit().overallScore }}
            </span>
            <span class="text-xs text-stone-400">/ 100</span>
          </div>
          <span class="text-[10px] text-stone-500 mt-1 block">{{ audit().passedChecksCount }} of {{ audit().totalChecksCount }} criteria passed</span>
        </div>

        <!-- SLSA Level Achieved -->
        <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
          <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">SLSA Standard Achieved</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-blue-950">{{ audit().slsaLevelAchieved }}</span>
          </div>
          <span class="text-[10px] text-blue-700 mt-1 block">Supply-chain Levels for Software Artifacts</span>
        </div>

        <!-- Critical Alerts -->
        <div 
          [class.bg-emerald-50]="audit().criticalIssuesCount === 0"
          [class.border-emerald-200]="audit().criticalIssuesCount === 0"
          [class.bg-rose-50]="audit().criticalIssuesCount > 0"
          [class.border-rose-200]="audit().criticalIssuesCount > 0"
          class="p-4 rounded-2xl border">
          <span 
            [class.text-emerald-700]="audit().criticalIssuesCount === 0"
            [class.text-rose-700]="audit().criticalIssuesCount > 0"
            class="text-[11px] font-bold uppercase tracking-wider block mb-1">
            Critical Alerts
          </span>
          <div class="flex items-baseline gap-2">
            <span 
              [class.text-emerald-900]="audit().criticalIssuesCount === 0"
              [class.text-rose-900]="audit().criticalIssuesCount > 0"
              class="text-2xl font-black">
              {{ audit().criticalIssuesCount }}
            </span>
            <span class="text-xs text-stone-500">issues</span>
          </div>
          <span class="text-[10px] text-stone-600 mt-1 block">
            {{ audit().criticalIssuesCount === 0 ? 'No supply-chain vulnerabilities' : 'Requires immediate remediation' }}
          </span>
        </div>

        <!-- Leaked Secret Count -->
        <div 
          [class.bg-emerald-50]="audit().leakedSecrets.length === 0"
          [class.border-emerald-200]="audit().leakedSecrets.length === 0"
          [class.bg-rose-50]="audit().leakedSecrets.length > 0"
          [class.border-rose-200]="audit().leakedSecrets.length > 0"
          class="p-4 rounded-2xl border">
          <span 
            [class.text-emerald-700]="audit().leakedSecrets.length === 0"
            [class.text-rose-700]="audit().leakedSecrets.length > 0"
            class="text-[11px] font-bold uppercase tracking-wider block mb-1">
            Leaked Plaintext Secrets
          </span>
          <div class="flex items-baseline gap-2">
            <span 
              [class.text-emerald-900]="audit().leakedSecrets.length === 0"
              [class.text-rose-900]="audit().leakedSecrets.length > 0"
              class="text-2xl font-black">
              {{ audit().leakedSecrets.length }}
            </span>
            <span class="text-xs text-stone-500">tokens</span>
          </div>
          <span class="text-[10px] text-stone-600 mt-1 block">Scanned with 8 secret regexes</span>
        </div>

      </div>

      <!-- Leaked Secret Warnings (if any) -->
      @if (audit().leakedSecrets.length > 0) {
        <div class="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-3">
          <div class="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>SECURITY WARNING: Potential Hardcoded Secrets Detected in Workflow YAML!</span>
          </div>

          <div class="space-y-2">
            @for (leak of audit().leakedSecrets; track leak.id) {
              <div class="p-3 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-3 text-xs">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="font-bold text-stone-900">{{ leak.type }}</span>
                    <span class="text-[10px] font-mono text-stone-500">Line {{ leak.lineNumber }}</span>
                  </div>
                  <code class="text-rose-600 font-mono text-[11px] bg-rose-50 px-1.5 py-0.5 rounded">{{ leak.maskedSnippet }}</code>
                </div>

                <button 
                  type="button"
                  (click)="redactSecret(leak.matchSnippet, leak.suggestedSecretKey)"
                  class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer">
                  Wrap in {{ '\${{ secrets.' + leak.suggestedSecretKey + ' }}' }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Detailed Checklist of SLSA & OpenSSF Rules -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500">Compliance & Supply-Chain Rules</h4>

        <div class="space-y-3">
          @for (check of audit().findings; track check.id) {
            <div 
              [class.border-emerald-200]="check.passed"
              [class.bg-emerald-50/20]="check.passed"
              [class.border-rose-200]="!check.passed"
              [class.bg-rose-50/20]="!check.passed"
              class="p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div class="space-y-1 max-w-2xl">
                <div class="flex items-center gap-2">
                  <span 
                    [class.bg-emerald-100]="check.passed"
                    [class.text-emerald-800]="check.passed"
                    [class.bg-rose-100]="!check.passed"
                    [class.text-rose-800]="!check.passed"
                    class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {{ check.passed ? '✓' : '✗' }}
                  </span>
                  <h5 class="text-sm font-bold text-stone-900">{{ check.name }}</h5>
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600 uppercase">
                    {{ check.level }}
                  </span>
                </div>

                <p class="text-xs text-stone-600 leading-relaxed pl-7">{{ check.details }}</p>
                <p class="text-[11px] text-stone-500 font-mono pl-7">💡 <strong>Remediation:</strong> {{ check.recommendation }}</p>
              </div>

              <!-- Action button if available -->
              @if (!check.passed && check.autoFixAvailable) {
                <div class="shrink-0 pl-7 md:pl-0">
                  @if (check.id === 'SLSA-PIN-SHA') {
                    <button 
                      type="button"
                      (click)="pinAllActions()"
                      class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
                      Auto-Pin SHAs
                    </button>
                  } @else if (check.id === 'SLSA-PERM-LEAST') {
                    <button 
                      type="button"
                      (click)="injectPermissionsBlock()"
                      class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
                      Add "permissions: contents: read"
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class SecurityComplianceComponent {
  yamlText = input<string>('');
  yamlUpdated = output<string>();

  secService = inject(SecurityComplianceService);

  audit = computed<SecurityAuditReport>(() => {
    return this.secService.auditWorkflow(this.yamlText());
  });

  pinAllActions() {
    const updated = this.secService.pinActionsToCommitShas(this.yamlText());
    this.yamlUpdated.emit(updated);
  }

  redactSecret(secretMatch: string, keyName: string) {
    const updated = this.secService.redactSecretInYaml(this.yamlText(), secretMatch, keyName);
    this.yamlUpdated.emit(updated);
  }

  injectPermissionsBlock() {
    let result = this.yamlText();
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
      this.yamlUpdated.emit(result);
    }
  }
}
