import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StabilityChart } from './components/stability-chart';
import { WorkflowValidatorComponent } from './components/workflow-validator';
import { WorkflowHistoryComponent } from './components/workflow-history';
import { CicdSimulatorComponent } from './components/cicd-simulator';
import { WorkflowOptimizerComponent } from './components/workflow-optimizer';
import { SecurityComplianceComponent } from './components/security-compliance';
import { NotificationHubComponent } from './components/notification-hub';
import { DoraAnalyticsComponent } from './components/dora-analytics';
import { CloudExportersComponent } from './components/cloud-exporters';
import { LandingPageComponent } from './components/landing-page';
import { PricingModalComponent } from './components/pricing-modal';
import { BillingPortalComponent } from './components/billing-portal';
import { TeamManagementComponent } from './components/team-management';
import { BillingSubscriptionService } from './services/billing-subscription';
import { OrganizationTeamService } from './services/organization-team';
import { WebhookService } from './services/webhook';
import { YamlLinter, YamlLintResult, YamlLintIssue, YamlLintStats } from './services/yaml-lint';
import { WorkflowHistoryService, WorkflowRevision, DiffSummary } from './services/workflow-history';

export type PollingUnit = 'ms' | 's' | 'min';

export interface RepoFileItem {
  path: string;
  name: string;
  type: 'file' | 'dir';
  size: number;
}

export interface DebugExecResult {
  command: string;
  output: string;
  exitCode: number;
  durationMs: number;
  timestamp: string;
}

export interface GitHubAccount {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  token: string;
  public_repos: number;
  total_private_repos?: number;
  addedAt: number;
}

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  private: boolean;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  default_branch?: string;
}

export interface DeploymentRecord {
  pipelineId: string;
  repoFullName: string;
  branch: string;
  environment: 'Production' | 'Staging' | 'Preview';
  status: 'Active' | 'Building' | 'Success' | 'Failed' | 'Paused' | 'Cancelled';
  autoDeployOnPush: boolean;
  deployedAt: string;
  liveUrl: string;
  logs: string[];
}

export interface WorkflowTemplateOption {
  id: 'nodejs' | 'python' | 'staticsite' | 'docker' | 'golang';
  name: string;
  category: string;
  icon: string;
  badge: string;
  description: string;
  features: string[];
  defaultBranch: string;
  defaultFilePath: string;
}

export interface ConfigEnvVar {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    CommonModule, 
    StabilityChart, 
    WorkflowValidatorComponent, 
    WorkflowHistoryComponent,
    CicdSimulatorComponent,
    WorkflowOptimizerComponent,
    SecurityComplianceComponent,
    NotificationHubComponent,
    DoraAnalyticsComponent,
    CloudExportersComponent,
    LandingPageComponent,
    PricingModalComponent,
    BillingPortalComponent,
    TeamManagementComponent
  ],
  template: `
    @if (viewMode() === 'landing') {
      <app-landing-page 
        (launchApp)="viewMode.set('app')" 
        (openPricing)="showPricingModal.set(true)">
      </app-landing-page>
    } @else {
      <div class="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col selection:bg-stone-200">
        
        <!-- Top Navigation Bar -->
        <header class="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-stone-900 text-white rounded-xl flex items-center justify-center font-bold tracking-wider text-sm shadow-xs">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-stone-900 tracking-tight text-base">ShipPulse</span>
                <span class="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">v2.0 PRO</span>
              </div>
              <p class="text-xs text-stone-400 hidden sm:block">High-Velocity CI/CD & DORA Telemetry</p>
            </div>
          </div>

          <!-- Navigation / Active Account Controls -->
          <div class="flex items-center gap-3">
            @if (activeAccount()) {
              
              <!-- Tab Switcher -->
              <nav class="hidden lg:flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold mr-2 gap-1">
                <button 
                  (click)="currentTab.set('repos')"
                  [class.bg-white]="currentTab() === 'repos'"
                  [class.shadow-xs]="currentTab() === 'repos'"
                  [class.text-stone-900]="currentTab() === 'repos'"
                  [class.text-stone-500]="currentTab() !== 'repos'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Repositories
                </button>
                <button 
                  (click)="currentTab.set('pipelines')"
                  [class.bg-white]="currentTab() === 'pipelines'"
                  [class.shadow-xs]="currentTab() === 'pipelines'"
                  [class.text-stone-900]="currentTab() === 'pipelines'"
                  [class.text-stone-500]="currentTab() !== 'pipelines'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Pipelines ({{ deployments().length }})
                </button>
                <button 
                  (click)="currentTab.set('analytics')"
                  [class.bg-white]="currentTab() === 'analytics'"
                  [class.shadow-xs]="currentTab() === 'analytics'"
                  [class.text-amber-900]="currentTab() === 'analytics'"
                  [class.text-stone-500]="currentTab() !== 'analytics'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>DORA Analytics</span>
                </button>
                <button 
                  (click)="currentTab.set('simulator')"
                  [class.bg-white]="currentTab() === 'simulator'"
                  [class.shadow-xs]="currentTab() === 'simulator'"
                  [class.text-emerald-900]="currentTab() === 'simulator'"
                  [class.text-stone-500]="currentTab() !== 'simulator'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  <span>Virtual Runner</span>
                  <span class="text-[9px] font-mono px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">DRY-RUN</span>
                </button>

                <!-- Pro Suite Dropdown Trigger -->
                <div class="relative">
                  <button 
                    type="button"
                    (click)="showProMenu.set(!showProMenu())"
                    [class.bg-white]="currentTab() === 'optimizer' || currentTab() === 'security' || currentTab() === 'notifications' || currentTab() === 'cloud' || currentTab() === 'webhooks'"
                    [class.text-stone-900]="currentTab() === 'optimizer' || currentTab() === 'security' || currentTab() === 'notifications' || currentTab() === 'cloud' || currentTab() === 'webhooks'"
                    [class.text-stone-500]="currentTab() !== 'optimizer' && currentTab() !== 'security' && currentTab() !== 'notifications' && currentTab() !== 'cloud' && currentTab() !== 'webhooks'"
                    class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer">
                    <span class="text-xs">⚡ Pro Suite</span>
                    <svg class="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  @if (showProMenu()) {
                    <div class="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-50 text-xs">
                      <button 
                        type="button"
                        (click)="currentTab.set('optimizer'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-indigo-50]="currentTab() === 'optimizer'"
                        [class.text-indigo-900]="currentTab() === 'optimizer'">
                        <span class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">AI</span>
                        <div>
                          <p class="font-bold">AI Workflow Optimizer</p>
                          <p class="text-[10px] text-stone-400">Cost forecaster & multi-tier caching</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        (click)="currentTab.set('security'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-rose-50]="currentTab() === 'security'"
                        [class.text-rose-900]="currentTab() === 'security'">
                        <span class="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">🛡️</span>
                        <div>
                          <p class="font-bold">Pipeline Security & SLSA</p>
                          <p class="text-[10px] text-stone-400">Supply chain defense & secret scan</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        (click)="currentTab.set('notifications'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-emerald-50]="currentTab() === 'notifications'"
                        [class.text-emerald-900]="currentTab() === 'notifications'">
                        <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">🔔</span>
                        <div>
                          <p class="font-bold">Alerts & ChatOps</p>
                          <p class="text-[10px] text-stone-400">Slack, Discord & Telegram channels</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        (click)="currentTab.set('cloud'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-sky-50]="currentTab() === 'cloud'"
                        [class.text-sky-900]="currentTab() === 'cloud'">
                        <span class="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[10px]">☁️</span>
                        <div>
                          <p class="font-bold">Multi-Cloud Exporters</p>
                          <p class="text-[10px] text-stone-400">GCP Cloud Run, AWS ECS, Vercel</p>
                        </div>
                      </button>

                      <div class="my-1 border-t border-stone-100"></div>

                      <button 
                        type="button"
                        (click)="currentTab.set('team'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-purple-50]="currentTab() === 'team'"
                        [class.text-purple-900]="currentTab() === 'team'">
                        <span class="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">👥</span>
                        <div>
                          <p class="font-bold">Team & API Tokens</p>
                          <p class="text-[10px] text-stone-400">RBAC members, PATs, SOC2 audit</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        (click)="currentTab.set('billing'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-emerald-50]="currentTab() === 'billing'"
                        [class.text-emerald-900]="currentTab() === 'billing'">
                        <span class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">💳</span>
                        <div>
                          <p class="font-bold">Billing & Invoices</p>
                          <p class="text-[10px] text-stone-400">Manage plan, cards & receipts</p>
                        </div>
                      </button>

                      <button 
                        type="button"
                        (click)="currentTab.set('webhooks'); showProMenu.set(false)"
                        class="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 cursor-pointer text-stone-700 hover:text-stone-900"
                        [class.bg-stone-100]="currentTab() === 'webhooks'">
                        <span class="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[10px]">⚡</span>
                        <div>
                          <p class="font-bold">Webhooks & Triggers</p>
                          <p class="text-[10px] text-stone-400">Event history & live listener</p>
                        </div>
                      </button>
                    </div>
                  }
                </div>

                <button 
                  (click)="openDebugTab()"
                  [class.bg-white]="currentTab() === 'debug'"
                  [class.shadow-xs]="currentTab() === 'debug'"
                  [class.text-stone-900]="currentTab() === 'debug'"
                  [class.text-stone-500]="currentTab() !== 'debug'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Debug & Run</span>
                </button>
                <button 
                  (click)="openConfigTab()"
                  [class.bg-white]="currentTab() === 'config'"
                  [class.shadow-xs]="currentTab() === 'config'"
                  [class.text-stone-900]="currentTab() === 'config'"
                  [class.text-stone-500]="currentTab() !== 'config'"
                  class="px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Workflow Studio</span>
                </button>
              </nav>

              <!-- View Mode Toggle (Marketing Landing Page vs Dev Console) -->
              <button 
                type="button"
                (click)="viewMode.set(viewMode() === 'landing' ? 'app' : 'landing')"
                class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-all cursor-pointer shadow-2xs">
                @if (viewMode() === 'app') {
                  <span class="text-emerald-600">🌐</span>
                  <span>Marketing Page</span>
                } @else {
                  <span class="text-indigo-600">⚡</span>
                  <span>Dev Console</span>
                }
              </button>

              <!-- Upgrade / Tier Badge Button -->
              <button 
                type="button"
                (click)="showPricingModal.set(true)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer">
                <span>⭐</span>
                <span class="uppercase tracking-wider text-[10px]">{{ billingService.currentPlan().name }}</span>
                <span class="text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">UPGRADE</span>
              </button>

              <!-- Multi-Account Dropdown Button -->
              <div class="relative">
                <button 
                  (click)="showAccountMenu.set(!showAccountMenu())"
                  class="flex items-center gap-2.5 bg-stone-100 hover:bg-stone-200/80 p-1.5 pr-3 rounded-full border border-stone-200/60 transition-all text-left">
                  <img 
                    [src]="activeAccount()?.avatar_url || 'https://github.com/ghost.png'" 
                    [alt]="activeAccount()?.login || 'User'"
                    class="w-7 h-7 rounded-full object-cover border border-white shadow-xs" 
                  />
                  <div class="hidden sm:block leading-tight">
                    <span class="text-xs font-semibold text-stone-900 block truncate max-w-[100px]">
                      {{ activeAccount()?.login }}
                    </span>
                    <span class="text-[10px] text-stone-500 block">
                      {{ accounts().length }} {{ accounts().length === 1 ? 'account' : 'accounts' }}
                    </span>
                  </div>
                  <svg class="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Modal -->
                @if (showAccountMenu()) {
                  <div class="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div class="px-4 py-2 border-b border-stone-100">
                      <p class="text-xs font-semibold uppercase tracking-wider text-stone-400">Connected Accounts</p>
                    </div>

                    <div class="max-h-60 overflow-y-auto py-1 divide-y divide-stone-50">
                      @for (acc of accounts(); track acc.id) {
                        <button 
                          type="button"
                          (click)="selectAccount(acc)"
                          class="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-stone-50 cursor-pointer transition-colors"
                          [class.bg-stone-50]="acc.id === activeAccount()?.id">
                          <div class="flex items-center gap-3 min-w-0">
                            <img [src]="acc.avatar_url" [alt]="acc.login" class="w-8 h-8 rounded-full border border-stone-200 shrink-0" />
                            <div class="truncate">
                              <p class="text-xs font-bold text-stone-900 truncate">{{ acc.name || acc.login }}</p>
                              <p class="text-[11px] text-stone-500 truncate">&#64;{{ acc.login }}</p>
                            </div>
                          </div>
                          @if (acc.id === activeAccount()?.id) {
                            <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                          }
                        </button>
                      }
                    </div>

                    <div class="p-2 border-t border-stone-100 flex flex-col gap-1">
                      <button 
                        (click)="openAddAccountModal()"
                        class="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg flex items-center gap-2 transition-colors">
                        <svg class="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Account
                      </button>
                      <button 
                        (click)="disconnectActiveAccount()"
                        class="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors">
                        <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out of &#64;{{ activeAccount()?.login }}
                      </button>
                    </div>
                  </div>
                }
              </div>

            } @else {
              <button 
                (click)="openAddAccountModal()"
                class="bg-stone-900 text-white hover:bg-stone-800 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-xs flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
                Connect Account
              </button>
            }
          </div>

        </div>
      </header>

      <!-- Main Content Container -->
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        <!-- Case 1: No Connected Account (Welcome / Connect View) -->
        @if (!activeAccount()) {
          <div class="max-w-xl mx-auto py-12 text-center">
            
            <div class="w-16 h-16 bg-white border border-stone-200 rounded-2xl shadow-xs flex items-center justify-center mx-auto mb-6">
              <svg class="w-8 h-8 text-stone-900" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </div>

            <h2 class="text-3xl font-bold text-stone-900 tracking-tight mb-3">Welcome to ShipPulse</h2>
            <p class="text-stone-500 text-base leading-relaxed mb-8 max-w-md mx-auto">
              Automate CI/CD pipelines, webhook synchronization, and production deployments across multiple personal and team GitHub accounts.
            </p>

            <!-- Card for Connection Methods -->
            <div class="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
              <h3 class="text-lg font-bold text-stone-900 mb-1">Connect Your GitHub Account</h3>
              <p class="text-xs text-stone-500 mb-6">Choose your preferred connection method below:</p>

              <!-- Option A: Token Connection (Universal, 100% Reliable & Mobile-Friendly) -->
              <div class="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Instant GitHub Token (Recommended)
                  </span>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,user,read:org&description=ShipPulse" 
                    target="_blank" 
                    class="text-xs font-semibold text-stone-700 hover:text-stone-900 underline">
                    Generate token &rarr;
                  </a>
                </div>
                <p class="text-xs text-stone-500 mb-3">
                  Paste a GitHub Personal Access Token (<code class="bg-white px-1 py-0.5 rounded border text-stone-700">ghp_...</code>) or Fine-Grained Token.
                </p>
                <div class="flex gap-2">
                  <input 
                    type="password" 
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                    aria-label="GitHub Personal Access Token"
                    [value]="tokenInput()"
                    (input)="tokenInput.set($any($event.target).value)"
                    class="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                  />
                  <button 
                    (click)="connectWithToken()"
                    [disabled]="isVerifyingToken() || !tokenInput().trim()"
                    class="bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-xs flex items-center gap-2 shrink-0">
                    @if (isVerifyingToken()) {
                      <span class="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></span>
                      Validating...
                    } @else {
                      Connect
                    }
                  </button>
                </div>
                @if (tokenError()) {
                  <p class="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ tokenError() }}
                  </p>
                }
              </div>

              <!-- Option B: OAuth Login -->
              <div class="border-t border-stone-100 pt-6">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h4 class="text-sm font-semibold text-stone-800">Or use OAuth 2.0 Web Login</h4>
                    <p class="text-xs text-stone-400">Requires configured OAuth Client credentials.</p>
                  </div>
                </div>

                @if (authUrl()) {
                  <a 
                    [href]="authUrl()" 
                    (click)="isConnectingOAuth.set(true)"
                    class="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 py-3 px-4 rounded-xl font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                    </svg>
                    Continue with GitHub OAuth
                  </a>
                } @else {
                  <div class="text-xs text-stone-400 py-2 text-center">
                    Loading OAuth provider configuration...
                  </div>
                }
              </div>

              <!-- Security Guarantee Badge -->
              <div class="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-stone-400 text-xs">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Zero-storage policy: Access keys are protected by client sandbox isolation.</span>
              </div>

            </div>
          </div>
        } @else {
          
          <!-- Case 2: Active Account View -->

          <!-- Sub-header with User Info & Stats -->
          <div class="bg-white border border-stone-200 rounded-3xl p-6 mb-8 shadow-xs">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <!-- Profile Details -->
              <div class="flex items-center gap-4">
                <img 
                  [src]="activeAccount()?.avatar_url" 
                  [alt]="activeAccount()?.login" 
                  class="w-16 h-16 rounded-2xl border-2 border-stone-100 shadow-sm"
                />
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="text-xl font-bold text-stone-900 tracking-tight">{{ activeAccount()?.name }}</h2>
                    <span class="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">&#64;{{ activeAccount()?.login }}</span>
                  </div>
                  <p class="text-xs text-stone-500 mt-1 max-w-md">{{ activeAccount()?.bio }}</p>
                  
                  <div class="flex items-center gap-4 mt-2 text-xs text-stone-400">
                    <span><strong>{{ repos().length }}</strong> repos loaded</span>
                    <span>•</span>
                    <span><strong>{{ activeAccount()?.public_repos }}</strong> public</span>
                    <span>•</span>
                    <span><strong>{{ activeAccount()?.total_private_repos || 0 }}</strong> private</span>
                  </div>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="flex flex-wrap items-center gap-3">
                <button 
                  (click)="loadRepos()"
                  [disabled]="isLoadingRepos()"
                  class="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" [class.animate-spin]="isLoadingRepos()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Repos
                </button>
                <button 
                  (click)="openAddAccountModal()"
                  class="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Switch / Add Account
                </button>
              </div>

            </div>
          </div>

          <!-- TAB 1: REPOSITORIES -->
          @if (currentTab() === 'repos') {
            
            <!-- Filters & Search Toolbar -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-bold text-stone-900">Repositories</h3>
                <span class="text-xs font-semibold bg-stone-200/70 text-stone-700 px-2.5 py-0.5 rounded-full">
                  {{ filteredRepos().length }}
                </span>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <!-- Search Input -->
                <div class="relative flex-1 sm:w-72">
                  <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search by repo or language..." 
                    [value]="searchQuery()"
                    (input)="searchQuery.set($any($event.target).value)"
                    class="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all placeholder:text-stone-400 shadow-xs"
                  />
                </div>

                <!-- Visibility Toggle Buttons -->
                <div class="flex bg-stone-200/60 p-1 rounded-xl shrink-0">
                  <button 
                    (click)="filter.set('all')"
                    [class.bg-white]="filter() === 'all'"
                    [class.shadow-xs]="filter() === 'all'"
                    [class.text-stone-900]="filter() === 'all'"
                    [class.text-stone-500]="filter() !== 'all'"
                    class="px-3 py-1 rounded-lg text-xs font-semibold transition-all">All</button>
                  <button 
                    (click)="filter.set('public')"
                    [class.bg-white]="filter() === 'public'"
                    [class.shadow-xs]="filter() === 'public'"
                    [class.text-stone-900]="filter() === 'public'"
                    [class.text-stone-500]="filter() !== 'public'"
                    class="px-3 py-1 rounded-lg text-xs font-semibold transition-all">Public</button>
                  <button 
                    (click)="filter.set('private')"
                    [class.bg-white]="filter() === 'private'"
                    [class.shadow-xs]="filter() === 'private'"
                    [class.text-stone-900]="filter() === 'private'"
                    [class.text-stone-500]="filter() !== 'private'"
                    class="px-3 py-1 rounded-lg text-xs font-semibold transition-all">Private</button>
                </div>
              </div>

            </div>

            <!-- Repository Cards Grid -->
            @if (isLoadingRepos()) {
              <div class="py-20 text-center flex flex-col items-center justify-center">
                <span class="w-8 h-8 border-3 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-3"></span>
                <p class="text-xs text-stone-500">Loading repositories for &#64;{{ activeAccount()?.login }}...</p>
              </div>
            } @else if (error()) {
              <div class="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-800">
                <h4 class="font-bold text-sm mb-1">Failed to synchronize repositories</h4>
                <p class="text-xs text-red-600 mb-4">{{ error() }}</p>
                <button (click)="loadRepos()" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors">
                  Retry
                </button>
              </div>
            } @else {
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (repo of filteredRepos(); track repo.id) {
                  <div class="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col hover:border-stone-400/80 transition-all shadow-xs relative group">
                    
                    <!-- Header -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="min-w-0 flex-1">
                        <a 
                          [href]="repo.html_url" 
                          target="_blank" 
                          class="font-bold text-sm text-stone-900 hover:underline truncate block">
                          {{ repo.name }}
                        </a>
                        <span class="text-[11px] text-stone-400 block truncate">{{ repo.full_name }}</span>
                      </div>
                      
                      @if (repo.private) {
                        <span class="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-md shrink-0">
                          Private
                        </span>
                      } @else {
                        <span class="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md shrink-0">
                          Public
                        </span>
                      }
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-stone-500 line-clamp-2 my-2 flex-1 min-h-[2rem]">
                      {{ repo.description || 'No description provided.' }}
                    </p>

                    <!-- Meta Tags -->
                    <div class="flex items-center gap-3 text-[11px] text-stone-400 mb-4">
                      @if (repo.language) {
                        <span class="flex items-center gap-1 font-medium text-stone-600">
                          <span class="w-2 h-2 rounded-full bg-stone-400"></span>
                          {{ repo.language }}
                        </span>
                      }
                      <span>Updated {{ formatDate(repo.updated_at) }}</span>
                    </div>

                    <!-- Deployment Trigger & Debug Action Buttons -->
                    <div class="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5">
                        <button 
                          type="button"
                          (click)="openDebugForRepo(repo.name)"
                          title="Open interactive code editor, test runner and live sandbox"
                          class="text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          <span>Debug</span>
                        </button>

                        <button 
                          type="button"
                          (click)="openConfigForRepo(repo.name)"
                          title="Generate or customize .github/workflows/deploy.yml templates"
                          class="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          </svg>
                          <span>CI/CD</span>
                        </button>
                      </div>

                      <div class="flex items-center gap-2">
                        @if (isRepoDeployed(repo.full_name)) {
                          <span class="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Automated
                          </span>
                        } @else {
                          <button 
                            (click)="triggerDeploy(repo)"
                            [disabled]="deployingRepo() === repo.full_name"
                            class="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5">
                            @if (deployingRepo() === repo.full_name) {
                              <span class="w-3.5 h-3.5 border-2 border-stone-400 border-t-white rounded-full animate-spin"></span>
                              Configuring...
                            } @else {
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Automate Pipeline
                            }
                          </button>
                        }
                      </div>
                    </div>

                  </div>
                }

                @if (filteredRepos().length === 0) {
                  <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 border-dashed p-6">
                    <p class="text-sm font-semibold text-stone-700 mb-1">No matching repositories found</p>
                    <p class="text-xs text-stone-400">Try adjusting your search query or filter selection.</p>
                  </div>
                }
              </div>

            }

          }

          <!-- TAB 2: ACTIVE PIPELINES -->
          @if (currentTab() === 'pipelines') {
            <div class="space-y-5">
              
              <!-- D3 Deployment Success Rate & Stability Visualizer -->
              <app-stability-chart [pipelineCount]="deployments().length"></app-stability-chart>

              <!-- Header & Polling Controls Bar -->
              <div class="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <h3 class="text-lg font-bold text-stone-900">Active CI/CD Pipelines</h3>
                      <span class="text-xs font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
                        {{ deployments().length }} Active
                      </span>
                    </div>
                    <p class="text-xs text-stone-500 mt-0.5">
                      Real-time deployment event streaming and automatic container telemetry monitoring.
                    </p>
                  </div>

                  <!-- Quick Status & Global Poll Trigger -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="pollPipelines()"
                      [disabled]="isPollingNow()"
                      class="text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5 text-stone-600" [class.animate-spin]="isPollingNow()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{{ isPollingNow() ? 'Polling Logs...' : 'Refresh Now' }}</span>
                    </button>

                    <button
                      type="button"
                      (click)="toggleAutoPolling()"
                      [class.bg-emerald-600]="isPollingActive()"
                      [class.text-white]="isPollingActive()"
                      [class.bg-stone-200]="!isPollingActive()"
                      [class.text-stone-700]="!isPollingActive()"
                      class="text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-2xs">
                      <span 
                        class="w-2 h-2 rounded-full"
                        [class.bg-white]="isPollingActive()"
                        [class.animate-pulse]="isPollingActive()"
                        [class.bg-stone-500]="!isPollingActive()">
                      </span>
                      <span>{{ isPollingActive() ? 'Auto-Polling: ON' : 'Auto-Polling: OFF' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Interval & Time Measurement Units Selector -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 text-xs">
                  
                  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span class="font-semibold text-stone-600 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Poll Interval:
                    </span>

                    <!-- Value Input -->
                    <div class="flex items-center bg-stone-50 border border-stone-300 rounded-xl overflow-hidden shadow-2xs focus-within:border-stone-500">
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.5" 
                        [value]="pollingIntervalValue()" 
                        (input)="onIntervalValueChange($event)"
                        class="w-16 px-2.5 py-1.5 text-xs text-stone-900 bg-transparent outline-none font-mono text-center"
                        aria-label="Polling interval number value"
                      />
                      
                      <!-- Unit of Time Dropdown -->
                      <select 
                        [value]="pollingIntervalUnit()" 
                        (change)="onIntervalUnitChange($event)"
                        class="px-2.5 py-1.5 bg-stone-100 border-l border-stone-200 text-stone-800 text-xs font-semibold outline-none cursor-pointer hover:bg-stone-200 transition-colors"
                        aria-label="Polling interval unit of measurement">
                        <option value="ms">Milliseconds (ms)</option>
                        <option value="s">Seconds (s)</option>
                        <option value="min">Minutes (min)</option>
                      </select>
                    </div>

                    <!-- Quick Preset Pills -->
                    <div class="flex items-center gap-1 overflow-x-auto py-0.5">
                      <span class="text-stone-400 text-[11px] ml-1 mr-0.5">Presets:</span>
                      
                      <button 
                        type="button" 
                        (click)="setPresetInterval(500, 'ms')"
                        [class.bg-stone-900]="pollingIntervalValue() === 500 && pollingIntervalUnit() === 'ms'"
                        [class.text-white]="pollingIntervalValue() === 500 && pollingIntervalUnit() === 'ms'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 500 && pollingIntervalUnit() === 'ms')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 500 && pollingIntervalUnit() === 'ms')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        500ms
                      </button>

                      <button 
                        type="button" 
                        (click)="setPresetInterval(1, 's')"
                        [class.bg-stone-900]="pollingIntervalValue() === 1 && pollingIntervalUnit() === 's'"
                        [class.text-white]="pollingIntervalValue() === 1 && pollingIntervalUnit() === 's'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 1 && pollingIntervalUnit() === 's')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 1 && pollingIntervalUnit() === 's')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        1s
                      </button>

                      <button 
                        type="button" 
                        (click)="setPresetInterval(3, 's')"
                        [class.bg-stone-900]="pollingIntervalValue() === 3 && pollingIntervalUnit() === 's'"
                        [class.text-white]="pollingIntervalValue() === 3 && pollingIntervalUnit() === 's'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 3 && pollingIntervalUnit() === 's')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 3 && pollingIntervalUnit() === 's')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        3s
                      </button>

                      <button 
                        type="button" 
                        (click)="setPresetInterval(5, 's')"
                        [class.bg-stone-900]="pollingIntervalValue() === 5 && pollingIntervalUnit() === 's'"
                        [class.text-white]="pollingIntervalValue() === 5 && pollingIntervalUnit() === 's'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 5 && pollingIntervalUnit() === 's')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 5 && pollingIntervalUnit() === 's')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        5s
                      </button>

                      <button 
                        type="button" 
                        (click)="setPresetInterval(10, 's')"
                        [class.bg-stone-900]="pollingIntervalValue() === 10 && pollingIntervalUnit() === 's'"
                        [class.text-white]="pollingIntervalValue() === 10 && pollingIntervalUnit() === 's'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 10 && pollingIntervalUnit() === 's')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 10 && pollingIntervalUnit() === 's')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        10s
                      </button>

                      <button 
                        type="button" 
                        (click)="setPresetInterval(1, 'min')"
                        [class.bg-stone-900]="pollingIntervalValue() === 1 && pollingIntervalUnit() === 'min'"
                        [class.text-white]="pollingIntervalValue() === 1 && pollingIntervalUnit() === 'min'"
                        [class.bg-stone-100]="!(pollingIntervalValue() === 1 && pollingIntervalUnit() === 'min')"
                        [class.text-stone-700]="!(pollingIntervalValue() === 1 && pollingIntervalUnit() === 'min')"
                        class="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-stone-200 transition-colors cursor-pointer">
                        1min
                      </button>
                    </div>
                  </div>

                  <!-- Polling Telemetry Feed -->
                  <div class="flex items-center gap-3 text-stone-500 font-mono text-[11px]">
                    @if (isPollingActive()) {
                      <div class="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                        <span>Rate: {{ pollingIntervalDisplay() }}</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-1.5 bg-stone-100 text-stone-600 px-2.5 py-1 rounded-lg">
                        <span>Rate: Paused</span>
                      </div>
                    }

                    @if (lastPolledAt()) {
                      <span>Last poll: <strong class="text-stone-700">{{ lastPolledAt() }}</strong></span>
                    }
                  </div>

                </div>
              </div>

              <!-- Pipeline Cards List -->
              @for (deploy of deployments(); track deploy.pipelineId) {
                <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4 transition-all hover:border-stone-300">
                  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="space-y-1.5">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="font-bold text-sm text-stone-900">{{ deploy.repoFullName }}</span>
                        
                        <!-- Status Indicator Pill with Icon -->
                        @switch (deploy.status) {
                          @case ('Active') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                              <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Active</span>
                            </span>
                          }
                          @case ('Success') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                              <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Success</span>
                            </span>
                          }
                          @case ('Building') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                              <svg class="w-3 h-3 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Building...</span>
                            </span>
                          }
                          @case ('Paused') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-300/80 rounded-md">
                              <svg class="w-3 h-3 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6" />
                              </svg>
                              <span>Paused</span>
                            </span>
                          }
                          @case ('Cancelled') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 border border-stone-300 rounded-md">
                              <svg class="w-3 h-3 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Cancelled</span>
                            </span>
                          }
                          @case ('Failed') {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                              <svg class="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>Failed</span>
                            </span>
                          }
                          @default {
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 rounded-md">
                              <span class="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                              <span>{{ deploy.status || 'Active' }}</span>
                            </span>
                          }
                        }

                        <span class="text-[10px] font-semibold uppercase px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 rounded-md">
                          {{ deploy.environment }}
                        </span>

                        @if (isLogsExpanded(deploy.pipelineId) && isPollingActive() && deploy.status !== 'Paused') {
                          <span class="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Polling
                          </span>
                        }
                      </div>

                      <p class="text-xs text-stone-500 font-mono">
                        Branch: <strong>{{ deploy.branch }}</strong> • Pipeline ID: {{ deploy.pipelineId }}
                      </p>
                      <p class="text-xs text-stone-400">
                        @if (deploy.status === 'Paused') {
                          <span class="text-amber-700 font-medium">Pipeline execution paused. Auto-triggers suspended.</span>
                        } @else if (deploy.status === 'Cancelled') {
                          <span class="text-stone-500 font-medium">Pipeline build cancelled by operator.</span>
                        } @else {
                          <span>Auto-deploy webhook active • Last trigger: {{ formatDate(deploy.deployedAt) }}</span>
                        }
                      </p>
                    </div>

                    <!-- Pipeline Action Control Buttons (Start, Pause, Cancel, Log Inspector) -->
                    <div class="flex flex-wrap items-center gap-2">
                      
                      <!-- 1. Start / Resume / Run Button -->
                      @if (deploy.status === 'Paused') {
                        <button
                          type="button"
                          (click)="startPipeline(deploy)"
                          title="Resume active pipeline execution and webhooks"
                          class="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                          <svg class="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span>Resume</span>
                        </button>
                      } @else if (deploy.status === 'Cancelled' || deploy.status === 'Failed') {
                        <button
                          type="button"
                          (click)="startPipeline(deploy)"
                          title="Trigger a new build and start pipeline"
                          class="text-xs font-semibold text-stone-900 bg-white hover:bg-stone-100 border border-stone-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                          <svg class="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span>Start Pipeline</span>
                        </button>
                      } @else {
                        <button
                          type="button"
                          (click)="startPipeline(deploy)"
                          [disabled]="deploy.status === 'Building'"
                          title="Run manual build cycle"
                          class="text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Run Build</span>
                        </button>
                      }

                      <!-- 2. Pause Button -->
                      @if (deploy.status === 'Active' || deploy.status === 'Building' || deploy.status === 'Success') {
                        <button
                          type="button"
                          (click)="pausePipeline(deploy)"
                          title="Pause pipeline execution and polling"
                          class="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6" />
                          </svg>
                          <span>Pause</span>
                        </button>
                      }

                      <!-- 3. Cancel Button -->
                      @if (deploy.status === 'Building' || deploy.status === 'Active' || deploy.status === 'Paused') {
                        <button
                          type="button"
                          (click)="cancelPipeline(deploy)"
                          title="Cancel active build or halt execution"
                          class="text-xs font-semibold text-stone-700 hover:text-rose-700 bg-stone-100 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-stone-500 group-hover:text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Cancel</span>
                        </button>
                      }

                      <!-- Divider -->
                      <div class="h-4 w-px bg-stone-200 hidden sm:block"></div>

                      <!-- 4. Separate Dedicated Completed Log Inspector Option -->
                      <button
                        type="button"
                        (click)="openLogInspector(deploy)"
                        title="Open complete post-deployment logs & audit inspector"
                        class="text-xs font-semibold text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <svg class="w-3.5 h-3.5 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Inspect Logs</span>
                        <span class="text-[10px] bg-stone-100 text-stone-600 font-mono px-1.5 py-0.2 rounded border border-stone-200">
                          {{ (deploy.logs || []).length }}
                        </span>
                      </button>

                      <!-- 5. Inline View Toggle -->
                      <button
                        type="button"
                        (click)="toggleLogs(deploy.pipelineId)"
                        [class.bg-stone-200]="isLogsExpanded(deploy.pipelineId)"
                        [class.text-stone-900]="isLogsExpanded(deploy.pipelineId)"
                        class="text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer">
                        <span>{{ isLogsExpanded(deploy.pipelineId) ? 'Collapse' : 'Stream' }}</span>
                        <svg 
                          class="w-3.5 h-3.5 transition-transform duration-200" 
                          [class.rotate-180]="isLogsExpanded(deploy.pipelineId)" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <!-- 6. Debug & Run Workspace -->
                      <button
                        type="button"
                        (click)="openDebugForRepo(deploy.repoFullName)"
                        title="Open interactive code editor, test runner and terminal"
                        class="text-xs font-semibold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <span>Debug & Run</span>
                      </button>

                      <!-- 7. View Live App -->
                      <button
                        type="button"
                        (click)="openLivePreview(deploy)"
                        class="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Preview App</span>
                      </button>

                      <a 
                        [href]="getWorkingLiveUrl(deploy)" 
                        target="_blank" 
                        title="Open live app deployment in a new browser tab"
                        class="text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1">
                        <span>Live ↗</span>
                      </a>

                    </div>
                  </div>

                  <!-- INTERACTIVE PIPELINE EXECUTION & STAGE TRACKER -->
                  <div class="bg-stone-50/80 border border-stone-200/80 rounded-xl p-3.5 space-y-2.5">
                    <div class="flex items-center justify-between text-xs">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-stone-800 flex items-center gap-1.5">
                          <svg class="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Deployment Pipeline Stage Tracker
                        </span>
                        <span class="text-[10px] font-mono text-stone-500">
                          ({{ getPipelineStageProgress(deploy.status) }}% complete)
                        </span>
                      </div>

                      <div class="flex items-center gap-2 font-mono text-[11px]">
                        @if (deploy.status === 'Building') {
                          <span class="text-amber-700 font-semibold flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            Compiling & Containerizing...
                          </span>
                        } @else if (deploy.status === 'Paused') {
                          <span class="text-amber-800 font-semibold">Execution Suspended</span>
                        } @else if (deploy.status === 'Cancelled') {
                          <span class="text-stone-500 font-semibold">Build Aborted</span>
                        } @else {
                          <span class="text-emerald-700 font-semibold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Production Healthy (0.0.0.0:3000)
                          </span>
                        }
                      </div>
                    </div>

                    <!-- Progress Bar Track -->
                    <div class="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        class="h-full transition-all duration-500 rounded-full"
                        [class.bg-emerald-500]="deploy.status === 'Active' || deploy.status === 'Success'"
                        [class.bg-amber-500]="deploy.status === 'Building'"
                        [class.bg-amber-600]="deploy.status === 'Paused'"
                        [class.bg-stone-400]="deploy.status === 'Cancelled'"
                        [class.bg-rose-500]="deploy.status === 'Failed'"
                        [style.width.%]="getPipelineStageProgress(deploy.status)">
                      </div>
                    </div>

                    <!-- 5-Stage Stepper Track -->
                    <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px]">
                      
                      <!-- Stage 1: Git Fetch -->
                      <div class="flex items-center gap-1.5" [class.opacity-50]="getStageState(1, deploy.status) === 'pending'">
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          [class.bg-emerald-600]="getStageState(1, deploy.status) === 'completed'"
                          [class.bg-amber-500]="getStageState(1, deploy.status) === 'active'"
                          [class.bg-stone-300]="getStageState(1, deploy.status) === 'pending'">
                          ✓
                        </span>
                        <div class="truncate">
                          <span class="font-semibold block text-stone-800 truncate">1. Git Fetch</span>
                          <span class="text-[10px] text-stone-400 font-mono block truncate">{{ deploy.branch }} &#64; HEAD</span>
                        </div>
                      </div>

                      <!-- Stage 2: Dependencies -->
                      <div class="flex items-center gap-1.5" [class.opacity-50]="getStageState(2, deploy.status) === 'pending'">
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          [class.bg-emerald-600]="getStageState(2, deploy.status) === 'completed'"
                          [class.bg-amber-500]="getStageState(2, deploy.status) === 'active'"
                          [class.bg-stone-300]="getStageState(2, deploy.status) === 'pending'">
                          ✓
                        </span>
                        <div class="truncate">
                          <span class="font-semibold block text-stone-800 truncate">2. Dependencies</span>
                          <span class="text-[10px] text-stone-400 font-mono block truncate">npm ci (cached)</span>
                        </div>
                      </div>

                      <!-- Stage 3: Test Suite -->
                      <div class="flex items-center gap-1.5" [class.opacity-50]="getStageState(3, deploy.status) === 'pending'">
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          [class.bg-emerald-600]="getStageState(3, deploy.status) === 'completed'"
                          [class.bg-amber-500]="getStageState(3, deploy.status) === 'active'"
                          [class.bg-stone-300]="getStageState(3, deploy.status) === 'pending'">
                          @if (getStageState(3, deploy.status) === 'completed') { ✓ } @else if (getStageState(3, deploy.status) === 'active') { ⚙ } @else { 3 }
                        </span>
                        <div class="truncate">
                          <span class="font-semibold block text-stone-800 truncate">3. Test Suite</span>
                          <span class="text-[10px] text-stone-400 font-mono block truncate">npm test</span>
                        </div>
                      </div>

                      <!-- Stage 4: Container Build -->
                      <div class="flex items-center gap-1.5" [class.opacity-50]="getStageState(4, deploy.status) === 'pending'">
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          [class.bg-emerald-600]="getStageState(4, deploy.status) === 'completed'"
                          [class.bg-amber-500]="getStageState(4, deploy.status) === 'active'"
                          [class.bg-stone-300]="getStageState(4, deploy.status) === 'pending'">
                          @if (getStageState(4, deploy.status) === 'completed') { ✓ } @else if (getStageState(4, deploy.status) === 'active') { ⚙ } @else { 4 }
                        </span>
                        <div class="truncate">
                          <span class="font-semibold block text-stone-800 truncate">4. Docker Build</span>
                          <span class="text-[10px] text-stone-400 font-mono block truncate">Image Tagged</span>
                        </div>
                      </div>

                      <!-- Stage 5: Zero-Downtime Deploy -->
                      <div class="flex items-center gap-1.5" [class.opacity-50]="getStageState(5, deploy.status) === 'pending'">
                        <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          [class.bg-emerald-600]="getStageState(5, deploy.status) === 'completed'"
                          [class.bg-amber-500]="getStageState(5, deploy.status) === 'active'"
                          [class.bg-stone-300]="getStageState(5, deploy.status) === 'pending'">
                          @if (getStageState(5, deploy.status) === 'completed') { ✓ } @else { 5 }
                        </span>
                        <div class="truncate">
                          <span class="font-semibold block text-stone-800 truncate">5. Live Deploy</span>
                          <span class="text-[10px] text-stone-400 font-mono block truncate">Port 3000 SSL</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  <!-- Expanded Live Logs Container -->
                  @if (isLogsExpanded(deploy.pipelineId)) {
                    <div class="border-t border-stone-100 pt-3">
                      <div class="bg-stone-950 text-stone-100 rounded-xl p-4 font-mono text-xs shadow-inner space-y-2">
                        
                        <!-- Terminal Sub-Header -->
                        <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-800 text-[11px] text-stone-400">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="font-semibold text-stone-300">Deployment Stream Output</span>
                            <span class="text-stone-500">•</span>
                            <span class="text-stone-400">Pipeline #{{ deploy.pipelineId }}</span>
                            @if (isPollingActive()) {
                              <span class="text-emerald-400 text-[10px]">({{ pollingIntervalDisplay() }} refresh)</span>
                            }
                          </div>

                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              (click)="pollPipelines(deploy.pipelineId)"
                              [disabled]="isPollingNow()"
                              class="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] transition-colors flex items-center gap-1 cursor-pointer">
                              <svg class="w-3 h-3" [class.animate-spin]="isPollingNow()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Poll Now</span>
                            </button>

                            <button
                              type="button"
                              (click)="copyPipelineLogs(deploy)"
                              class="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] transition-colors flex items-center gap-1 cursor-pointer">
                              @if (copiedPipelineId() === deploy.pipelineId) {
                                <svg class="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span class="text-emerald-400">Copied!</span>
                              } @else {
                                <svg class="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy</span>
                              }
                            </button>

                            <button
                              type="button"
                              (click)="clearPipelineLogs(deploy.pipelineId)"
                              class="px-2 py-1 rounded bg-stone-800 hover:bg-red-950/60 hover:text-red-300 text-stone-400 text-[10px] transition-colors cursor-pointer">
                              Clear
                            </button>
                          </div>
                        </div>

                        <!-- Terminal Log Lines -->
                        <div class="max-h-64 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] select-text">
                          @for (log of deploy.logs; track $index) {
                            <div class="leading-relaxed flex items-start gap-2 hover:bg-stone-900/50 px-1 rounded transition-colors">
                              <span class="text-stone-600 select-none w-5 text-right font-mono">{{ $index + 1 }}</span>
                              <span class="text-stone-500 select-none">&gt;</span>
                              <span [class.text-emerald-400]="!log.includes('[Error]')" [class.text-red-400]="log.includes('[Error]')">
                                {{ log }}
                              </span>
                            </div>
                          }
                        </div>

                        <!-- Terminal Footer -->
                        <div class="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500">
                          <span class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Live socket/poll channel active
                          </span>
                          <span>{{ (deploy.logs || []).length }} entries recorded</span>
                        </div>

                      </div>
                    </div>
                  }
                </div>
              }

              @if (deployments().length === 0) {
                <div class="py-16 text-center bg-white rounded-3xl border border-stone-200 border-dashed p-6">
                  <p class="text-sm font-semibold text-stone-700 mb-1">No active pipelines yet</p>
                  <p class="text-xs text-stone-400 mb-4">Go to the Repositories tab and click "Automate Pipeline" on any project.</p>
                  <button (click)="currentTab.set('repos')" class="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer">
                    Browse Repositories
                  </button>
                </div>
              }
            </div>
          }

          <!-- TAB 3: GITHUB WEBHOOKS & AUTOMATION TRIGGER SUITE -->
          @if (currentTab() === 'webhooks') {
            <div class="space-y-6">
              
              <!-- Webhook Configuration & Secrets Card -->
              <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 class="text-base font-bold text-stone-900">GitHub Webhook Listener & Integration Endpoint</h3>
                      <span class="text-[10px] font-semibold uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                        Active 200 OK
                      </span>
                    </div>
                    <p class="text-xs text-stone-500 mt-0.5">
                      Configure your GitHub repositories to stream push events directly into ShipPulse for zero-downtime automated builds.
                    </p>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="text-xs text-stone-400 font-mono hidden sm:inline">Payload: application/json</span>
                  </div>
                </div>

                <!-- Webhook Details Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <!-- Payload URL Box -->
                  <div class="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-stone-700 flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Payload URL (GitHub Webhook Target)
                      </span>
                      <button 
                        type="button"
                        (click)="copyWebhookUrl()"
                        class="text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shadow-2xs hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1">
                        <span>{{ copiedWebhookUrl() ? 'Copied!' : 'Copy URL' }}</span>
                      </button>
                    </div>
                    <div class="bg-white border border-stone-200 rounded-lg p-2 font-mono text-[11px] text-stone-800 break-all select-all">
                      {{ webhookEndpointUrl() }}
                    </div>
                  </div>

                  <!-- Webhook Secret Box -->
                  <div class="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between gap-2">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-stone-700 flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        HMAC SHA-256 Webhook Secret
                      </span>
                      <button 
                        type="button"
                        (click)="copyWebhookSecret()"
                        class="text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg shadow-2xs hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1">
                        <span>{{ copiedWebhookSecret() ? 'Copied!' : 'Copy Secret' }}</span>
                      </button>
                    </div>
                    <div class="flex items-center justify-between bg-white border border-stone-200 rounded-lg p-2 font-mono text-[11px] text-stone-800 select-all">
                      <span>{{ webhookSecret() }}</span>
                      <button 
                        type="button" 
                        (click)="regenerateSecret()"
                        title="Generate fresh HMAC secret"
                        class="text-[10px] text-stone-500 hover:text-stone-800 font-sans cursor-pointer">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>

                <!-- GitHub Setup Steps Instructions -->
                <div class="bg-stone-50 border border-stone-200/80 rounded-xl p-4 text-xs text-stone-600 space-y-2">
                  <div class="font-semibold text-stone-800 flex items-center gap-2">
                    <svg class="w-4 h-4 text-stone-600" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                    </svg>
                    <span>How to connect this webhook to your GitHub repository:</span>
                  </div>
                  <ol class="list-decimal list-inside space-y-1 text-stone-500 pl-1 leading-relaxed">
                    <li>Open your repository on GitHub &gt; click <strong class="text-stone-700">Settings</strong> &gt; <strong class="text-stone-700">Webhooks</strong> &gt; <strong class="text-stone-700">Add webhook</strong>.</li>
                    <li>Paste the <strong class="text-stone-700">Payload URL</strong> from above into the Payload URL field.</li>
                    <li>Set Content type to <strong class="text-stone-700 font-mono">application/json</strong> and paste the Secret.</li>
                    <li>Select <strong class="text-stone-700">"Just the push event"</strong> or custom branch triggers, then click <strong class="text-stone-700">Add webhook</strong>.</li>
                  </ol>
                </div>
              </div>

              <!-- Interactive Webhook Push Simulator -->
              <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div class="border-b border-stone-100 pb-3">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <h4 class="text-base font-bold text-stone-900">Branch Push & Commit Webhook Simulator</h4>
                  </div>
                  <p class="text-xs text-stone-500 mt-0.5">
                    Test your continuous deployment pipeline right now by simulating an authenticated GitHub push event on any branch.
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <!-- Target Repository -->
                  <div>
                    <label for="simulated-target-repo" class="block font-semibold text-stone-700 mb-1">Target Repository</label>
                    <select 
                      id="simulated-target-repo"
                      [value]="simulatedRepo()" 
                      (change)="onSimulatedRepoChange($event)"
                      class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 outline-none focus:border-stone-400">
                      @for (r of repos(); track r.id) {
                        <option [value]="r.full_name">{{ r.name }} ({{ r.full_name }})</option>
                      }
                      @if (repos().length === 0) {
                        <option value="ishaan-gitoutlook/scientific--calculator-2">scientific--calculator-2</option>
                      }
                    </select>
                  </div>

                  <!-- Target Branch -->
                  <div>
                    <label for="simulated-target-branch" class="block font-semibold text-stone-700 mb-1">Trigger Branch</label>
                    <input 
                      id="simulated-target-branch"
                      type="text" 
                      [value]="simulatedBranch()" 
                      (input)="onSimulatedBranchChange($event)"
                      placeholder="e.g. main, dev, production"
                      class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 outline-none focus:border-stone-400"
                    />
                  </div>

                  <!-- Committer / Pusher -->
                  <div>
                    <label for="simulated-target-author" class="block font-semibold text-stone-700 mb-1">Pusher / Author</label>
                    <input 
                      id="simulated-target-author"
                      type="text" 
                      [value]="simulatedAuthor()" 
                      (input)="onSimulatedAuthorChange($event)"
                      placeholder="e.g. octocat, alphalegion09"
                      class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 outline-none focus:border-stone-400"
                    />
                  </div>

                  <!-- Commit Message -->
                  <div>
                    <label for="simulated-target-message" class="block font-semibold text-stone-700 mb-1">Commit Message</label>
                    <input 
                      id="simulated-target-message"
                      type="text" 
                      [value]="simulatedMessage()" 
                      (input)="onSimulatedMessageChange($event)"
                      placeholder="e.g. feat: update calculator formula engine"
                      class="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <!-- Dispatch Trigger Button -->
                <div class="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div class="text-[11px] text-stone-500 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Direct API dispatch to <strong class="text-stone-700 font-mono">POST /api/github/webhook</strong></span>
                  </div>

                  <button 
                    type="button"
                    (click)="dispatchSimulatedWebhook()"
                    [disabled]="isDispatchingWebhook()"
                    class="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs">
                    <svg class="w-3.5 h-3.5" [class.animate-spin]="isDispatchingWebhook()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{{ isDispatchingWebhook() ? 'Dispatching Webhook...' : 'Dispatch Push Webhook Event' }}</span>
                  </button>
                </div>
              </div>

              <!-- Webhook Activity Audit Stream -->
              <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-base font-bold text-stone-900">Webhook Activity & Audit Log</h4>
                      <span class="text-xs font-mono font-semibold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full border border-stone-200">
                        {{ webhookService.webhookHistory().length }} Events
                      </span>
                    </div>
                    <p class="text-xs text-stone-500 mt-0.5">
                      Incoming delivery history, verification digests, and triggered pipeline builds.
                    </p>
                  </div>

                  <button 
                    type="button"
                    (click)="webhookService.fetchWebhookHistory()"
                    class="text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <svg class="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh Stream</span>
                  </button>
                </div>

                <!-- Events Table / Cards -->
                <div class="space-y-3">
                  @for (event of webhookService.webhookHistory(); track event.id) {
                    <div class="bg-stone-50 border border-stone-200 rounded-xl p-4 text-xs flex flex-col gap-2.5">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] uppercase">
                            {{ event.event }}
                          </span>
                          <span class="font-bold text-stone-900">{{ event.repoFullName }}</span>
                          <span class="text-stone-400">•</span>
                          <span class="font-mono text-stone-600 font-semibold">branch: {{ event.branch }}</span>
                        </div>
                        <span class="font-mono text-[11px] text-stone-400">{{ formatDate(event.timestamp) }}</span>
                      </div>

                      <div class="flex flex-wrap items-center justify-between gap-3 text-stone-600">
                        <div class="flex items-center gap-2">
                          <span class="font-mono bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                            SHA: {{ event.commitSha }}
                          </span>
                          <span class="italic text-stone-700 font-sans">"{{ event.commitMessage }}"</span>
                          <span class="text-stone-400">by {{ event.sender }}</span>
                        </div>

                        @if (event.pipelineTriggered) {
                          <button 
                            type="button"
                            (click)="currentTab.set('pipelines')"
                            class="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                            <span>Pipeline {{ event.pipelineTriggered }}</span>
                            <span>→</span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  @if (webhookService.webhookHistory().length === 0) {
                    <div class="py-10 text-center bg-stone-50 rounded-xl border border-stone-200 border-dashed p-4">
                      <p class="text-xs font-semibold text-stone-600">No webhook events recorded yet</p>
                      <p class="text-[11px] text-stone-400 mt-0.5">Use the simulator above to test triggering automatic builds on push.</p>
                    </div>
                  }
                </div>
              </div>

            </div>
          }

          <!-- TAB 4: REPOSITORY DEBUGGER & EXECUTION WORKSPACE -->
          @if (currentTab() === 'debug') {
            <div class="space-y-6">
              
              <!-- Workspace Top Controls & App Switcher -->
              <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h3 class="text-base font-bold text-stone-900">Live Repository Debugger & Execution Workspace</h3>
                        <p class="text-xs text-stone-500">
                          Inspect virtual repository files, hot-patch code in real time, run unit tests, and interact with the deployed live sandbox.
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Repository Selector Tabs -->
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-semibold text-stone-500 mr-1">Active App:</span>
                    <button 
                      type="button"
                      (click)="selectDebugRepo('scientific--calculator-2')"
                      [class.bg-stone-900]="selectedDebugRepo() === 'scientific--calculator-2'"
                      [class.text-white]="selectedDebugRepo() === 'scientific--calculator-2'"
                      [class.bg-stone-100]="selectedDebugRepo() !== 'scientific--calculator-2'"
                      [class.text-stone-700]="selectedDebugRepo() !== 'scientific--calculator-2'"
                      class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs">
                      <span>🧮</span>
                      <span>Scientific Calculator</span>
                    </button>

                    <button 
                      type="button"
                      (click)="selectDebugRepo('devops-task-board')"
                      [class.bg-stone-900]="selectedDebugRepo() === 'devops-task-board'"
                      [class.text-white]="selectedDebugRepo() === 'devops-task-board'"
                      [class.bg-stone-100]="selectedDebugRepo() !== 'devops-task-board'"
                      [class.text-stone-700]="selectedDebugRepo() !== 'devops-task-board'"
                      class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-2xs">
                      <span>📋</span>
                      <span>DevOps Task Board</span>
                    </button>
                  </div>
                </div>

                <!-- Active App Telemetry & Quick Action Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div class="flex flex-wrap items-center gap-3 font-mono text-stone-600">
                    <span class="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Target: ishaan-gitoutlook/{{ selectedDebugRepo() }}</span>
                    </span>
                    <span class="hidden md:inline bg-stone-100 px-2.5 py-1 rounded-lg text-stone-700">Port: 3000 (0.0.0.0)</span>
                    <span class="hidden md:inline bg-stone-100 px-2.5 py-1 rounded-lg text-stone-700">Runtime: Node 20 / Express</span>
                  </div>

                  <!-- Quick Action Buttons -->
                  <div class="flex items-center gap-2">
                    <button 
                      type="button"
                      (click)="runDebugCommand('npm test')"
                      [disabled]="isExecutingDebugCommand()"
                      class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5" [class.animate-spin]="isExecutingDebugCommand()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Run Tests (npm test)</span>
                    </button>

                    <button 
                      type="button"
                      (click)="restartDebugContainer()"
                      [disabled]="isRestartingDebugContainer()"
                      class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5" [class.animate-spin]="isRestartingDebugContainer()" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Restart Container</span>
                    </button>

                    <a 
                      [href]="getWorkingDebugUrl()"
                      target="_blank"
                      title="Open in standalone tab"
                      class="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Fullscreen</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Main Split View: Code Editor & Virtual Explorer (Left) + Interactive Live Sandbox (Right) -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- Left Pane: Virtual File Browser & Code Editor (7 Cols) -->
                <div class="lg:col-span-7 flex flex-col gap-4">
                  <div class="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                    
                    <!-- Editor Header & File Tabs -->
                    <div class="bg-stone-950 px-4 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
                      <div class="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                        <span class="text-xs font-bold text-stone-400 font-mono flex items-center gap-1 mr-1">
                          <svg class="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Files:
                        </span>
                        
                        @for (file of debugFiles(); track file.path) {
                          <button 
                            type="button"
                            (click)="loadDebugFile(file.path)"
                            [class.bg-stone-800]="selectedDebugFilePath() === file.path"
                            [class.text-emerald-400]="selectedDebugFilePath() === file.path"
                            [class.border-stone-700]="selectedDebugFilePath() === file.path"
                            [class.text-stone-400]="selectedDebugFilePath() !== file.path"
                            [class.border-transparent]="selectedDebugFilePath() !== file.path"
                            class="px-2.5 py-1 rounded-lg text-xs font-mono border hover:bg-stone-800/80 hover:text-stone-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer">
                            <span>{{ file.name }}</span>
                          </button>
                        }
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-mono text-stone-500">
                          {{ selectedDebugFilePath() }}
                        </span>
                      </div>
                    </div>

                    <!-- Code Textarea / Editor Surface -->
                    <div class="relative bg-stone-900 p-4 font-mono text-xs text-stone-200 min-h-[340px] max-h-[420px] flex flex-col">
                      @if (isLoadingDebugFile()) {
                        <div class="absolute inset-0 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center z-10">
                          <span class="w-6 h-6 border-2 border-stone-600 border-t-emerald-400 rounded-full animate-spin"></span>
                        </div>
                      }
                      
                      <textarea 
                        [value]="debugFileContent()"
                        (input)="onDebugCodeChange($event)"
                        spellcheck="false"
                        aria-label="Code Editor"
                        class="w-full h-full min-h-[320px] bg-transparent text-stone-100 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-emerald-500/30 selection:text-white"
                        placeholder="// Select a file to view and edit source code...">
                      </textarea>
                    </div>

                    <!-- Editor Footer & Save Actions -->
                    <div class="bg-stone-950 px-4 py-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-2 text-stone-400 text-[11px]">
                        @if (debugSaveMessage()) {
                          <span class="text-emerald-400 font-medium animate-pulse">{{ debugSaveMessage() }}</span>
                        } @else {
                          <span>Press <strong>Save & Hot-Patch</strong> to instantly compile & reload container.</span>
                        }
                      </div>

                      <div class="flex items-center gap-2">
                        <button 
                          type="button"
                          (click)="loadDebugFile(selectedDebugFilePath())"
                          class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                          Revert Changes
                        </button>

                        <button 
                          type="button"
                          (click)="saveDebugFile()"
                          [disabled]="isSavingDebugFile()"
                          class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                          @if (isSavingDebugFile()) {
                            <span class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                            <span>Saving...</span>
                          } @else {
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>Save & Hot-Patch</span>
                          }
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Right Pane: Live Interactive Sandbox Container Webview (5 Cols) -->
                <div class="lg:col-span-5 flex flex-col gap-4">
                  <div class="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-full min-h-[460px]">
                    
                    <!-- Webview Top Bar -->
                    <div class="bg-stone-950 px-4 py-3 border-b border-stone-800 flex items-center justify-between gap-3 text-xs">
                      <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="font-bold text-white">Live App Sandbox</span>
                      </div>

                      <!-- Viewport Switcher -->
                      <div class="bg-stone-900 p-0.5 rounded-lg border border-stone-800 flex items-center text-[11px] font-semibold">
                        <button 
                          type="button"
                          (click)="debugViewportMode.set('desktop')"
                          [class.bg-stone-800]="debugViewportMode() === 'desktop'"
                          [class.text-emerald-400]="debugViewportMode() === 'desktop'"
                          [class.text-stone-400]="debugViewportMode() !== 'desktop'"
                          class="px-2 py-0.5 rounded transition-colors cursor-pointer">
                          Desktop
                        </button>
                        <button 
                          type="button"
                          (click)="debugViewportMode.set('mobile')"
                          [class.bg-stone-800]="debugViewportMode() === 'mobile'"
                          [class.text-emerald-400]="debugViewportMode() === 'mobile'"
                          [class.text-stone-400]="debugViewportMode() !== 'mobile'"
                          class="px-2 py-0.5 rounded transition-colors cursor-pointer">
                          Mobile
                        </button>
                      </div>
                    </div>

                    <!-- Live Iframe Webview Frame -->
                    <div class="flex-1 bg-stone-950 p-2 flex items-center justify-center overflow-hidden min-h-[380px]">
                      <div 
                        class="w-full h-full transition-all duration-300 rounded-xl overflow-hidden bg-stone-900 border border-stone-800"
                        [class.max-w-[340px]]="debugViewportMode() === 'mobile'">
                        <iframe 
                          [src]="getSafeDebugUrl()"
                          class="w-full h-full min-h-[380px] border-0 bg-stone-950"
                          title="Live Running Application Sandbox">
                        </iframe>
                      </div>
                    </div>

                    <!-- Webview Footer Telemetry -->
                    <div class="bg-stone-950 px-4 py-2 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span class="text-emerald-400">● Status: 200 OK Live</span>
                      <button (click)="refreshDebugIframe()" class="text-stone-400 hover:text-white underline cursor-pointer">
                        Reload Viewport
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              <!-- Bottom Pane: Interactive Terminal & Debug Command Runner -->
              <div class="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
                
                <!-- Terminal Header Bar -->
                <div class="bg-stone-950 px-5 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="ml-2 text-xs font-bold font-mono text-stone-300">Terminal & Test Execution Engine — ishaan-gitoutlook/{{ selectedDebugRepo() }}</span>
                  </div>

                  <!-- Quick Preset Command Chips -->
                  <div class="flex flex-wrap items-center gap-1.5 text-xs">
                    <span class="text-[11px] text-stone-500 mr-1">Presets:</span>
                    <button 
                      type="button" 
                      (click)="runDebugCommand('npm test')"
                      class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-emerald-400 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                      npm test
                    </button>
                    <button 
                      type="button" 
                      (click)="runDebugCommand('npm run lint')"
                      class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                      npm run lint
                    </button>
                    <button 
                      type="button" 
                      (click)="runDebugCommand('curl -i http://localhost:3000/api/health')"
                      class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                      curl health
                    </button>
                    <button 
                      type="button" 
                      (click)="runDebugCommand('npm start')"
                      class="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg text-xs font-mono transition-colors cursor-pointer">
                      npm start
                    </button>
                    <button 
                      type="button" 
                      (click)="clearDebugTerminal()"
                      class="px-2.5 py-1 bg-stone-800 hover:bg-red-950/60 hover:text-red-300 text-stone-400 rounded-lg text-xs font-mono transition-colors cursor-pointer ml-1">
                      Clear
                    </button>
                  </div>
                </div>

                <!-- Terminal Execution History / Console Output -->
                <div class="p-4 bg-stone-950 font-mono text-xs text-stone-200 min-h-[220px] max-h-[360px] overflow-y-auto space-y-4 select-text">
                  @for (log of debugTerminalLogs(); track $index) {
                    <div class="bg-stone-900/60 border border-stone-800/80 rounded-xl p-3.5 space-y-2">
                      <div class="flex items-center justify-between text-[11px] border-b border-stone-800/60 pb-1.5 text-stone-400">
                        <div class="flex items-center gap-2">
                          <span class="text-emerald-400 font-bold">$</span>
                          <span class="text-stone-100 font-semibold">{{ log.command }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-[10px]">
                          <span [class.text-emerald-400]="log.exitCode === 0" [class.text-red-400]="log.exitCode !== 0">
                            Exit Code: {{ log.exitCode }}
                          </span>
                          <span>•</span>
                          <span>{{ log.durationMs }}ms</span>
                          <span>•</span>
                          <span>{{ formatDate(log.timestamp) }}</span>
                        </div>
                      </div>

                      <pre class="text-stone-300 whitespace-pre-wrap font-mono text-[11px] leading-relaxed select-text">{{ log.output }}</pre>
                    </div>
                  }

                  @if (debugTerminalLogs().length === 0) {
                    <div class="py-12 text-center text-stone-500 font-mono text-xs space-y-1">
                      <p>Terminal session ready for ishaan-gitoutlook/{{ selectedDebugRepo() }}</p>
                      <p class="text-stone-600">Click a preset above or type a command below and hit Run.</p>
                    </div>
                  }
                </div>

                <!-- Terminal CLI Input Command Bar -->
                <div class="bg-stone-950 px-4 py-3 border-t border-stone-800 flex items-center gap-3">
                  <span class="text-emerald-400 font-mono font-bold text-sm select-none">$</span>
                  <input 
                    type="text"
                    [value]="customDebugCommand()"
                    (input)="customDebugCommand.set($any($event.target).value)"
                    (keydown.enter)="runDebugCommand()"
                    placeholder="Enter command (e.g. npm test, npm run lint, node index.js)..."
                    aria-label="Terminal command input"
                    class="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-stone-600 transition-colors"
                  />
                  <button 
                    type="button"
                    (click)="runDebugCommand()"
                    [disabled]="isExecutingDebugCommand() || !customDebugCommand().trim()"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0">
                    @if (isExecutingDebugCommand()) {
                      <span class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      <span>Running...</span>
                    } @else {
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      <span>Execute</span>
                    }
                  </button>
                </div>

              </div>

            </div>
          }

          <!-- ======================================================== -->
          <!-- TAB 5: CI/CD WORKFLOW CONFIGURATION & TEMPLATES          -->
          <!-- ======================================================== -->
          @if (currentTab() === 'config') {
            <div class="space-y-6 animate-in fade-in duration-200">
              
              <!-- Tab Header & Quick Context Banner -->
              <div class="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                      <svg class="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      CI/CD WORKFLOW GENERATOR
                    </span>
                    <span class="text-xs text-stone-400">GitHub Actions v4 Compatible</span>
                  </div>
                  <h2 class="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                    Repository Workflow Configuration
                  </h2>
                  <p class="text-xs sm:text-sm text-stone-500 max-w-2xl mt-1 leading-relaxed">
                    Select a battle-tested template to automatically configure, preview, test, and commit a production <code class="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-mono text-xs">.github/workflows/deploy.yml</code> pipeline directly to your repository.
                  </p>
                </div>

                <!-- Target Repository Switcher -->
                <div class="flex flex-col gap-1.5 min-w-[260px]">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-stone-500">Target Repository</span>
                  <div class="relative">
                    <select 
                      [value]="selectedConfigRepo()"
                      (change)="selectedConfigRepo.set($any($event.target).value); workflowSuccessMessage.set(null)"
                      aria-label="Select Target Repository"
                      class="w-full bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-stone-900 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer pr-9">
                      @for (repo of repos(); track repo.id) {
                        <option [value]="repo.name">{{ repo.full_name }}</option>
                      }
                    </select>
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Configuration Sub-Navigation Tabs -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-3">
                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="configSubTab.set('editor')"
                    [class.bg-stone-900]="configSubTab() === 'editor'"
                    [class.text-white]="configSubTab() === 'editor'"
                    [class.bg-white]="configSubTab() !== 'editor'"
                    [class.text-stone-700]="configSubTab() !== 'editor'"
                    [class.border-stone-900]="configSubTab() === 'editor'"
                    [class.border-stone-200]="configSubTab() !== 'editor'"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-2xs">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span>Workflow Editor</span>
                  </button>

                  <button 
                    type="button"
                    (click)="configSubTab.set('validator')"
                    [class.bg-stone-900]="configSubTab() === 'validator'"
                    [class.text-white]="configSubTab() === 'validator'"
                    [class.bg-white]="configSubTab() !== 'validator'"
                    [class.text-stone-700]="configSubTab() !== 'validator'"
                    [class.border-stone-900]="configSubTab() === 'validator'"
                    [class.border-stone-200]="configSubTab() !== 'validator'"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-2xs">
                    <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Validation & Health</span>
                    <span 
                      [class.bg-emerald-100]="yamlLintResult().stats.healthScore >= 90"
                      [class.text-emerald-800]="yamlLintResult().stats.healthScore >= 90"
                      [class.bg-amber-100]="yamlLintResult().stats.healthScore < 90"
                      [class.text-amber-800]="yamlLintResult().stats.healthScore < 90"
                      class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                      {{ yamlLintResult().stats.healthScore }}%
                    </span>
                  </button>

                  <button 
                    type="button"
                    (click)="configSubTab.set('history')"
                    [class.bg-stone-900]="configSubTab() === 'history'"
                    [class.text-white]="configSubTab() === 'history'"
                    [class.bg-white]="configSubTab() !== 'history'"
                    [class.text-stone-700]="configSubTab() !== 'history'"
                    [class.border-stone-900]="configSubTab() === 'history'"
                    [class.border-stone-200]="configSubTab() !== 'history'"
                    class="px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-2xs">
                    <svg class="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Revision History</span>
                    <span class="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                      {{ activeRepoHistory().length }}
                    </span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="openSaveSnapshotModal()"
                    title="Save current working workflow as a milestone revision snapshot"
                    class="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save Snapshot</span>
                  </button>
                </div>
              </div>

              <!-- SUBTAB 1: WORKFLOW BUILDER & EDITOR -->
              @if (configSubTab() === 'editor') {

              <!-- Workflow Template Selection Cards Gallery -->
              <div>
                <div class="flex items-center justify-between mb-3 px-1">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Step 1: Choose a Pre-Defined CI/CD Workflow Template
                  </h3>
                  <span class="text-xs text-stone-400">
                    {{ workflowTemplates.length }} templates available
                  </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  @for (tpl of workflowTemplates; track tpl.id) {
                    <div 
                      (click)="selectConfigTemplate(tpl.id)"
                      (keydown.enter)="selectConfigTemplate(tpl.id)"
                      (keydown.space)="selectConfigTemplate(tpl.id)"
                      tabindex="0"
                      role="button"
                      [attr.aria-pressed]="selectedConfigTemplateId() === tpl.id"
                      [class.border-indigo-600]="selectedConfigTemplateId() === tpl.id"
                      [class.ring-2]="selectedConfigTemplateId() === tpl.id"
                      [class.ring-indigo-600/20]="selectedConfigTemplateId() === tpl.id"
                      [class.bg-indigo-50/20]="selectedConfigTemplateId() === tpl.id"
                      [class.bg-white]="selectedConfigTemplateId() !== tpl.id"
                      [class.border-stone-200]="selectedConfigTemplateId() !== tpl.id"
                      class="border rounded-2xl p-4 flex flex-col justify-between hover:border-stone-400 transition-all cursor-pointer shadow-xs relative group outline-none focus:ring-2 focus:ring-indigo-500">
                      
                      <div>
                        <!-- Icon & Badge -->
                        <div class="flex items-start justify-between gap-2 mb-2.5">
                          <span class="text-2xl select-none">{{ tpl.icon }}</span>
                          <span 
                            [class.bg-indigo-100]="selectedConfigTemplateId() === tpl.id"
                            [class.text-indigo-800]="selectedConfigTemplateId() === tpl.id"
                            [class.bg-stone-100]="selectedConfigTemplateId() !== tpl.id"
                            [class.text-stone-600]="selectedConfigTemplateId() !== tpl.id"
                            class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
                            {{ tpl.badge }}
                          </span>
                        </div>

                        <!-- Name & Category -->
                        <h4 class="font-bold text-xs text-stone-900 leading-tight mb-1">
                          {{ tpl.name }}
                        </h4>
                        <p class="text-[10px] text-stone-400 font-mono mb-2">
                          {{ tpl.category }}
                        </p>

                        <!-- Description -->
                        <p class="text-[11px] text-stone-500 line-clamp-3 mb-3 leading-relaxed">
                          {{ tpl.description }}
                        </p>
                      </div>

                      <!-- Feature Chips -->
                      <div class="pt-2 border-t border-stone-100 space-y-1">
                        @for (feat of tpl.features; track feat) {
                          <div class="flex items-center gap-1.5 text-[10px] text-stone-600">
                            <svg class="w-3 h-3 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span class="truncate">{{ feat }}</span>
                          </div>
                        }
                      </div>

                      <!-- Active Radio Marker -->
                      <div class="mt-3 pt-2 flex items-center justify-between text-[11px] font-semibold">
                        <span [class.text-indigo-600]="selectedConfigTemplateId() === tpl.id" [class.text-stone-400]="selectedConfigTemplateId() !== tpl.id">
                          @if (selectedConfigTemplateId() === tpl.id) {
                            ● Selected
                          } @else {
                            Select Template
                          }
                        </span>
                      </div>

                    </div>
                  }
                </div>
              </div>

              <!-- Two-Column Interactive Studio -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                <!-- Left Column: Customization Parameters (5 Cols) -->
                <div class="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
                  
                  <div class="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div>
                      <h3 class="font-bold text-sm text-stone-900">Step 2: Customize Workflow Parameters</h3>
                      <p class="text-[11px] text-stone-500">Fine-tune branches, triggers, and runtime options.</p>
                    </div>
                    <span class="text-xs font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold">
                      {{ selectedConfigTemplateId() }}
                    </span>
                  </div>

                  <!-- Target Branch & Workflow Path -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                        Target Branch
                      </span>
                      <input 
                        type="text" 
                        [value]="configBranch()"
                        (input)="configBranch.set($any($event.target).value)"
                        placeholder="main"
                        aria-label="Target Branch"
                        class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                        Workflow File Path
                      </span>
                      <input 
                        type="text" 
                        [value]="configFilePath()"
                        (input)="configFilePath.set($any($event.target).value)"
                        placeholder=".github/workflows/deploy.yml"
                        aria-label="Workflow File Path"
                        class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <!-- Workflow Trigger Events -->
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-2">
                      Trigger Events (on:)
                    </span>
                    <div class="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/70">
                      <label class="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          [checked]="configTriggerPush()"
                          (change)="configTriggerPush.set($any($event.target).checked)"
                          class="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span><strong>on: push</strong> to branch <code class="font-mono text-[11px] bg-stone-200/80 px-1 py-0.2 rounded">{{ configBranch() }}</code></span>
                      </label>

                      <label class="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          [checked]="configTriggerPR()"
                          (change)="configTriggerPR.set($any($event.target).checked)"
                          class="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span><strong>on: pull_request</strong> to branch <code class="font-mono text-[11px] bg-stone-200/80 px-1 py-0.2 rounded">{{ configBranch() }}</code></span>
                      </label>

                      <label class="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          [checked]="configTriggerManual()"
                          (change)="configTriggerManual.set($any($event.target).checked)"
                          class="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span><strong>on: workflow_dispatch</strong> (manual trigger button on GitHub)</span>
                      </label>
                    </div>
                  </div>

                  <!-- Dynamic Template-Specific Options -->
                  @if (selectedConfigTemplateId() === 'nodejs') {
                    <div class="space-y-3 pt-2 border-t border-stone-100">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Node Version</span>
                          <select 
                            [value]="configNodeVersion()"
                            (change)="configNodeVersion.set($any($event.target).value)"
                            aria-label="Node Version"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-indigo-500">
                            <option value="20">Node.js 20 LTS</option>
                            <option value="18">Node.js 18 LTS</option>
                            <option value="22">Node.js 22 Current</option>
                          </select>
                        </div>
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Package Manager</span>
                          <select 
                            [value]="configPackageManager()"
                            (change)="configPackageManager.set($any($event.target).value)"
                            aria-label="Package Manager"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-indigo-500">
                            <option value="npm">npm (npm ci)</option>
                            <option value="yarn">yarn</option>
                            <option value="pnpm">pnpm</option>
                          </select>
                        </div>
                      </div>

                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Test Command</span>
                          <input 
                            type="text" 
                            [value]="configTestCommand()"
                            (input)="configTestCommand.set($any($event.target).value)"
                            placeholder="npm test"
                            aria-label="Test Command"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Build Command</span>
                          <input 
                            type="text" 
                            [value]="configBuildCommand()"
                            (input)="configBuildCommand.set($any($event.target).value)"
                            placeholder="npm run build"
                            aria-label="Build Command"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  } @else if (selectedConfigTemplateId() === 'python') {
                    <div class="space-y-3 pt-2 border-t border-stone-100">
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Python Version</span>
                          <select 
                            [value]="configPythonVersion()"
                            (change)="configPythonVersion.set($any($event.target).value)"
                            aria-label="Python Version"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-indigo-500">
                            <option value="3.11">Python 3.11</option>
                            <option value="3.12">Python 3.12</option>
                            <option value="3.10">Python 3.10</option>
                          </select>
                        </div>
                        <div>
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Test Command</span>
                          <input 
                            type="text" 
                            [value]="configTestCommand()"
                            (input)="configTestCommand.set($any($event.target).value)"
                            placeholder="pytest -v"
                            aria-label="Python Test Command"
                            class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  } @else if (selectedConfigTemplateId() === 'staticsite') {
                    <div class="space-y-3 pt-2 border-t border-stone-100">
                      <div>
                        <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1">Bundle Command</span>
                        <input 
                          type="text" 
                          [value]="configBuildCommand()"
                          (input)="configBuildCommand.set($any($event.target).value)"
                          placeholder="npm run build"
                          aria-label="Static Site Bundle Command"
                          class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  }

                  <!-- Custom Environment Variables Key-Value Table -->
                  <div class="pt-3 border-t border-stone-200/80 space-y-2.5">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-bold uppercase tracking-wider text-stone-700">Environment Variables</span>
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {{ activeEnvVarsCount() }} defined
                          </span>
                          <button 
                            type="button"
                            (click)="toggleGlobalSecretsInfo()"
                            [title]="showGlobalSecretsInfo() ? 'Hide Secrets security guide' : 'Why store sensitive data as GitHub Secrets?'"
                            class="text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer">
                            <span>🔒 Secrets Info</span>
                          </button>
                        </div>
                        <p class="text-[11px] text-stone-500">Auto-injected into workflow <code class="font-mono text-stone-700 bg-stone-100 px-1 py-0.5 rounded">env:</code> block</p>
                      </div>
                      <button 
                        type="button"
                        (click)="addEnvVar()"
                        title="Add new environment variable"
                        class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Add Var</span>
                      </button>
                    </div>

                    <!-- Global Secrets Security Guide Banner (collapsible) -->
                    @if (showGlobalSecretsInfo()) {
                      <div class="p-3 bg-stone-900 text-stone-100 rounded-2xl border border-purple-500/40 shadow-sm text-xs space-y-2">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1.5 font-bold text-white text-[11px]">
                            <span>🛡️</span>
                            <span>Secure Configuration Best Practice</span>
                          </div>
                          <button 
                            type="button"
                            (click)="showGlobalSecretsInfo.set(false)"
                            class="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p class="text-[10.5px] text-stone-300 leading-relaxed">
                          For credentials (API keys, database URLs, auth tokens), click the <strong class="text-purple-300">🔒 Secret</strong> toggle. This generates expressions like <code class="font-mono text-purple-300 bg-stone-800 px-1 py-0.5 rounded" [textContent]="secretSyntaxExample"></code> instead of committing sensitive plain text values to your public or private git repository.
                        </p>
                      </div>
                    }

                    <!-- Key-Value Table Container -->
                    @if (configEnvVars().length > 0) {
                      <div class="bg-stone-50 rounded-2xl border border-stone-200/80 overflow-hidden text-xs">
                        <div class="max-h-[260px] overflow-y-auto divide-y divide-stone-200/70">
                          @for (item of configEnvVars(); track item.id) {
                            <div class="p-2.5 flex flex-col gap-1.5 hover:bg-stone-100/50 transition-colors">
                              <div class="flex items-center gap-2">
                                <!-- Variable Key Input -->
                                <div class="flex-1 min-w-0">
                                  <input 
                                    type="text" 
                                    [value]="item.key"
                                    (input)="updateEnvVarKey(item.id, $any($event.target).value)"
                                    placeholder="KEY_NAME (e.g. API_URL)"
                                    aria-label="Environment Variable Key"
                                    class="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold text-stone-900 outline-none focus:border-indigo-500 uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:text-stone-400"
                                  />
                                </div>

                                <!-- Type Badge / Secret Toggle Button & Info Trigger -->
                                <div class="flex items-center gap-1 shrink-0">
                                  <button 
                                    type="button"
                                    (click)="toggleEnvVarSecret(item.id)"
                                    [title]="item.isSecret ? 'Configured as GitHub Secret reference. Click to switch to plain text.' : 'Configured as Plain text. Click to convert into Secret reference.'"
                                    class="px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer"
                                    [class.bg-purple-100]="item.isSecret"
                                    [class.text-purple-700]="item.isSecret"
                                    [class.border]="item.isSecret"
                                    [class.border-purple-300]="item.isSecret"
                                    [class.bg-stone-200/70]="!item.isSecret"
                                    [class.text-stone-600]="!item.isSecret">
                                    @if (item.isSecret) {
                                      <span>🔒 Secret</span>
                                    } @else {
                                      <span>Plain</span>
                                    }
                                  </button>

                                  <!-- Information Tooltip / Popover Trigger -->
                                  <button
                                    type="button"
                                    (click)="toggleSecretTooltip(item.id)"
                                    [attr.aria-expanded]="activeSecretTooltipId() === item.id"
                                    title="Learn why and how GitHub Secrets protect sensitive data"
                                    class="w-5 h-5 flex items-center justify-center rounded-full text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors cursor-pointer text-[11px] font-bold"
                                    [class.text-indigo-600]="activeSecretTooltipId() === item.id"
                                    [class.bg-indigo-50]="activeSecretTooltipId() === item.id">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                </div>

                                <!-- Delete Row Button -->
                                <button 
                                  type="button"
                                  (click)="removeEnvVar(item.id)"
                                  title="Remove variable"
                                  class="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0">
                                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              <!-- Variable Value Input with Helper -->
                              <div class="relative">
                                <input 
                                  type="text" 
                                  [value]="item.value"
                                  (input)="updateEnvVarValue(item.id, $any($event.target).value)"
                                  placeholder="Variable value or secrets reference"
                                  aria-label="Environment Variable Value"
                                  class="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-stone-800 outline-none focus:border-indigo-500 placeholder:text-stone-400"
                                />
                              </div>

                              <!-- Expanded Security Info Popover Card for this row -->
                              @if (activeSecretTooltipId() === item.id) {
                                <div class="mt-1 p-3 bg-stone-900 text-stone-100 rounded-xl border border-purple-500/40 shadow-md text-left transition-all">
                                  <div class="flex items-start justify-between gap-2 mb-2 pb-1.5 border-b border-stone-800">
                                    <div class="flex items-center gap-1.5">
                                      <span class="text-sm">🔒</span>
                                      <span class="text-[11px] font-bold text-white tracking-wide">Why use GitHub Secrets?</span>
                                    </div>
                                    <button 
                                      type="button"
                                      (click)="closeSecretTooltip()"
                                      aria-label="Close security tip"
                                      class="text-stone-400 hover:text-white p-0.5 rounded cursor-pointer">
                                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>

                                  <div class="space-y-1.5 text-[10.5px] leading-relaxed text-stone-300">
                                    <div class="flex items-start gap-1.5">
                                      <span class="text-emerald-400 font-bold shrink-0">✓</span>
                                      <p><strong class="text-white">Encrypted at Rest:</strong> GitHub encrypts repository secrets using 256-bit Libsodium sealed boxes. They are only decrypted in runner VM memory during active jobs.</p>
                                    </div>
                                    <div class="flex items-start gap-1.5">
                                      <span class="text-emerald-400 font-bold shrink-0">✓</span>
                                      <p><strong class="text-white">Redacted in Logs:</strong> Workflow runner automatically censors secret values with <code class="font-mono text-purple-300 bg-stone-800 px-1 py-0.5 rounded">***</code> in CI console logs.</p>
                                    </div>
                                    <div class="flex items-start gap-1.5">
                                      <span class="text-amber-400 font-bold shrink-0">⚠</span>
                                      <p><strong class="text-amber-300">Avoid Plain Text:</strong> Plain text variables in YAML files are permanently saved in commit history and visible to anyone who has access to the repo.</p>
                                    </div>
                                  </div>

                                  <div class="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between gap-2 text-[10px]">
                                    <span class="text-stone-400 font-mono text-[9.5px]">GitHub: Settings &rarr; Secrets &amp; Variables &rarr; Actions</span>
                                    <div class="flex items-center gap-1.5 shrink-0">
                                      @if (!item.isSecret) {
                                        <button 
                                          type="button"
                                          (click)="toggleEnvVarSecret(item.id); closeSecretTooltip()"
                                          class="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded text-[10px] transition-colors cursor-pointer">
                                          Convert to Secret
                                        </button>
                                      }
                                      <button 
                                        type="button"
                                        (click)="closeSecretTooltip()"
                                        class="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-medium rounded text-[10px] transition-colors cursor-pointer">
                                        Got it
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>

                        <!-- Quick Preset Suggestions Footer inside table -->
                        <div class="p-2 bg-stone-100/80 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                          <span class="text-stone-500 font-medium">Quick Presets:</span>
                          <div class="flex items-center gap-1 flex-wrap">
                            <button 
                              type="button" 
                              (click)="addPresetEnvVar('db')" 
                              class="px-1.5 py-0.5 bg-white hover:bg-stone-200 border border-stone-200 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
                              + DATABASE_URL
                            </button>
                            <button 
                              type="button" 
                              (click)="addPresetEnvVar('jwt')" 
                              class="px-1.5 py-0.5 bg-white hover:bg-stone-200 border border-stone-200 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
                              + JWT_SECRET
                            </button>
                            <button 
                              type="button" 
                              (click)="addPresetEnvVar('redis')" 
                              class="px-1.5 py-0.5 bg-white hover:bg-stone-200 border border-stone-200 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
                              + REDIS_URL
                            </button>
                            <button 
                              type="button" 
                              (click)="addPresetEnvVar('api')" 
                              class="px-1.5 py-0.5 bg-white hover:bg-stone-200 border border-stone-200 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
                              + API_KEY
                            </button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <!-- Empty State -->
                      <div class="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-4 text-center space-y-2">
                        <p class="text-xs text-stone-500">No custom environment variables defined yet.</p>
                        <div class="flex justify-center gap-2">
                          <button 
                            type="button"
                            (click)="addEnvVar('API_BASE_URL', 'https://api.example.com')"
                            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer">
                            + Add Variable
                          </button>
                          <button 
                            type="button"
                            (click)="resetDefaultEnvVars()"
                            class="text-xs font-medium text-stone-600 hover:text-stone-800 bg-white border border-stone-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer">
                            Load Defaults
                          </button>
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Environment Variables & Port Preview -->
                  <div class="pt-2 border-t border-stone-100">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                      Target Port & Environment
                    </span>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                        <span class="text-stone-500 font-medium">Container Port:</span>
                        <span class="font-mono font-bold text-stone-900">{{ configPort() }}</span>
                      </div>
                      <div class="flex-1 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                        <span class="text-stone-500 font-medium">Environment:</span>
                        <span class="font-mono font-bold text-emerald-700">production</span>
                      </div>
                    </div>
                  </div>

                  <!-- Commit Message -->
                  <div>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-stone-600 block mb-1.5">
                      Git Commit Message
                    </span>
                    <input 
                      type="text" 
                      [value]="configCommitMessage()"
                      (input)="configCommitMessage.set($any($event.target).value)"
                      placeholder="ci: generate automated CI/CD deployment workflow"
                      aria-label="Git Commit Message"
                      class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-sans text-stone-800 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                </div>

                <!-- Right Column: Live YAML Code Surface & Auto-Commit Box (7 Cols) -->
                <div class="lg:col-span-7 bg-stone-900 rounded-3xl p-5 border border-stone-800 shadow-xl flex flex-col justify-between space-y-4 text-stone-200">
                  
                  <!-- YAML Header Bar -->
                  <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
                    <div class="flex items-center gap-2 flex-wrap">
                      <div class="flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                        <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                      </div>
                      <span class="font-mono text-xs font-semibold text-stone-300 ml-1">
                        {{ configFilePath() }}
                      </span>
                      @if (isCustomYamlEdited()) {
                        <span class="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-semibold">
                          Customized
                        </span>
                      }

                      <!-- Real-Time YAML Lint Status Badge -->
                      @if (isYamlValid()) {
                        <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 rounded-full">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>✓ YAML Syntax Valid</span>
                          <span class="text-stone-400 font-mono text-[10px] hidden sm:inline">• {{ yamlStats().jobsCount }} job(s)</span>
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-600 rounded-full animate-pulse">
                          <svg class="w-3 h-3 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          <span>✕ {{ yamlErrors().length }} Syntax {{ yamlErrors().length === 1 ? 'Error' : 'Errors' }}</span>
                        </span>
                      }
                    </div>

                    <!-- Code Actions: Fix Tabs, Test Error, Format, Reset, Download, Copy -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      @if (hasTabError()) {
                        <button 
                          type="button"
                          (click)="fixTabsInYaml()"
                          title="Convert tabs to 2 spaces (YAML standard)"
                          class="text-[11px] font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                          </svg>
                          <span>Auto-Fix Tabs</span>
                        </button>
                      }

                      <button 
                        type="button"
                        (click)="toggleSampleSyntaxError()"
                        [title]="isYamlValid() ? 'Introduce intentional syntax error to test YAML linter' : 'Clear test error and reset'"
                        class="text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-800/90 hover:bg-stone-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                        {{ isYamlValid() ? '⚡ Test Linter' : 'Clear Error' }}
                      </button>

                      <button 
                        type="button"
                        (click)="resetWorkflowYaml()"
                        title="Reset code back to template default"
                        class="text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-800/90 hover:bg-stone-700 px-2 py-1 rounded-lg transition-colors cursor-pointer">
                        Reset
                      </button>

                      <button 
                        type="button"
                        (click)="downloadWorkflowYaml()"
                        title="Download deploy.yml to your local machine"
                        class="text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-800/90 hover:bg-stone-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </button>

                      <button 
                        type="button"
                        (click)="copyWorkflowYaml()"
                        class="text-[11px] font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                        @if (copiedWorkflowYaml()) {
                          <svg class="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span class="text-emerald-400">Copied!</span>
                        } @else {
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          <span>Copy</span>
                        }
                      </button>
                    </div>
                  </div>

                  <!-- Interactive Code Editor Canvas with Line Numbers & Error Gutter -->
                  <div 
                    [class.border-rose-700]="!isYamlValid()"
                    [class.border-stone-800]="isYamlValid()"
                    class="relative bg-stone-950 rounded-2xl border transition-colors font-mono text-xs overflow-hidden flex flex-col">
                    
                    <!-- Editor Body -->
                    <div class="flex min-h-[360px] max-h-[500px] overflow-y-auto">
                      <!-- Line Numbers Gutter with Error Indicators -->
                      <div class="w-12 bg-stone-950/80 border-r border-stone-800/80 py-3 flex flex-col text-right font-mono text-[11px] select-none shrink-0 text-stone-600">
                        @for (line of yamlLines(); track $index) {
                          <div 
                            [class.bg-rose-950]="yamlErrorLineSet().has($index + 1)"
                            [class.text-rose-400]="yamlErrorLineSet().has($index + 1)"
                            [class.font-bold]="yamlErrorLineSet().has($index + 1)"
                            class="px-2 h-[21px] flex items-center justify-end leading-[21px] relative group/gutter">
                            @if (yamlErrorLineSet().has($index + 1)) {
                              <span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>
                            }
                            <span>{{ $index + 1 }}</span>
                          </div>
                        }
                      </div>

                      <!-- Monospace Text Area -->
                      <div class="flex-1 p-3 bg-transparent">
                        <textarea 
                          [value]="generatedWorkflowYaml()"
                          (input)="onWorkflowYamlEdit($event)"
                          spellcheck="false"
                          aria-label="GitHub Actions YAML configuration"
                          class="w-full h-full min-h-[340px] bg-transparent text-emerald-400 outline-none resize-none font-mono text-xs leading-[21px] selection:bg-emerald-900 selection:text-white"
                        ></textarea>
                      </div>
                    </div>

                    <!-- Footer Info Bar inside editor -->
                    <div class="px-3 py-1.5 bg-stone-900/90 border-t border-stone-800/90 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <div class="flex items-center gap-3">
                        <span>Lines: {{ yamlLines().length }}</span>
                        <span>Parser: yaml v2.x</span>
                      </div>
                      <div class="flex items-center gap-2">
                        @if (isYamlValid()) {
                          <span class="text-emerald-400 font-sans font-semibold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Valid Syntax
                          </span>
                        } @else {
                          <span class="text-rose-400 font-sans font-bold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                            {{ yamlErrors().length }} Syntax {{ yamlErrors().length === 1 ? 'Error' : 'Errors' }}
                          </span>
                        }
                      </div>
                    </div>

                  </div>

                  <!-- Real-Time Syntax Errors & Diagnostics Inspector Panel -->
                  @if (yamlErrors().length > 0) {
                    <div class="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 text-xs space-y-3 animate-in fade-in duration-150 shadow-inner">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <div class="w-6 h-6 rounded-lg bg-rose-900/80 border border-rose-700 flex items-center justify-center text-rose-300">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 class="font-bold text-rose-200">YAML Syntax & Schema Diagnostics</h4>
                            <p class="text-[11px] text-rose-300/80">Highlighting parser issues detected by the AST linter</p>
                          </div>
                        </div>
                        <span class="px-2 py-0.5 bg-rose-900/90 text-rose-200 border border-rose-700/60 rounded-md font-mono text-[10px] font-bold">
                          {{ yamlErrors().length }} {{ yamlErrors().length === 1 ? 'ISSUE' : 'ISSUES' }}
                        </span>
                      </div>

                      <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        @for (err of yamlErrors(); track $index) {
                          <div class="bg-stone-950/80 border border-rose-900/60 rounded-xl p-2.5 flex flex-col gap-1 text-stone-200">
                            <div class="flex items-center justify-between gap-2">
                              <div class="flex items-center gap-2">
                                <span class="px-1.5 py-0.5 bg-rose-900 text-rose-200 font-mono text-[10px] font-bold rounded">
                                  Line {{ err.line }}:{{ err.column }}
                                </span>
                                @if (err.code) {
                                  <span class="text-[10px] font-mono text-rose-400 font-semibold">[{{ err.code }}]</span>
                                }
                              </div>
                            </div>
                            <p class="text-rose-300 font-mono text-xs">{{ err.message }}</p>
                            @if (err.snippet) {
                              <div class="bg-rose-950/60 px-2 py-1 rounded border border-rose-900/40 text-[11px] font-mono text-rose-300">
                                <code>{{ err.snippet }}</code>
                              </div>
                            }
                            @if (err.suggestion) {
                              <p class="text-[11px] text-stone-300 flex items-center gap-1.5 font-sans mt-0.5">
                                <span class="text-amber-400">💡 Fix Suggestion:</span>
                                <span>{{ err.suggestion }}</span>
                              </p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @else if (yamlWarnings().length > 0) {
                    <div class="bg-amber-950/30 border border-amber-800/60 rounded-2xl p-3.5 text-xs space-y-2">
                      <div class="flex items-center gap-2">
                        <span class="text-amber-400 font-bold">⚠ Workflow Recommendations</span>
                        <span class="text-stone-400 text-[10px]">({{ yamlWarnings().length }})</span>
                      </div>
                      @for (warn of yamlWarnings(); track $index) {
                        <p class="text-stone-300 text-[11px] flex items-center gap-1.5">
                          <span class="text-amber-400">•</span>
                          <span>{{ warn.message }}</span>
                          @if (warn.suggestion) {
                            <span class="text-stone-400 italic">({{ warn.suggestion }})</span>
                          }
                        </p>
                      }
                    </div>
                  }

                  <!-- Commit Feedback Status Toast -->
                  @if (workflowSuccessMessage()) {
                    <div 
                      [class.bg-emerald-950/80]="workflowSuccessMessage()?.startsWith('✓') || workflowSuccessMessage()?.includes('successfully')"
                      [class.border-emerald-500/40]="workflowSuccessMessage()?.startsWith('✓') || workflowSuccessMessage()?.includes('successfully')"
                      [class.text-emerald-300]="workflowSuccessMessage()?.startsWith('✓') || workflowSuccessMessage()?.includes('successfully')"
                      [class.bg-rose-950/80]="!workflowSuccessMessage()?.startsWith('✓') && !workflowSuccessMessage()?.includes('successfully')"
                      [class.border-rose-500/40]="!workflowSuccessMessage()?.startsWith('✓') && !workflowSuccessMessage()?.includes('successfully')"
                      [class.text-rose-300]="!workflowSuccessMessage()?.startsWith('✓') && !workflowSuccessMessage()?.includes('successfully')"
                      class="border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                      <div class="flex items-center gap-2.5">
                        @if (workflowSuccessMessage()?.startsWith('✓') || workflowSuccessMessage()?.includes('successfully')) {
                          <svg class="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        } @else {
                          <svg class="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        <span class="text-xs font-semibold leading-tight">{{ workflowSuccessMessage() }}</span>
                      </div>
                      @if (workflowSuccessMessage()?.startsWith('✓') || workflowSuccessMessage()?.includes('successfully')) {
                        <div class="flex items-center gap-2 shrink-0">
                          <button 
                            type="button"
                            (click)="openDebugForRepo(selectedConfigRepo())"
                            class="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                            Inspect in Debugger
                          </button>
                          <button 
                            type="button"
                            (click)="currentTab.set('pipelines')"
                            class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                            View Pipelines
                          </button>
                        </div>
                      }
                    </div>
                  }

                  <!-- Primary Action Bar with Validation Commit Guard -->
                  <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="text-[11px] flex items-center gap-1.5">
                      @if (isYamlValid()) {
                        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="text-emerald-300 font-medium">YAML syntax validated. Ready to commit into repository.</span>
                      } @else {
                        <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span class="text-rose-400 font-semibold">Commit blocked: Fix {{ yamlErrors().length }} syntax error(s) before committing.</span>
                      }
                    </div>

                    <button 
                      type="button"
                      (click)="commitAndGenerateWorkflow()"
                      [disabled]="!isYamlValid() || isGeneratingWorkflow()"
                      [title]="!isYamlValid() ? 'Fix syntax errors before committing' : 'Commit workflow to GitHub'"
                      class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0">
                      @if (isGeneratingWorkflow()) {
                        <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        <span>Committing .github/workflows/deploy.yml...</span>
                      } @else {
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <span>Generate & Commit Workflow</span>
                      }
                    </button>
                  </div>

                </div>

              </div>
              }

              <!-- SUBTAB 2: WORKFLOW VALIDATION & HEALTH AUDIT -->
              @if (configSubTab() === 'validator') {
                <app-workflow-validator 
                  [yamlContent]="generatedWorkflowYaml()" 
                  [repoName]="selectedConfigRepo()" 
                  (applyAutoFix)="customWorkflowYaml.set($event); isCustomYamlEdited.set(true); workflowSuccessMessage.set(null)"
                  (jumpToEditor)="configSubTab.set('editor')">
                </app-workflow-validator>
              }

              <!-- SUBTAB 3: REVISION HISTORY & DIFFS -->
              @if (configSubTab() === 'history') {
                <app-workflow-history 
                  [repository]="selectedConfigRepo()" 
                  [currentYaml]="generatedWorkflowYaml()" 
                  [currentEnvVars]="configEnvVars()" 
                  [currentBranch]="configBranch()" 
                  [currentFilePath]="configFilePath()" 
                  [currentTemplateId]="selectedConfigTemplateId()" 
                  [yamlStats]="yamlStats()" 
                  (rollback)="rollbackToRevision($event)" 
                  (switchToEditor)="configSubTab.set('editor')">
                </app-workflow-history>
              }

            </div>
          }

          <!-- TAB 6: DORA ANALYTICS & DEPLOYMENT METRICS -->
          @if (currentTab() === 'analytics') {
            <app-dora-analytics></app-dora-analytics>
          }

          <!-- TAB 7: CI/CD PIPELINE SIMULATOR & CHAOS RUNNER -->
          @if (currentTab() === 'simulator') {
            <app-cicd-simulator 
              [yamlText]="generatedWorkflowYaml()" 
              [envVars]="configEnvVars()" 
              [repository]="selectedConfigRepo()" 
              [branch]="configBranch()"
              (rollbackTriggered)="onSimRollback($event)">
            </app-cicd-simulator>
          }

          <!-- TAB 8: AI-POWERED WORKFLOW OPTIMIZER -->
          @if (currentTab() === 'optimizer') {
            <app-workflow-optimizer 
              [yamlText]="generatedWorkflowYaml()" 
              (yamlUpdated)="onWorkflowYamlPatched($event)">
            </app-workflow-optimizer>
          }

          <!-- TAB 9: PIPELINE SECURITY & SLSA COMPLIANCE -->
          @if (currentTab() === 'security') {
            <app-security-compliance 
              [yamlText]="generatedWorkflowYaml()" 
              (yamlUpdated)="onWorkflowYamlPatched($event)">
            </app-security-compliance>
          }

          <!-- TAB 10: NOTIFICATION & CHATOPS INTEGRATIONS -->
          @if (currentTab() === 'notifications') {
            <app-notification-hub></app-notification-hub>
          }

          <!-- TAB 11: MULTI-CLOUD DEPLOYMENT EXPORTERS -->
          @if (currentTab() === 'cloud') {
            <app-cloud-exporters 
              (yamlSelected)="onCloudTemplateSelected($event)">
            </app-cloud-exporters>
          }

          <!-- TAB 12: CUSTOMER BILLING & SUBSCRIPTIONS -->
          @if (currentTab() === 'billing') {
            <app-billing-portal (openPricingModal)="showPricingModal.set(true)"></app-billing-portal>
          }

          <!-- TAB 13: TEAM GOVERNANCE & RBAC TOKENS -->
          @if (currentTab() === 'team') {
            <app-team-management></app-team-management>
          }

        }

      </main>

      <!-- Add Account / Switch Account Modal -->
      @if (showAddAccountModal()) {
        <div class="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-left">
            
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <h3 class="text-lg font-bold text-stone-900">Add / Switch GitHub Account</h3>
              <button (click)="showAddAccountModal.set(false)" class="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Existing Accounts Switcher List -->
            @if (accounts().length > 0) {
              <div class="mb-6">
                <p class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Select Existing Account</p>
                <div class="space-y-1.5 max-h-48 overflow-y-auto">
                  @for (acc of accounts(); track acc.id) {
                    <button 
                      type="button"
                      (click)="selectAccount(acc); showAddAccountModal.set(false)"
                      class="w-full text-left flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:border-stone-900 cursor-pointer transition-all"
                      [class.bg-stone-50]="acc.id === activeAccount()?.id"
                      [class.border-stone-900]="acc.id === activeAccount()?.id">
                      <div class="flex items-center gap-3">
                        <img [src]="acc.avatar_url" [alt]="acc.login" class="w-8 h-8 rounded-full" />
                        <div>
                          <p class="text-xs font-bold text-stone-900">{{ acc.name || acc.login }}</p>
                          <p class="text-[11px] text-stone-500">&#64;{{ acc.login }}</p>
                        </div>
                      </div>
                      @if (acc.id === activeAccount()?.id) {
                        <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Active</span>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Connect New Account Input -->
            <div class="pt-2">
              <p class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Connect Another Account</p>
              
              <div class="p-4 rounded-2xl bg-stone-50 border border-stone-200 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-stone-800">GitHub Personal Access Token</span>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo,user,read:org&description=ShipPulse" 
                    target="_blank" 
                    class="text-[11px] font-semibold text-stone-600 underline">
                    New token &rarr;
                  </a>
                </div>
                <input 
                  type="password" 
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                  [value]="modalTokenInput()"
                  (input)="modalTokenInput.set($any($event.target).value)"
                  class="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 mb-3"
                />
                <button 
                  (click)="connectWithModalToken()"
                  [disabled]="isVerifyingToken() || !modalTokenInput().trim()"
                  class="w-full bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2">
                  @if (isVerifyingToken()) {
                    <span class="w-4 h-4 border-2 border-stone-400 border-t-white rounded-full animate-spin"></span>
                    Validating & Connecting...
                  } @else {
                    Add Account
                  }
                </button>
                @if (tokenError()) {
                  <p class="text-xs text-red-600 mt-2">{{ tokenError() }}</p>
                }
              </div>

              <!-- Option for OAuth -->
              @if (authUrl()) {
                <a 
                  [href]="authUrl()" 
                  class="w-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-900 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2">
                  Connect via GitHub OAuth Webpage
                </a>
              }
            </div>

          </div>
        </div>
      }

      <!-- Save Milestone Snapshot Modal -->
      @if (showSaveSnapshotModal()) {
        <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-stone-100 pb-3">
              <h4 class="text-base font-bold text-stone-900">Save Workflow Milestone Snapshot</h4>
              <button (click)="showSaveSnapshotModal.set(false)" class="text-stone-400 hover:text-stone-600">&times;</button>
            </div>

            <p class="text-xs text-stone-500">
              Create a named checkpoint of your current working workflow for <code class="font-bold text-stone-800">{{ selectedConfigRepo() }}</code>.
            </p>

            <div class="space-y-3 text-xs">
              <div>
                <span class="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                  Milestone Tag Name
                </span>
                <input 
                  type="text" 
                  [value]="snapshotTagName()"
                  (input)="snapshotTagName.set($any($event.target).value)"
                  placeholder="e.g. Pre-Release Build Milestone"
                  class="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-purple-500" />
              </div>

              <div>
                <span class="block font-bold uppercase tracking-wider text-[10px] text-stone-500 mb-1">
                  Note / Commit Description
                </span>
                <textarea 
                  rows="3"
                  [value]="snapshotCustomNote()"
                  (input)="snapshotCustomNote.set($any($event.target).value)"
                  placeholder="Describe key changes in this milestone..."
                  class="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs outline-none focus:border-purple-500 resize-none font-sans"
                ></textarea>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-end gap-2">
              <button 
                type="button"
                (click)="showSaveSnapshotModal.set(false)"
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer">
                Cancel
              </button>

              <button 
                type="button"
                (click)="saveSnapshotNow()"
                class="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer">
                Save Snapshot
              </button>
            </div>

          </div>
        </div>
      }

      <!-- Dedicated Post-Deployment Log Inspector Modal -->
      @if (inspectedDeployment(); as deploy) {
        <div class="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div class="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100 font-sans">
            
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/90">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700/60 flex items-center justify-center text-stone-300">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">{{ deploy.repoFullName }}</h3>
                    
                    <!-- Status Badge -->
                    @switch (deploy.status) {
                      @case ('Active') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-md">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Active
                        </span>
                      }
                      @case ('Success') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-md">
                          <svg class="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                          Success
                        </span>
                      }
                      @case ('Building') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800 rounded-md">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin"></span>
                          Building...
                        </span>
                      }
                      @case ('Paused') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-stone-800 text-amber-300 border border-amber-700/60 rounded-md">
                          <svg class="w-2.5 h-2.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6" />
                          </svg>
                          Paused
                        </span>
                      }
                      @case ('Cancelled') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700 rounded-md">
                          <svg class="w-2.5 h-2.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelled
                        </span>
                      }
                      @case ('Failed') {
                        <span class="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-rose-950/80 text-rose-300 border border-rose-800 rounded-md">
                          <svg class="w-2.5 h-2.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </span>
                      }
                    }

                    <span class="text-[10px] uppercase font-mono px-2 py-0.5 bg-stone-800 text-stone-300 border border-stone-700 rounded-md">
                      {{ deploy.environment }}
                    </span>
                  </div>
                  <p class="text-xs text-stone-400 font-mono mt-0.5">
                    Branch: <strong class="text-stone-300">{{ deploy.branch }}</strong> • Pipeline ID: {{ deploy.pipelineId }}
                  </p>
                </div>
              </div>

              <!-- Close Modal Button -->
              <div class="flex items-center gap-2 self-end sm:self-center">
                <button 
                  type="button"
                  (click)="closeLogInspector()"
                  title="Close Inspector (ESC)"
                  class="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Toolbar (Search & Category Filters) -->
            <div class="px-6 py-3 border-b border-stone-800/80 bg-stone-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              <!-- Search in Logs -->
              <div class="relative flex-1 max-w-md">
                <svg class="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text"
                  [value]="logSearchQuery()"
                  (input)="logSearchQuery.set($any($event.target).value)"
                  placeholder="Filter log stream by keyword (e.g. docker, build, error)..."
                  class="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-stone-600 focus:ring-1 focus:ring-stone-600 font-mono"
                />
                @if (logSearchQuery()) {
                  <button 
                    type="button"
                    (click)="logSearchQuery.set('')"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
              </div>

              <!-- Filter Category Chips -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  (click)="logFilterCategory.set('all')"
                  [class.bg-stone-700]="logFilterCategory() === 'all'"
                  [class.text-white]="logFilterCategory() === 'all'"
                  [class.bg-stone-800]="logFilterCategory() !== 'all'"
                  [class.text-stone-400]="logFilterCategory() !== 'all'"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                  <span>All</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ inspectedLogCounts().total }})</span>
                </button>

                <button
                  type="button"
                  (click)="logFilterCategory.set('errors')"
                  [class.bg-rose-900]="logFilterCategory() === 'errors'"
                  [class.text-rose-200]="logFilterCategory() === 'errors'"
                  [class.bg-stone-800]="logFilterCategory() !== 'errors'"
                  [class.text-stone-400]="logFilterCategory() !== 'errors'"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                  <span>Errors</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ inspectedLogCounts().errors }})</span>
                </button>

                <button
                  type="button"
                  (click)="logFilterCategory.set('build')"
                  [class.bg-stone-700]="logFilterCategory() === 'build'"
                  [class.text-white]="logFilterCategory() === 'build'"
                  [class.bg-stone-800]="logFilterCategory() !== 'build'"
                  [class.text-stone-400]="logFilterCategory() !== 'build'"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                  <span>Build</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ inspectedLogCounts().build }})</span>
                </button>

                <button
                  type="button"
                  (click)="logFilterCategory.set('docker')"
                  [class.bg-stone-700]="logFilterCategory() === 'docker'"
                  [class.text-white]="logFilterCategory() === 'docker'"
                  [class.bg-stone-800]="logFilterCategory() !== 'docker'"
                  [class.text-stone-400]="logFilterCategory() !== 'docker'"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                  <span>Docker</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ inspectedLogCounts().docker }})</span>
                </button>

                <button
                  type="button"
                  (click)="logFilterCategory.set('network')"
                  [class.bg-stone-700]="logFilterCategory() === 'network'"
                  [class.text-white]="logFilterCategory() === 'network'"
                  [class.bg-stone-800]="logFilterCategory() !== 'network'"
                  [class.text-stone-400]="logFilterCategory() !== 'network'"
                  class="px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1">
                  <span>Network</span>
                  <span class="text-[10px] opacity-75 font-mono">({{ inspectedLogCounts().network }})</span>
                </button>
              </div>

            </div>

            <!-- Terminal Window Content -->
            <div class="flex-1 min-h-[300px] max-h-[55vh] overflow-y-auto bg-stone-950 p-4 font-mono text-xs select-text">
              
              <!-- Console Mock Title -->
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-stone-800/80 text-[11px] text-stone-500 select-none">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span class="ml-2 text-stone-400">CI/CD Execution Log Stream • Deployment Recorded: {{ formatDate(deploy.deployedAt) }}</span>
                </div>
                <div class="text-[10px] text-stone-500">
                  Target: {{ deploy.liveUrl }}
                </div>
              </div>

              <!-- Log Rows List -->
              @if (inspectedFilteredLogs().length > 0) {
                <div class="space-y-1 font-mono leading-relaxed">
                  @for (line of inspectedFilteredLogs(); track $index) {
                    <div class="flex items-start gap-2.5 hover:bg-stone-900/60 px-1.5 py-0.5 rounded transition-colors group">
                      <span class="text-stone-600 select-none w-7 text-right font-mono text-[10px] pt-0.5">{{ $index + 1 }}</span>
                      <span class="text-stone-600 select-none text-[10px] pt-0.5">&gt;</span>
                      
                      <div class="flex-1 break-all">
                        @if (line.includes('[Error]') || line.includes('failed')) {
                          <span class="text-rose-400 font-semibold">{{ line }}</span>
                        } @else if (line.includes('[Build]') || line.includes('[Compile]')) {
                          <span class="text-sky-300">{{ line }}</span>
                        } @else if (line.includes('[Docker]') || line.includes('[Deploy]')) {
                          <span class="text-emerald-400">{{ line }}</span>
                        } @else if (line.includes('[Pipeline]')) {
                          <span class="text-amber-300 font-medium">{{ line }}</span>
                        } @else if (line.includes('[Healthcheck]') || line.includes('[Traffic]')) {
                          <span class="text-indigo-300">{{ line }}</span>
                        } @else {
                          <span class="text-stone-300">{{ line }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="py-16 text-center text-stone-500 font-sans">
                  <svg class="w-8 h-8 mx-auto text-stone-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p class="text-sm text-stone-400">No log entries matched your filter.</p>
                  <p class="text-xs text-stone-600 mt-1">Try clearing your search query or selecting "All" category.</p>
                  <button 
                    type="button" 
                    (click)="logSearchQuery.set(''); logFilterCategory.set('all')"
                    class="mt-3 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition-colors cursor-pointer">
                    Reset Filter
                  </button>
                </div>
              }

            </div>

            <!-- Modal Footer Controls -->
            <div class="px-6 py-3.5 border-t border-stone-800 bg-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              
              <div class="flex items-center gap-2 text-stone-400 text-[11px]">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Showing <strong>{{ inspectedFilteredLogs().length }}</strong> of {{ deploy.logs.length }} total events</span>
                <span class="text-stone-600">•</span>
                <span>ISO Ref: {{ deploy.deployedAt }}</span>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-center">
                <!-- Copy Logs -->
                <button
                  type="button"
                  (click)="copyInspectorLogs()"
                  class="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer">
                  @if (copiedInspectorLogs()) {
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span class="text-emerald-400">Copied to Clipboard</span>
                  } @else {
                    <svg class="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy All</span>
                  }
                </button>

                <!-- Download .log File -->
                <button
                  type="button"
                  (click)="downloadInspectorLogs()"
                  class="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export .log</span>
                </button>

                <!-- Close Inspector -->
                <button
                  type="button"
                  (click)="closeLogInspector()"
                  class="px-4 py-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-semibold transition-colors cursor-pointer">
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      }

      <!-- Interactive Live App Sandbox Runner Modal & Webview -->
      @if (previewingDeployment(); as previewDeploy) {
        <div class="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150">
          <div class="bg-stone-900 border border-stone-800 rounded-3xl max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-left text-white">
            
            <!-- Modal Top Bar -->
            <div class="px-5 py-3.5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-white">{{ previewDeploy.repoFullName }}</span>
                    <span class="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-semibold uppercase">
                      Live Container
                    </span>
                  </div>
                  <p class="text-[11px] text-stone-400 font-mono">Pipeline ID: {{ previewDeploy.pipelineId }} • Branch: {{ previewDeploy.branch }}</p>
                </div>
              </div>

              <!-- Device Frame Switcher -->
              <div class="flex items-center gap-2">
                <div class="bg-stone-900 p-1 rounded-xl border border-stone-800 flex items-center text-xs font-semibold">
                  <button 
                    type="button"
                    (click)="previewDeviceMode.set('desktop')"
                    [class.bg-stone-800]="previewDeviceMode() === 'desktop'"
                    [class.text-emerald-400]="previewDeviceMode() === 'desktop'"
                    [class.text-stone-400]="previewDeviceMode() !== 'desktop'"
                    class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Desktop</span>
                  </button>
                  <button 
                    type="button"
                    (click)="previewDeviceMode.set('tablet')"
                    [class.bg-stone-800]="previewDeviceMode() === 'tablet'"
                    [class.text-emerald-400]="previewDeviceMode() === 'tablet'"
                    [class.text-stone-400]="previewDeviceMode() !== 'tablet'"
                    class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Tablet</span>
                  </button>
                  <button 
                    type="button"
                    (click)="previewDeviceMode.set('mobile')"
                    [class.bg-stone-800]="previewDeviceMode() === 'mobile'"
                    [class.text-emerald-400]="previewDeviceMode() === 'mobile'"
                    [class.text-stone-400]="previewDeviceMode() !== 'mobile'"
                    class="px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Mobile</span>
                  </button>
                </div>

                <!-- External Tab Launcher -->
                <a 
                  [href]="getWorkingLiveUrl(previewDeploy)" 
                  target="_blank" 
                  title="Open live app deployment directly in new browser tab"
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs">
                  <span>Open Fullscreen</span>
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <!-- Close Modal -->
                <button 
                  type="button"
                  (click)="closeLivePreview()"
                  class="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Modal Frame Viewport -->
            <div class="flex-1 bg-stone-950 p-4 flex items-center justify-center overflow-auto">
              <div 
                class="transition-all duration-300 bg-stone-900 border border-stone-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                [class.w-full]="previewDeviceMode() === 'desktop'"
                [class.h-full]="previewDeviceMode() === 'desktop'"
                [class.w-[720px]]="previewDeviceMode() === 'tablet'"
                [class.h-[95%]]="previewDeviceMode() === 'tablet'"
                [class.w-[380px]]="previewDeviceMode() === 'mobile'"
                [class.h-[640px]]="previewDeviceMode() === 'mobile'">
                
                <iframe 
                  [src]="getSafeLiveUrl(previewDeploy)" 
                  class="w-full h-full border-0 bg-stone-950" 
                  title="Live Container Deployment Webview">
                </iframe>
              </div>
            </div>

            <!-- Modal Footer Status -->
            <div class="px-5 py-2.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 font-mono">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  HTTP 200 OK • SSL TLS 1.3
                </span>
                <span class="hidden sm:inline text-stone-600">|</span>
                <span class="hidden sm:inline text-stone-400">Target: Node.js Express Container</span>
              </div>
              <span class="text-stone-500">Live URL: {{ getWorkingLiveUrl(previewDeploy) }}</span>
            </div>

          </div>
        </div>
      }

      <!-- Real-Time Toast Notification Banner -->
      @if (webhookToast(); as toast) {
        <div class="fixed bottom-6 right-6 z-50 bg-stone-900 border border-stone-700 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <div class="text-xs">
            <p class="font-bold text-white">{{ toast.title }}</p>
            <p class="text-stone-300">{{ toast.message }}</p>
          </div>
          <button 
            type="button" 
            (click)="webhookToast.set(null)"
            class="text-stone-400 hover:text-white p-1 ml-2 cursor-pointer">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }

      <!-- Pricing & Plan Upgrade Modal -->
      @if (showPricingModal()) {
        <app-pricing-modal 
          (closeModal)="showPricingModal.set(false)" 
          (planUpgraded)="onPlanUpgraded($event)">
        </app-pricing-modal>
      }

      <!-- Footer with Security & Compliance Notice -->
      <footer class="mt-auto border-t border-stone-200 bg-white py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <p>© 2026 ShipPulse. High-Velocity CI/CD Engine & Real-Time DORA Telemetry.</p>
          <div class="flex items-center gap-4 text-stone-500">
            <span>PlayStore & AppStore Sandbox Compliant</span>
            <span>•</span>
            <span>Encrypted Token Isolation</span>
          </div>
        </div>
      </footer>

    </div>
    }
  `
})
export class App implements OnInit, OnDestroy {
  readonly secretSyntaxExample = '${{ secrets.YOUR_KEY }}';
  
  billingService = inject(BillingSubscriptionService);
  teamService = inject(OrganizationTeamService);

  viewMode = signal<'app' | 'landing'>('app');
  showPricingModal = signal<boolean>(false);
  accounts = signal<GitHubAccount[]>([]);
  activeAccountId = signal<number | null>(null);
  currentTab = signal<'repos' | 'pipelines' | 'webhooks' | 'debug' | 'config' | 'simulator' | 'optimizer' | 'security' | 'notifications' | 'analytics' | 'cloud' | 'billing' | 'team'>('repos');
  showProMenu = signal<boolean>(false);

  onPlanUpgraded(planId: string) {
    this.workflowSuccessMessage.set(`Successfully updated workspace to ${planId.toUpperCase()} tier! All features unlocked.`);
  }

  onWorkflowYamlPatched(newYaml: string) {
    this.customWorkflowYaml.set(newYaml);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set('Applied optimization / security patch to workflow YAML.');
  }

  onCloudTemplateSelected(newYaml: string) {
    this.customWorkflowYaml.set(newYaml);
    this.isCustomYamlEdited.set(true);
    this.currentTab.set('config');
    this.configSubTab.set('editor');
    this.workflowSuccessMessage.set('Loaded Cloud Infrastructure template into Workflow Studio.');
  }

  onSimRollback(reason: string) {
    this.workflowSuccessMessage.set(`Automated recovery initiated: Rollback simulated for ${reason}`);
  }

  // CI/CD Workflow Templates & Configuration State
  workflowTemplates: WorkflowTemplateOption[] = [
    {
      id: 'nodejs',
      name: 'Node.js & Full-Stack App',
      category: 'Node 20 / Express / Next / React',
      icon: '🟢',
      badge: 'Recommended',
      description: 'Automates dependency caching with npm ci, test runner (npm test), linting, Docker packaging, and live port 3000 deployment.',
      features: ['Node 20 LTS runtime', 'Clean install (npm ci)', 'npm test assertions', 'Port 3000 zero-downtime deploy'],
      defaultBranch: 'main',
      defaultFilePath: '.github/workflows/deploy.yml'
    },
    {
      id: 'python',
      name: 'Python / Flask & FastAPI',
      category: 'Python 3.11 / Flask / FastAPI',
      icon: '🐍',
      badge: 'Popular',
      description: 'Sets up Python 3.11, pip cache, requirements.txt dependencies, pytest test suites, flake8 linting, and Gunicorn container deploy.',
      features: ['Python 3.11 with pip cache', 'pytest automated test runner', 'Flake8 lint verification', 'Gunicorn WSGI container'],
      defaultBranch: 'main',
      defaultFilePath: '.github/workflows/deploy.yml'
    },
    {
      id: 'staticsite',
      name: 'Static Site & Single Page App',
      category: 'HTML5 / Vite / React / Astro',
      icon: '⚡',
      badge: 'Ultra Fast',
      description: 'Builds modern frontend SPA bundles (Vite, Next SSG, Astro, React) and deploys optimized static web assets to Nginx with SPA routing fallback.',
      features: ['npm run build static bundling', 'Single Page App fallback routing', 'Artifact upload & edge sync', 'Zero runtime server load'],
      defaultBranch: 'main',
      defaultFilePath: '.github/workflows/deploy.yml'
    },
    {
      id: 'docker',
      name: 'Docker Multi-Stage Container',
      category: 'Dockerfile / Cloud Native',
      icon: '🐳',
      badge: 'Universal',
      description: 'Builds, tags, and tests custom multi-stage Dockerfiles with build layer cache, environment secrets injection, and isolated container execution.',
      features: ['Multi-Stage Docker layer caching', 'Container health probes (/api/health)', 'ENV secret bindings', 'Port 3000 microservice host'],
      defaultBranch: 'main',
      defaultFilePath: '.github/workflows/deploy.yml'
    },
    {
      id: 'golang',
      name: 'Go Microservice Engine',
      category: 'Go 1.22 / High-Throughput',
      icon: '🔵',
      badge: 'Compiled Binary',
      description: 'Compiles CGO-disabled static binaries with Go module cache, runs go test ./..., and deploys ultra-lightweight distroless containers.',
      features: ['Go 1.22 Static Compilation', 'go test -v unit test suite', 'Distroless scratch container', 'Ultra-low memory footprint'],
      defaultBranch: 'main',
      defaultFilePath: '.github/workflows/deploy.yml'
    }
  ];

  selectedConfigRepo = signal<string>('scientific--calculator-2');
  selectedConfigTemplateId = signal<'nodejs' | 'python' | 'staticsite' | 'docker' | 'golang'>('nodejs');
  configBranch = signal<string>('main');
  configFilePath = signal<string>('.github/workflows/deploy.yml');
  configNodeVersion = signal<string>('20');
  configPythonVersion = signal<string>('3.11');
  configPackageManager = signal<'npm' | 'yarn' | 'pnpm'>('npm');
  configTestCommand = signal<string>('npm test');
  configBuildCommand = signal<string>('npm run build');
  configPort = signal<number>(3000);
  configTriggerPush = signal<boolean>(true);
  configTriggerPR = signal<boolean>(true);
  configTriggerManual = signal<boolean>(true);
  configAutoDeploySecret = signal<boolean>(true);
  configCommitMessage = signal<string>('ci: add automated deployment workflow via ShipPulse');

  configEnvVars = signal<ConfigEnvVar[]>([
    { id: 'env-1', key: 'NODE_ENV', value: 'production', isSecret: false },
    { id: 'env-2', key: 'PORT', value: '3000', isSecret: false },
    { id: 'env-3', key: 'DATABASE_URL', value: '${{ secrets.DATABASE_URL }}', isSecret: true },
    { id: 'env-4', key: 'API_SECRET_KEY', value: '${{ secrets.API_SECRET_KEY }}', isSecret: true }
  ]);

  activeEnvVarsCount = computed<number>(() => {
    return this.configEnvVars().filter(v => v.key.trim().length > 0).length;
  });

  activeSecretTooltipId = signal<string | null>(null);
  showGlobalSecretsInfo = signal<boolean>(false);

  customWorkflowYaml = signal<string>('');
  isCustomYamlEdited = signal<boolean>(false);
  isGeneratingWorkflow = signal<boolean>(false);
  workflowSuccessMessage = signal<string | null>(null);
  copiedWorkflowYaml = signal<boolean>(false);

  // Debugger & Interactive Workspace State
  selectedDebugRepo = signal<string>('scientific--calculator-2');
  debugFiles = signal<RepoFileItem[]>([]);
  isLoadingDebugFiles = signal<boolean>(false);
  selectedDebugFilePath = signal<string>('src/calculator.js');
  debugFileContent = signal<string>('');
  isLoadingDebugFile = signal<boolean>(false);
  isSavingDebugFile = signal<boolean>(false);
  debugSaveMessage = signal<string | null>(null);
  
  debugTerminalLogs = signal<DebugExecResult[]>([]);
  customDebugCommand = signal<string>('npm test');
  isExecutingDebugCommand = signal<boolean>(false);
  debugViewportMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  debugRefreshKey = signal<number>(Date.now());
  isRestartingDebugContainer = signal<boolean>(false);

  repos = signal<Repo[]>([]);
  isLoadingRepos = signal(false);
  error = signal<string | null>(null);

  filter = signal<'all' | 'public' | 'private'>('all');
  searchQuery = signal('');
  
  tokenInput = signal('');
  modalTokenInput = signal('');
  isVerifyingToken = signal(false);
  tokenError = signal<string | null>(null);

  authUrl = signal<string | null>(null);
  isConnectingOAuth = signal(false);
  showAccountMenu = signal(false);
  showAddAccountModal = signal(false);

  deployingRepo = signal<string | null>(null);
  deployments = signal<DeploymentRecord[]>([]);
  expandedPipelineIds = signal<Set<string>>(new Set());

  // Real-time Polling Engine & Measurement Units
  isPollingActive = signal<boolean>(true);
  pollingIntervalValue = signal<number>(3);
  pollingIntervalUnit = signal<PollingUnit>('s');
  isPollingNow = signal<boolean>(false);
  lastPolledAt = signal<string | null>(null);
  copiedPipelineId = signal<string | null>(null);

  // Dedicated Post-Deployment Log Inspector State
  inspectedDeployment = signal<DeploymentRecord | null>(null);
  logSearchQuery = signal<string>('');
  logFilterCategory = signal<'all' | 'errors' | 'build' | 'docker' | 'network'>('all');
  copiedInspectorLogs = signal<boolean>(false);

  // Live Sandbox Runner & Webview State
  previewingDeployment = signal<DeploymentRecord | null>(null);
  previewDeviceMode = signal<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Webhooks & Automation Suite State
  webhookService = inject(WebhookService);

  // Configuration Sub-Navigation State (Editor, Validator, History)
  configSubTab = signal<'editor' | 'validator' | 'history'>('editor');

  // YAML Linting, Security Audit & Validation Service
  private yamlLinter = inject(YamlLinter);
  yamlLintResult = computed<YamlLintResult>(() => this.yamlLinter.lint(this.generatedWorkflowYaml()));
  isYamlValid = computed<boolean>(() => this.yamlLintResult().isValid);
  yamlErrors = computed<YamlLintIssue[]>(() => this.yamlLintResult().errors);
  yamlWarnings = computed<YamlLintIssue[]>(() => this.yamlLintResult().warnings);
  yamlInfos = computed<YamlLintIssue[]>(() => this.yamlLintResult().infos);
  yamlStats = computed<YamlLintStats>(() => this.yamlLintResult().stats);
  yamlErrorLineSet = computed<Set<number>>(() => new Set(this.yamlErrors().map(e => e.line)));
  yamlLines = computed<string[]>(() => this.generatedWorkflowYaml().split('\n'));
  selectedLintIssue = signal<YamlLintIssue | null>(null);
  hasTabError = computed<boolean>(() => this.yamlErrors().some(e => e.code === 'TAB_INDENTATION'));

  // Validation Audit View State
  validationCategoryFilter = signal<'all' | 'syntax' | 'schema' | 'security' | 'best-practice' | 'deprecation'>('all');
  validationTabMode = signal<'overview' | 'issues' | 'graph' | 'security'>('overview');
  filteredValidationIssues = computed(() => {
    const filter = this.validationCategoryFilter();
    const result = this.yamlLintResult();
    const all = [...result.errors, ...result.warnings, ...result.infos];
    if (filter === 'all') return all;
    return all.filter(i => i.category === filter);
  });

  // Workflow History & Diff Engine State
  workflowHistoryService = inject(WorkflowHistoryService);
  activeRepoHistory = computed(() => this.workflowHistoryService.getRevisionsForRepo(this.selectedConfigRepo()));
  selectedHistoryRevisionId = signal<string | null>(null);

  selectedHistoryRevision = computed<WorkflowRevision | null>(() => {
    const list = this.activeRepoHistory();
    const selId = this.selectedHistoryRevisionId();
    if (selId) {
      const found = list.find(r => r.id === selId);
      if (found) return found;
    }
    return list[0] || null;
  });

  historyDiffSummary = computed<DiffSummary | null>(() => {
    const rev = this.selectedHistoryRevision();
    if (!rev) return null;
    const currentYaml = this.generatedWorkflowYaml();
    return this.workflowHistoryService.computeDiff(rev.yamlContent, currentYaml);
  });

  historyViewMode = signal<'diff' | 'code' | 'env'>('diff');
  showSaveSnapshotModal = signal<boolean>(false);
  snapshotCustomNote = signal<string>('');
  snapshotTagName = signal<string>('');
  historyActionToast = signal<string | null>(null);
  copiedHistoryYaml = signal<boolean>(false);

  copiedWebhookUrl = signal<boolean>(false);
  copiedWebhookSecret = signal<boolean>(false);
  webhookSecret = signal<string>('whsec_' + Math.random().toString(36).substring(2, 12) + '_' + Math.random().toString(36).substring(2, 8));
  simulatedRepo = signal<string>('ishaan-gitoutlook/scientific--calculator-2');
  simulatedBranch = signal<string>('main');
  simulatedAuthor = signal<string>('ishaan-gitoutlook');
  simulatedMessage = signal<string>('feat: add trigonometry & exponential calculation algorithms');
  isDispatchingWebhook = signal<boolean>(false);
  webhookToast = signal<{ title: string; message: string } | null>(null);

  private platformId = inject(PLATFORM_ID);
  private sanitizer = inject(DomSanitizer);
  
  webhookEndpointUrl = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      return `${window.location.origin}/api/github/webhook`;
    }
    return 'https://api.shippulse.io/api/github/webhook';
  });

  private pollIntervalTimer: ReturnType<typeof setInterval> | null = null;

  // Filtered Logs for Dedicated Inspector
  inspectedFilteredLogs = computed(() => {
    const deploy = this.inspectedDeployment();
    if (!deploy) return [];
    const query = this.logSearchQuery().toLowerCase().trim();
    const cat = this.logFilterCategory();
    let list = deploy.logs || [];

    if (cat === 'errors') {
      list = list.filter(l => l.toLowerCase().includes('[error]') || l.toLowerCase().includes('failed') || l.toLowerCase().includes('warn'));
    } else if (cat === 'build') {
      list = list.filter(l => l.toLowerCase().includes('[build]') || l.toLowerCase().includes('[compile]') || l.toLowerCase().includes('[init]'));
    } else if (cat === 'docker') {
      list = list.filter(l => l.toLowerCase().includes('[docker]') || l.toLowerCase().includes('[deploy]'));
    } else if (cat === 'network') {
      list = list.filter(l => l.toLowerCase().includes('[traffic]') || l.toLowerCase().includes('[healthcheck]') || l.toLowerCase().includes('[network]') || l.toLowerCase().includes('[webhook]'));
    }

    if (query) {
      list = list.filter(l => l.toLowerCase().includes(query));
    }

    return list;
  });

  inspectedLogCounts = computed(() => {
    const deploy = this.inspectedDeployment();
    if (!deploy) return { total: 0, errors: 0, build: 0, docker: 0, network: 0 };
    const list = deploy.logs || [];
    return {
      total: list.length,
      errors: list.filter(l => l.toLowerCase().includes('[error]') || l.toLowerCase().includes('failed') || l.toLowerCase().includes('warn')).length,
      build: list.filter(l => l.toLowerCase().includes('[build]') || l.toLowerCase().includes('[compile]') || l.toLowerCase().includes('[init]')).length,
      docker: list.filter(l => l.toLowerCase().includes('[docker]') || l.toLowerCase().includes('[deploy]')).length,
      network: list.filter(l => l.toLowerCase().includes('[traffic]') || l.toLowerCase().includes('[healthcheck]') || l.toLowerCase().includes('[network]') || l.toLowerCase().includes('[webhook]')).length
    };
  });

  pollingIntervalMs = computed(() => {
    const val = Number(this.pollingIntervalValue()) || 1;
    const unit = this.pollingIntervalUnit();
    if (unit === 'ms') {
      return Math.max(250, Math.floor(val));
    } else if (unit === 's') {
      return Math.max(250, Math.floor(val * 1000));
    } else {
      return Math.max(250, Math.floor(val * 60 * 1000));
    }
  });

  pollingIntervalDisplay = computed(() => {
    const val = this.pollingIntervalValue();
    const unit = this.pollingIntervalUnit();
    if (unit === 'ms') return `${val}ms`;
    if (unit === 's') return `${val}s`;
    return `${val}min`;
  });

  toggleLogs(pipelineId: string) {
    const current = new Set(this.expandedPipelineIds());
    if (current.has(pipelineId)) {
      current.delete(pipelineId);
    } else {
      current.add(pipelineId);
    }
    this.expandedPipelineIds.set(current);
  }

  isLogsExpanded(pipelineId: string): boolean {
    return this.expandedPipelineIds().has(pipelineId);
  }

  onIntervalValueChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const num = parseFloat(target.value);
    if (!isNaN(num) && num > 0) {
      this.pollingIntervalValue.set(num);
      this.restartPollingLoop();
    }
  }

  onIntervalUnitChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const unit = target.value as PollingUnit;
    if (unit === 'ms' || unit === 's' || unit === 'min') {
      this.pollingIntervalUnit.set(unit);
      this.restartPollingLoop();
    }
  }

  setPresetInterval(val: number, unit: PollingUnit) {
    this.pollingIntervalValue.set(val);
    this.pollingIntervalUnit.set(unit);
    this.restartPollingLoop();
  }

  toggleAutoPolling() {
    this.isPollingActive.set(!this.isPollingActive());
    if (this.isPollingActive()) {
      this.restartPollingLoop();
    } else {
      this.stopPollingLoop();
    }
  }

  startPollingLoop() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopPollingLoop();

    if (!this.isPollingActive()) return;

    const intervalMs = this.pollingIntervalMs();
    this.pollIntervalTimer = setInterval(() => {
      this.pollPipelines();
    }, intervalMs);
  }

  stopPollingLoop() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
  }

  restartPollingLoop() {
    this.stopPollingLoop();
    if (this.isPollingActive()) {
      this.startPollingLoop();
    }
  }

  async pollPipelines(specificPipelineId?: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    // Determine target pipelines to refresh (skip paused/cancelled during auto-polling)
    const targetPipelines = specificPipelineId
      ? this.deployments().filter(d => d.pipelineId === specificPipelineId)
      : this.deployments().filter(d => this.isLogsExpanded(d.pipelineId) && d.status !== 'Paused' && d.status !== 'Cancelled');

    if (targetPipelines.length === 0) {
      const now = new Date();
      this.lastPolledAt.set(now.toLocaleTimeString('en-US', { hour12: false }));
      return;
    }

    this.isPollingNow.set(true);

    try {
      const currentDeployments = [...this.deployments()];
      let hasChanges = false;

      for (const pipeline of targetPipelines) {
        try {
          const res = await fetch(`/api/github/pipeline/${pipeline.pipelineId}/logs`);
          if (res.ok) {
            const data = await res.json();
            if (data.newLog) {
              const idx = currentDeployments.findIndex(d => d.pipelineId === pipeline.pipelineId);
              if (idx !== -1) {
                const logs = currentDeployments[idx].logs || [];
                // Avoid identical consecutive duplicate lines
                if (logs[logs.length - 1] !== data.newLog) {
                  const updatedLogs = [...logs, data.newLog].slice(-150);
                  const newStatus = (currentDeployments[idx].status === 'Paused' || currentDeployments[idx].status === 'Cancelled')
                    ? currentDeployments[idx].status
                    : (data.status || currentDeployments[idx].status);

                  currentDeployments[idx] = {
                    ...currentDeployments[idx],
                    logs: updatedLogs,
                    status: newStatus
                  };
                  hasChanges = true;
                }
              }
            }
          }
        } catch (err) {
          console.warn(`Polling error on ${pipeline.pipelineId}:`, err);
        }
      }

      if (hasChanges) {
        this.saveDeployments(currentDeployments);
        
        // Also update inspected deployment if it's currently open
        const inspected = this.inspectedDeployment();
        if (inspected) {
          const matched = currentDeployments.find(d => d.pipelineId === inspected.pipelineId);
          if (matched) {
            this.inspectedDeployment.set(matched);
          }
        }
      }

      const now = new Date();
      this.lastPolledAt.set(now.toLocaleTimeString('en-US', { hour12: false }));
    } finally {
      this.isPollingNow.set(false);
    }
  }

  // --- Pipeline Lifecycle Controls (Start, Pause, Cancel) ---

  async startPipeline(deploy: DeploymentRecord) {
    const now = new Date().toISOString();

    // Case 1: If the pipeline is currently Paused, resume it
    if (deploy.status === 'Paused') {
      const updated = this.deployments().map(d => {
        if (d.pipelineId === deploy.pipelineId) {
          return {
            ...d,
            status: 'Active' as const,
            logs: [...(d.logs || []), `[${now}] [Pipeline] Resumed active monitoring and automated deployments.`]
          };
        }
        return d;
      });
      this.saveDeployments(updated);
      this.syncInspectedDeployment(deploy.pipelineId);

      try {
        await fetch(`/api/github/pipeline/${deploy.pipelineId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resume' })
        });
      } catch (err) {
        console.warn('Pipeline resume error:', err);
      }
      return;
    }

    // Case 2: Start a fresh build cycle (for Cancelled, Failed, or Active pipelines)
    const initialLogs = [
      ...(deploy.logs || []),
      `[${now}] [Trigger] Manual build dispatched by operator`,
      `[${now}] [Environment] Clean runner container initialized`
    ];

    const updatedInitial = this.deployments().map(d => {
      if (d.pipelineId === deploy.pipelineId) {
        return {
          ...d,
          status: 'Building' as const,
          logs: initialLogs
        };
      }
      return d;
    });
    this.saveDeployments(updatedInitial);
    this.syncInspectedDeployment(deploy.pipelineId);

    // Multi-stage realistic build step progression
    setTimeout(() => {
      const current = this.deployments().find(d => d.pipelineId === deploy.pipelineId);
      if (!current || current.status !== 'Building') return;
      const step1Time = new Date().toISOString();
      const step1Logs = [
        ...(current.logs || []),
        `[${step1Time}] [Build] Clean workspace verified (SHA: ${Math.random().toString(36).substring(2, 9)})`,
        `[${step1Time}] [Compile] Bundled frontend assets & Node runtime in 2.1s`
      ];
      const u1 = this.deployments().map(d => d.pipelineId === deploy.pipelineId ? { ...d, logs: step1Logs } : d);
      this.saveDeployments(u1);
      this.syncInspectedDeployment(deploy.pipelineId);
    }, 1000);

    setTimeout(() => {
      const current = this.deployments().find(d => d.pipelineId === deploy.pipelineId);
      if (!current || current.status !== 'Building') return;
      const step2Time = new Date().toISOString();
      const step2Logs = [
        ...(current.logs || []),
        `[${step2Time}] [Docker] Multi-stage container built & tagged`,
        `[${step2Time}] [Deploy] Health probe 200 OK — 100% traffic live!`
      ];
      const u2 = this.deployments().map(d => {
        if (d.pipelineId === deploy.pipelineId) {
          return {
            ...d,
            status: 'Success' as const,
            deployedAt: step2Time,
            logs: step2Logs
          };
        }
        return d;
      });
      this.saveDeployments(u2);
      this.syncInspectedDeployment(deploy.pipelineId);

      // Auto-transition to Active after 2.5 seconds
      setTimeout(() => {
        const check = this.deployments().find(d => d.pipelineId === deploy.pipelineId);
        if (check && check.status === 'Success') {
          const u3 = this.deployments().map(d => d.pipelineId === deploy.pipelineId ? { ...d, status: 'Active' as const } : d);
          this.saveDeployments(u3);
          this.syncInspectedDeployment(deploy.pipelineId);
        }
      }, 2500);
    }, 2400);

    try {
      await fetch(`/api/github/pipeline/${deploy.pipelineId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
    } catch (err) {
      console.warn('Pipeline start API call:', err);
    }
  }

  async pausePipeline(deploy: DeploymentRecord) {
    const now = new Date().toISOString();
    const updated = this.deployments().map(d => {
      if (d.pipelineId === deploy.pipelineId) {
        return {
          ...d,
          status: 'Paused' as const,
          logs: [...(d.logs || []), `[${now}] [Pipeline] Pipeline paused by operator. Monitoring suspended.`]
        };
      }
      return d;
    });
    this.saveDeployments(updated);
    this.syncInspectedDeployment(deploy.pipelineId);

    try {
      await fetch(`/api/github/pipeline/${deploy.pipelineId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      });
    } catch (err) {
      console.warn('Pipeline pause API error:', err);
    }
  }

  async cancelPipeline(deploy: DeploymentRecord) {
    const now = new Date().toISOString();
    const updated = this.deployments().map(d => {
      if (d.pipelineId === deploy.pipelineId) {
        return {
          ...d,
          status: 'Cancelled' as const,
          logs: [...(d.logs || []), `[${now}] [Pipeline] Active build cancelled by operator. Workspace safely halted.`]
        };
      }
      return d;
    });
    this.saveDeployments(updated);
    this.syncInspectedDeployment(deploy.pipelineId);

    try {
      await fetch(`/api/github/pipeline/${deploy.pipelineId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
    } catch (err) {
      console.warn('Pipeline cancel API error:', err);
    }
  }

  // --- Dedicated Completed Log Inspector Handlers ---

  openLogInspector(deploy: DeploymentRecord) {
    this.inspectedDeployment.set(deploy);
    this.logSearchQuery.set('');
    this.logFilterCategory.set('all');
    this.copiedInspectorLogs.set(false);
  }

  closeLogInspector() {
    this.inspectedDeployment.set(null);
  }

  syncInspectedDeployment(pipelineId: string) {
    const inspected = this.inspectedDeployment();
    if (inspected && inspected.pipelineId === pipelineId) {
      const match = this.deployments().find(d => d.pipelineId === pipelineId);
      if (match) {
        this.inspectedDeployment.set(match);
      }
    }
  }

  copyInspectorLogs() {
    if (!isPlatformBrowser(this.platformId)) return;
    const deploy = this.inspectedDeployment();
    if (!deploy) return;
    const text = (deploy.logs || []).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copiedInspectorLogs.set(true);
      setTimeout(() => this.copiedInspectorLogs.set(false), 2000);
    });
  }

  downloadInspectorLogs() {
    if (!isPlatformBrowser(this.platformId)) return;
    const deploy = this.inspectedDeployment();
    if (!deploy) return;
    const text = (deploy.logs || []).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-${deploy.pipelineId}-${deploy.repoFullName.replace('/', '_')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  copyPipelineLogs(deploy: DeploymentRecord) {
    if (!isPlatformBrowser(this.platformId)) return;
    const text = (deploy.logs || []).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.copiedPipelineId.set(deploy.pipelineId);
      setTimeout(() => {
        if (this.copiedPipelineId() === deploy.pipelineId) {
          this.copiedPipelineId.set(null);
        }
      }, 2000);
    });
  }

  clearPipelineLogs(pipelineId: string) {
    const updated = this.deployments().map(d => {
      if (d.pipelineId === pipelineId) {
        return {
          ...d,
          logs: [`[${new Date().toISOString()}] [Console] Logs cleared by user`]
        };
      }
      return d;
    });
    this.saveDeployments(updated);
  }

  ngOnDestroy() {
    this.stopPollingLoop();
  }

  activeAccount = computed(() => {
    const list = this.accounts();
    const id = this.activeAccountId();
    return list.find(a => a.id === id) || (list.length > 0 ? list[0] : null);
  });

  filteredRepos = computed(() => {
    const currentFilter = this.filter();
    const query = this.searchQuery().toLowerCase().trim();
    let currentRepos = this.repos();
    
    if (query) {
      currentRepos = currentRepos.filter(r => 
        r.name.toLowerCase().includes(query) || 
        r.full_name.toLowerCase().includes(query) ||
        (r.language && r.language.toLowerCase().includes(query))
      );
    }

    if (currentFilter === 'all') return currentRepos;
    if (currentFilter === 'public') return currentRepos.filter(r => !r.private);
    return currentRepos.filter(r => r.private);
  });

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Load accounts from storage
      this.loadSavedAccounts();
      this.loadSavedDeployments();

      // 2. Load auth URL
      try {
        const res = await fetch('/api/auth/url');
        if (res.ok) {
          const data = await res.json();
          this.authUrl.set(data.url);
        }
      } catch (err) {
        console.error('Failed to load auth URL', err);
      }

      // 3. Listen for OAuth postMessage
      window.addEventListener('message', async (event: MessageEvent) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.token) {
          await this.addAccountWithToken(event.data.token);
        }
      });

      // 4. Initial repos sync if active account exists
      if (this.activeAccount()) {
        this.loadRepos();
      }

      // 5. Start real-time background polling loop
      this.startPollingLoop();

      // 6. Fetch GitHub Webhook activity stream
      this.webhookService.fetchWebhookHistory();

      // 7. Initialize Debugger workspace with default repository files
      this.loadDebugRepoFiles('scientific--calculator-2');
      this.debugTerminalLogs.set([
        {
          command: 'node --version && npm --version',
          output: 'v20.18.0\n10.8.2\n✓ Container Sandbox Ready: Environment listening on http://0.0.0.0:3000',
          exitCode: 0,
          durationMs: 14,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }

  loadSavedAccounts() {
    try {
      const raw = localStorage.getItem('shippulse_accounts') || localStorage.getItem('autodeploy_accounts');
      if (raw) {
        const parsed: GitHubAccount[] = JSON.parse(raw);
        this.accounts.set(parsed);
        const activeId = localStorage.getItem('shippulse_active_account_id') || localStorage.getItem('autodeploy_active_account_id');
        if (activeId) {
          this.activeAccountId.set(Number(activeId));
        } else if (parsed.length > 0) {
          this.activeAccountId.set(parsed[0].id);
        }
      } else {
        // Migration check for legacy single token
        const legacyToken = localStorage.getItem('github_token');
        if (legacyToken) {
          this.addAccountWithToken(legacyToken);
          localStorage.removeItem('github_token');
        }
      }
    } catch (e) {
      console.error('Error loading accounts:', e);
    }
  }

  saveAccounts(list: GitHubAccount[]) {
    this.accounts.set(list);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('shippulse_accounts', JSON.stringify(list));
      if (this.activeAccountId()) {
        localStorage.setItem('shippulse_active_account_id', String(this.activeAccountId()));
      }
    }
  }

  loadSavedDeployments() {
    try {
      const raw = localStorage.getItem('shippulse_pipelines') || localStorage.getItem('autodeploy_pipelines');
      if (raw) {
        const parsed: DeploymentRecord[] = JSON.parse(raw);
        // Ensure all live URLs point reliably to /live/:pipelineId preview engine
        const sanitized = parsed.map(d => ({
          ...d,
          liveUrl: this.getWorkingLiveUrl(d)
        }));
        this.deployments.set(sanitized);
      }
    } catch (e) {
      console.error('Error loading deployments:', e);
    }
  }

  saveDeployments(list: DeploymentRecord[]) {
    this.deployments.set(list);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('shippulse_pipelines', JSON.stringify(list));
    }
  }

  async addAccountWithToken(token: string): Promise<boolean> {
    this.isVerifyingToken.set(true);
    this.tokenError.set(null);

    try {
      const res = await fetch('/api/github/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Invalid GitHub token. Please verify permissions (repo, user).');
      }

      const profile = await res.json();
      const newAccount: GitHubAccount = {
        id: profile.id,
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        token: token,
        public_repos: profile.public_repos,
        total_private_repos: profile.total_private_repos,
        addedAt: Date.now()
      };

      // Add or update account in list
      const existing = this.accounts().filter(a => a.id !== newAccount.id);
      const updated = [newAccount, ...existing];
      this.activeAccountId.set(newAccount.id);
      this.saveAccounts(updated);

      this.tokenInput.set('');
      this.modalTokenInput.set('');
      this.showAddAccountModal.set(false);
      this.showAccountMenu.set(false);

      await this.loadRepos();
      return true;
    } catch (err) {
      this.tokenError.set(err instanceof Error ? err.message : 'Failed to verify token');
      return false;
    } finally {
      this.isVerifyingToken.set(false);
    }
  }

  async connectWithToken() {
    const token = this.tokenInput().trim();
    if (!token) return;
    await this.addAccountWithToken(token);
  }

  async connectWithModalToken() {
    const token = this.modalTokenInput().trim();
    if (!token) return;
    await this.addAccountWithToken(token);
  }

  selectAccount(account: GitHubAccount) {
    this.activeAccountId.set(account.id);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('shippulse_active_account_id', String(account.id));
    }
    this.showAccountMenu.set(false);
    this.loadRepos();
  }

  openAddAccountModal() {
    this.tokenError.set(null);
    this.modalTokenInput.set('');
    this.showAccountMenu.set(false);
    this.showAddAccountModal.set(true);
  }

  disconnectActiveAccount() {
    const current = this.activeAccount();
    if (!current) return;

    const remaining = this.accounts().filter(a => a.id !== current.id);
    this.activeAccountId.set(remaining.length > 0 ? remaining[0].id : null);
    this.saveAccounts(remaining);
    this.showAccountMenu.set(false);

    if (remaining.length > 0) {
      this.loadRepos();
    } else {
      this.repos.set([]);
    }
  }

  async loadRepos() {
    const account = this.activeAccount();
    if (!account) return;

    this.isLoadingRepos.set(true);
    this.error.set(null);

    try {
      const res = await fetch('/api/github/repos', {
        headers: { 'Authorization': `Bearer ${account.token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(`Token for @${account.login} has expired or was revoked.`);
        }
        throw new Error('Failed to load repositories from GitHub.');
      }

      const data = await res.json();
      this.repos.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error fetching repos');
    } finally {
      this.isLoadingRepos.set(false);
    }
  }

  async triggerDeploy(repo: Repo) {
    const account = this.activeAccount();
    if (!account) return;

    this.deployingRepo.set(repo.full_name);

    try {
      const res = await fetch('/api/github/deploy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repoFullName: repo.full_name,
          branch: repo.default_branch || 'main',
          environment: 'Production'
        })
      });

      if (!res.ok) throw new Error('Deployment trigger failed');

      const data = await res.json();
      const newDeploy: DeploymentRecord = {
        pipelineId: data.deployment.pipelineId,
        repoFullName: repo.full_name,
        branch: repo.default_branch || 'main',
        environment: 'Production',
        status: 'Active',
        autoDeployOnPush: true,
        deployedAt: new Date().toISOString(),
        liveUrl: data.deployment.liveUrl,
        logs: ['[Init] Webhook registered on GitHub', '[Build] Docker image generated', '[Deploy] Live endpoint ready']
      };

      const updated = [newDeploy, ...this.deployments().filter(d => d.repoFullName !== repo.full_name)];
      this.saveDeployments(updated);
    } catch (err) {
      console.error(err);
      alert('Could not configure automated deployment for this repository.');
    } finally {
      this.deployingRepo.set(null);
    }
  }

  isRepoDeployed(fullName: string): boolean {
    return this.deployments().some(d => d.repoFullName === fullName);
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    } catch {
      return dateStr;
    }
  }

  getPipelineStageProgress(status: string): number {
    switch (status) {
      case 'Success':
      case 'Active':
        return 100;
      case 'Building':
        return 68;
      case 'Paused':
        return 40;
      case 'Failed':
        return 60;
      case 'Cancelled':
        return 20;
      default:
        return 100;
    }
  }

  getStageState(stageIndex: number, status: string): 'completed' | 'active' | 'paused' | 'failed' | 'pending' {
    if (status === 'Active' || status === 'Success') {
      return 'completed';
    }
    if (status === 'Cancelled') {
      return stageIndex === 1 ? 'completed' : 'pending';
    }
    if (status === 'Paused') {
      if (stageIndex <= 2) return 'completed';
      if (stageIndex === 3) return 'paused';
      return 'pending';
    }
    if (status === 'Failed') {
      if (stageIndex <= 2) return 'completed';
      if (stageIndex === 3) return 'failed';
      return 'pending';
    }
    if (status === 'Building') {
      if (stageIndex <= 2) return 'completed';
      if (stageIndex === 3 || stageIndex === 4) return 'active';
      return 'pending';
    }
    return 'completed';
  }

  // --- Live Deployment Sandbox & Webview Controls ---

  openLivePreview(deploy: DeploymentRecord) {
    this.previewingDeployment.set(deploy);
  }

  closeLivePreview() {
    this.previewingDeployment.set(null);
  }

  getWorkingLiveUrl(deploy?: DeploymentRecord | null): string {
    if (!deploy) return '/live/default';
    const cleanPipelineId = deploy.pipelineId || 'default';
    const repoParam = encodeURIComponent(deploy.repoFullName || 'repo');
    const branchParam = encodeURIComponent(deploy.branch || 'main');
    return `/live/${cleanPipelineId}?repo=${repoParam}&branch=${branchParam}`;
  }

  getSafeLiveUrl(deploy?: DeploymentRecord | null): SafeResourceUrl {
    const url = this.getWorkingLiveUrl(deploy);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // --- GitHub Webhook Suite & Push Simulator Handlers ---

  async copyWebhookUrl() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        await navigator.clipboard.writeText(this.webhookEndpointUrl());
        this.copiedWebhookUrl.set(true);
        setTimeout(() => this.copiedWebhookUrl.set(false), 2000);
      } catch (err) {
        console.warn('Clipboard write error:', err);
      }
    }
  }

  async copyWebhookSecret() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        await navigator.clipboard.writeText(this.webhookSecret());
        this.copiedWebhookSecret.set(true);
        setTimeout(() => this.copiedWebhookSecret.set(false), 2000);
      } catch (err) {
        console.warn('Clipboard write error:', err);
      }
    }
  }

  regenerateSecret() {
    this.webhookSecret.set('whsec_' + Math.random().toString(36).substring(2, 12) + '_' + Math.random().toString(36).substring(2, 8));
  }

  onSimulatedRepoChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.simulatedRepo.set(target.value);
  }

  onSimulatedBranchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.simulatedBranch.set(target.value);
  }

  onSimulatedAuthorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.simulatedAuthor.set(target.value);
  }

  onSimulatedMessageChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.simulatedMessage.set(target.value);
  }

  showWebhookToast(title: string, message: string) {
    this.webhookToast.set({ title, message });
    setTimeout(() => {
      this.webhookToast.set(null);
    }, 4500);
  }

  async dispatchSimulatedWebhook() {
    const repo = this.simulatedRepo() || 'ishaan-gitoutlook/scientific--calculator-2';
    const branch = this.simulatedBranch() || 'main';
    const author = this.simulatedAuthor() || 'developer';
    const message = this.simulatedMessage() || 'Continuous integration commit dispatch';

    this.isDispatchingWebhook.set(true);

    try {
      const res = await this.webhookService.simulatePushEvent(repo, branch, author, message);
      
      const now = new Date().toISOString();
      const pipelineId = res?.triggeredDeployment?.pipelineId || `pipe_${Date.now().toString(36)}`;
      const commitSha = res?.triggeredDeployment?.commit?.sha || Math.random().toString(16).substring(2, 9);
      
      // Look for existing pipeline for this repo or create new
      const existing = this.deployments().find(d => d.repoFullName === repo);
      
      if (existing) {
        // Transition existing to Building with webhook trigger log
        const updated = this.deployments().map(d => {
          if (d.repoFullName === repo) {
            return {
              ...d,
              status: 'Building' as const,
              branch,
              logs: [
                ...(d.logs || []),
                `[${now}] [Webhook] Push event received on branch "${branch}" by @${author}`,
                `[${now}] [Webhook] Commit SHA: ${commitSha} - "${message}"`,
                `[${now}] [Build] ShipPulse runner triggered zero-downtime container compilation`
              ]
            };
          }
          return d;
        });
        this.saveDeployments(updated);

        // Transition to Active after 1.5s build simulation
        setTimeout(() => {
          const finished = this.deployments().map(d => {
            if (d.repoFullName === repo) {
              return {
                ...d,
                status: 'Active' as const,
                logs: [
                  ...(d.logs || []),
                  `[${new Date().toISOString()}] [Deploy] Container image deployed successfully to ${this.getWorkingLiveUrl(d)}`
                ]
              };
            }
            return d;
          });
          this.saveDeployments(finished);
        }, 1500);

      } else {
        // Create new pipeline
        const newRecord: DeploymentRecord = {
          pipelineId,
          repoFullName: repo,
          branch,
          environment: 'Production',
          status: 'Active',
          autoDeployOnPush: true,
          deployedAt: now,
          liveUrl: this.getWorkingLiveUrl({ pipelineId, repoFullName: repo, branch } as DeploymentRecord),
          logs: [
            `[${now}] [Webhook] Initial push event received on branch "${branch}" by @${author}`,
            `[${now}] [Webhook] Commit SHA: ${commitSha} - "${message}"`,
            `[${now}] [Init] Webhook registered on GitHub repository`,
            `[${now}] [Build] Docker microservice image generated`,
            `[${now}] [Deploy] Live container endpoint active and serving traffic`
          ]
        };
        const updated = [newRecord, ...this.deployments()];
        this.saveDeployments(updated);
      }

      this.showWebhookToast(
        'GitHub Webhook Event Handled',
        `Successfully triggered automated build for ${repo} (${branch})`
      );

    } catch (err) {
      console.error('Failed to dispatch simulated webhook:', err);
      this.showWebhookToast('Webhook Dispatch Warning', 'Event handled locally.');
    } finally {
      this.isDispatchingWebhook.set(false);
    }
  }

  // ==========================================
  // DEBUG & RUN WORKSPACE METHODS
  // ==========================================

  openDebugTab() {
    this.currentTab.set('debug');
    if (this.debugFiles().length === 0) {
      this.loadDebugRepoFiles(this.selectedDebugRepo());
    }
  }

  openDebugForRepo(repoName: string, filePath?: string) {
    const clean = repoName.includes('/') ? repoName.split('/')[1] : repoName;
    this.selectedDebugRepo.set(clean);
    this.currentTab.set('debug');
    this.loadDebugRepoFiles(clean, filePath);
  }

  async selectDebugRepo(repoName: string) {
    const clean = repoName.includes('/') ? repoName.split('/')[1] : repoName;
    this.selectedDebugRepo.set(clean);
    await this.loadDebugRepoFiles(clean);
    this.refreshDebugIframe();
  }

  getRepoOwnerAndName(repoFullNameOrName: string): { owner: string; name: string } {
    if (repoFullNameOrName.includes('/')) {
      const parts = repoFullNameOrName.split('/');
      return { owner: parts[0], name: parts[1] };
    }
    const currentAccount = this.activeAccount();
    return {
      owner: currentAccount?.login || 'default',
      name: repoFullNameOrName
    };
  }

  async loadDebugRepoFiles(repoName: string, defaultFilePath?: string) {
    const { owner, name: clean } = this.getRepoOwnerAndName(repoName);
    this.isLoadingDebugFiles.set(true);
    try {
      const res = await fetch(`/api/github/repos/${owner}/${clean}/files`);
      if (res.ok) {
        const data = await res.json();
        const files: RepoFileItem[] = data.files || [];
        this.debugFiles.set(files);

        let target = defaultFilePath;
        if (!target || !files.some(f => f.path === target)) {
          if (clean.includes('calculator')) {
            target = 'src/calculator.js';
          } else {
            target = 'src/app.js';
          }
          if (!files.some(f => f.path === target) && files.length > 0) {
            target = files[0].path;
          }
        }
        if (target) {
          await this.loadDebugFile(target);
        }
      }
    } catch (err) {
      console.warn('Failed to load debug files:', err);
    } finally {
      this.isLoadingDebugFiles.set(false);
    }
  }

  async loadDebugFile(filePath: string) {
    const rawRepo = this.selectedDebugRepo();
    const { owner, name: clean } = this.getRepoOwnerAndName(rawRepo);
    this.selectedDebugFilePath.set(filePath);
    this.isLoadingDebugFile.set(true);
    this.debugSaveMessage.set(null);
    try {
      const res = await fetch(`/api/github/repos/${owner}/${clean}/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        this.debugFileContent.set(data.content || '');
      }
    } catch (err) {
      console.warn('Failed to load file content:', err);
    } finally {
      this.isLoadingDebugFile.set(false);
    }
  }

  onDebugCodeChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.debugFileContent.set(target.value);
  }

  async saveDebugFile() {
    const rawRepo = this.selectedDebugRepo();
    const { owner, name: clean } = this.getRepoOwnerAndName(rawRepo);
    const filePath = this.selectedDebugFilePath();
    const content = this.debugFileContent();
    
    this.isSavingDebugFile.set(true);
    this.debugSaveMessage.set(null);

    try {
      const res = await fetch(`/api/github/repos/${owner}/${clean}/save-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content })
      });

      if (res.ok) {
        this.debugSaveMessage.set(`✓ File saved & hot-patched to live container (${new Date().toLocaleTimeString()})`);
        this.refreshDebugIframe();
        setTimeout(() => this.debugSaveMessage.set(null), 4000);
      }
    } catch (err) {
      console.warn('Failed to save file:', err);
      this.debugSaveMessage.set('⚠ Error saving file');
    } finally {
      this.isSavingDebugFile.set(false);
    }
  }

  async runDebugCommand(commandToRun?: string) {
    const cmd = (commandToRun || this.customDebugCommand() || 'npm test').trim();
    if (!cmd) return;

    const rawRepo = this.selectedDebugRepo();
    const { owner, name: clean } = this.getRepoOwnerAndName(rawRepo);
    this.isExecutingDebugCommand.set(true);

    try {
      const res = await fetch(`/api/github/repos/${owner}/${clean}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });

      if (res.ok) {
        const data = await res.json();
        const newLog: DebugExecResult = {
          command: data.command || cmd,
          output: data.output || 'Command executed with no output.',
          exitCode: data.exitCode ?? 0,
          durationMs: data.durationMs || 42,
          timestamp: data.timestamp || new Date().toISOString()
        };
        this.debugTerminalLogs.update(logs => [...logs, newLog]);
      }
    } catch (err) {
      console.warn('Failed to exec command:', err);
      const errLog: DebugExecResult = {
        command: cmd,
        output: `Error executing command: ${err}`,
        exitCode: 1,
        durationMs: 12,
        timestamp: new Date().toISOString()
      };
      this.debugTerminalLogs.update(logs => [...logs, errLog]);
    } finally {
      this.isExecutingDebugCommand.set(false);
    }
  }

  clearDebugTerminal() {
    this.debugTerminalLogs.set([]);
  }

  async restartDebugContainer() {
    this.isRestartingDebugContainer.set(true);
    await this.runDebugCommand('npm start');
    this.refreshDebugIframe();
    setTimeout(() => {
      this.isRestartingDebugContainer.set(false);
    }, 600);
  }

  refreshDebugIframe() {
    this.debugRefreshKey.set(Date.now());
  }

  getSafeDebugUrl(): SafeResourceUrl {
    const repo = this.selectedDebugRepo();
    const key = this.debugRefreshKey();
    const url = `/live/debug-env?repo=${encodeURIComponent(repo)}&t=${key}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getWorkingDebugUrl(): string {
    const repo = this.selectedDebugRepo();
    const key = this.debugRefreshKey();
    return `/live/debug-env?repo=${encodeURIComponent(repo)}&t=${key}`;
  }

  // --- CI/CD Workflow Template Generator & Configuration Methods ---

  addEnvVar(key = '', value = '', isSecret = false) {
    const newId = 'env-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    this.configEnvVars.update(list => [...list, { id: newId, key, value, isSecret }]);
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  updateEnvVarKey(id: string, newKey: string) {
    this.configEnvVars.update(list => list.map(item => item.id === id ? { ...item, key: newKey } : item));
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  updateEnvVarValue(id: string, newValue: string) {
    this.configEnvVars.update(list => {
      return list.map(item => {
        if (item.id === id) {
          const isSecret = newValue.includes('${{ secrets.') || item.isSecret;
          return { ...item, value: newValue, isSecret };
        }
        return item;
      });
    });
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  toggleEnvVarSecret(id: string) {
    this.configEnvVars.update(list => {
      return list.map(item => {
        if (item.id === id) {
          const newIsSecret = !item.isSecret;
          let newValue = item.value;
          const cleanKey = item.key.trim() || 'SECRET_KEY';
          if (newIsSecret) {
            if (!newValue.startsWith('${{')) {
              newValue = `\${{ secrets.${cleanKey} }}`;
            }
          } else {
            if (newValue.startsWith('${{ secrets.') && newValue.endsWith(' }}')) {
              newValue = 'production_value';
            }
          }
          return { ...item, isSecret: newIsSecret, value: newValue };
        }
        return item;
      });
    });
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  toggleSecretTooltip(id: string) {
    this.activeSecretTooltipId.update(current => current === id ? null : id);
  }

  closeSecretTooltip() {
    this.activeSecretTooltipId.set(null);
  }

  toggleGlobalSecretsInfo() {
    this.showGlobalSecretsInfo.update(v => !v);
  }

  removeEnvVar(id: string) {
    this.configEnvVars.update(list => list.filter(item => item.id !== id));
    if (this.activeSecretTooltipId() === id) {
      this.activeSecretTooltipId.set(null);
    }
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  resetDefaultEnvVars() {
    const tpl = this.selectedConfigTemplateId();
    if (tpl === 'python') {
      this.configEnvVars.set([
        { id: 'env-1', key: 'PYTHONUNBUFFERED', value: '"1"', isSecret: false },
        { id: 'env-2', key: 'FLASK_ENV', value: 'production', isSecret: false },
        { id: 'env-3', key: 'PORT', value: String(this.configPort() || 3000), isSecret: false },
        { id: 'env-4', key: 'DATABASE_URL', value: '${{ secrets.DATABASE_URL }}', isSecret: true }
      ]);
    } else {
      this.configEnvVars.set([
        { id: 'env-1', key: 'NODE_ENV', value: 'production', isSecret: false },
        { id: 'env-2', key: 'PORT', value: String(this.configPort() || 3000), isSecret: false },
        { id: 'env-3', key: 'DATABASE_URL', value: '${{ secrets.DATABASE_URL }}', isSecret: true },
        { id: 'env-4', key: 'API_SECRET_KEY', value: '${{ secrets.API_SECRET_KEY }}', isSecret: true }
      ]);
    }
    if (this.isCustomYamlEdited()) {
      this.isCustomYamlEdited.set(false);
      this.customWorkflowYaml.set('');
    }
  }

  addPresetEnvVar(presetType: 'db' | 'jwt' | 'redis' | 'api' | 's3') {
    switch (presetType) {
      case 'db':
        this.addEnvVar('DATABASE_URL', '${{ secrets.DATABASE_URL }}', true);
        break;
      case 'jwt':
        this.addEnvVar('JWT_SECRET', '${{ secrets.JWT_SECRET }}', true);
        break;
      case 'redis':
        this.addEnvVar('REDIS_URL', 'redis://default:${{ secrets.REDIS_PASSWORD }}@redis-host:6379', true);
        break;
      case 'api':
        this.addEnvVar('API_KEY', '${{ secrets.API_KEY }}', true);
        break;
      case 's3':
        this.addEnvVar('AWS_S3_BUCKET', 'production-app-storage', false);
        break;
    }
  }

  formatEnvBlockYaml(): string {
    const validVars = this.configEnvVars().filter(v => v.key.trim().length > 0);
    if (validVars.length === 0) {
      return '';
    }
    const lines = ['env:'];
    for (const v of validVars) {
      const cleanKey = v.key.trim();
      const val = v.value.trim();
      if (val === '') {
        lines.push(`  ${cleanKey}: ""`);
      } else if (val.startsWith('${{') || val.startsWith('"') || val.startsWith("'") || /^(true|false|[0-9]+)$/i.test(val)) {
        lines.push(`  ${cleanKey}: ${val}`);
      } else if (/[:#[\]{}&*!|>'%@`,]/.test(val) || val.includes(' ')) {
        lines.push(`  ${cleanKey}: "${val.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`  ${cleanKey}: ${val}`);
      }
    }
    return lines.join('\n');
  }

  generatedWorkflowYaml = computed(() => {
    if (this.isCustomYamlEdited() && this.customWorkflowYaml().trim()) {
      return this.customWorkflowYaml();
    }

    const tplId = this.selectedConfigTemplateId();
    const branch = this.configBranch().trim() || 'main';
    const repo = this.selectedConfigRepo();
    const port = this.configPort() || 3000;
    const triggerPush = this.configTriggerPush();
    const triggerPR = this.configTriggerPR();
    const triggerManual = this.configTriggerManual();

    let triggerYaml = 'on:\n';
    if (triggerPush) {
      triggerYaml += `  push:\n    branches: [ "${branch}" ]\n`;
    }
    if (triggerPR) {
      triggerYaml += `  pull_request:\n    branches: [ "${branch}" ]\n`;
    }
    if (triggerManual || (!triggerPush && !triggerPR)) {
      triggerYaml += `  workflow_dispatch:\n`;
    }

    const envBlock = this.formatEnvBlockYaml();
    const envSection = envBlock ? `${envBlock}\n\n` : '';

    if (tplId === 'nodejs') {
      const nodeVer = this.configNodeVersion();
      const pkgMgr = this.configPackageManager();
      const testCmd = this.configTestCommand() || 'npm test';
      const buildCmd = this.configBuildCommand() || 'npm run build';
      const installCmd = pkgMgr === 'yarn' ? 'yarn install --frozen-lockfile' : pkgMgr === 'pnpm' ? 'pnpm install --frozen-lockfile' : 'npm ci';

      return `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Node.js & Full-Stack Application
# Target Repository: ishaan-gitoutlook/${repo}
# Trigger Branches: [${branch}]
# ========================================================
name: ShipPulse CI/CD (Node.js)

${triggerYaml}
${envSection}jobs:
  validate-and-test:
    name: 🧪 Automated Test & Validation
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: 📥 Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ⚙️ Setup Node.js ${nodeVer}.x
        uses: actions/setup-node@v4
        with:
          node-version: ${nodeVer}
          cache: '${pkgMgr}'

      - name: 📦 Install Dependencies
        run: ${installCmd}

      - name: 🧪 Execute Automated Test Suite
        run: ${testCmd}

      - name: 🏗️ Compile Assets & Build
        run: ${buildCmd} --if-present

  deploy-production:
    name: 🚀 Production Container Deployment
    needs: validate-and-test
    if: github.ref == 'refs/heads/${branch}'
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4

      - name: 🐳 Package Container Image
        run: |
          echo "Packaging container for ishaan-gitoutlook/${repo}..."
          docker build -t app:${branch} .

      - name: 🌐 Zero-Downtime Live Deploy
        run: |
          echo "🚀 Deploying to ShipPulse Live Sandbox..."
          echo "✔ Container listening on host 0.0.0.0:${port}"
          echo "✔ SSL TLS 1.3 Readiness probe: HTTP 200 OK"
`;
    } else if (tplId === 'python') {
      const pyVer = this.configPythonVersion();
      const testCmd = this.configTestCommand() || 'pytest --maxfail=1 --disable-warnings -v';
      return `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Python / FastAPI & Flask Microservice
# Target Repository: ishaan-gitoutlook/${repo}
# Target Python Version: ${pyVer}
# ========================================================
name: ShipPulse CI/CD (Python / FastAPI)

${triggerYaml}
${envSection}jobs:
  lint-and-pytest:
    name: 🐍 Python Lint & Pytest Suite
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🐍 Setup Python ${pyVer}
        uses: actions/setup-python@v5
        with:
          python-version: '${pyVer}'
          cache: 'pip'

      - name: 📦 Install Requirements & Test Framework
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest flake8 gunicorn

      - name: 🔍 Static Code Analysis (flake8)
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

      - name: 🧪 Run Pytest Suite
        run: ${testCmd}

  deploy-service:
    name: 🚀 Gunicorn WSGI Deploy
    needs: lint-and-pytest
    if: github.ref == 'refs/heads/${branch}'
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🚀 Deploy Container Microservice
        run: |
          echo "Binding Gunicorn server to 0.0.0.0:${port}..."
          echo "✔ Microservice online with active health checks."
`;
    } else if (tplId === 'staticsite') {
      const buildCmd = this.configBuildCommand() || 'npm run build';
      return `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Static Site & Single Page Application (SPA)
# Target Repository: ishaan-gitoutlook/${repo}
# ========================================================
name: ShipPulse CI/CD (Static Site & SPA)

${triggerYaml}
${envSection}jobs:
  build-frontend:
    name: ⚡ Bundle Frontend Assets
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ⚙️ Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Install Dependencies
        run: npm ci

      - name: 🏗️ Compile Production Bundle
        run: ${buildCmd}

      - name: 📤 Upload Build Artifact
        uses: actions/upload-artifact@v4
        with:
          name: static-dist
          path: dist/

  deploy-edge:
    name: 🌐 Edge Web Server Sync
    needs: build-frontend
    if: github.ref == 'refs/heads/${branch}'
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Download Build Artifact
        uses: actions/download-artifact@v4
        with:
          name: static-dist
          path: dist/

      - name: 🚀 Deploy to Static Web Server
        run: |
          echo "Syncing static files to Nginx web root..."
          echo "✔ Single Page Application fallback enabled: index.html"
          echo "✔ Live at http://0.0.0.0:${port}"
`;
    } else if (tplId === 'docker') {
      return `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Docker Multi-Stage Container
# Target Repository: ishaan-gitoutlook/${repo}
# ========================================================
name: ShipPulse CI/CD (Docker Container)

${triggerYaml}
${envSection}jobs:
  docker-build-and-deploy:
    name: 🐳 Docker Build & Deploy
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ⚙️ Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 🐳 Build Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: false
          tags: ishaan-gitoutlook/${repo}:${branch}

      - name: 🚀 Launch Container Sandbox
        run: |
          echo "Starting container on port ${port}..."
          echo "✔ Health check endpoint: http://0.0.0.0:${port}/api/health (200 OK)"
`;
    } else {
      const testCmd = this.configTestCommand() || 'go test -v ./...';
      return `# ========================================================
# ShipPulse CI/CD Pipeline
# Template: Go Microservice Engine
# Target Repository: ishaan-gitoutlook/${repo}
# ========================================================
name: ShipPulse CI/CD (Go Microservice)

${triggerYaml}
${envSection}jobs:
  test-and-compile:
    name: 🔵 Go Test & Static Binary Build
    runs-on: ubuntu-latest

    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: ⚙️ Setup Go 1.22
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: 🧪 Run Unit Tests
        run: ${testCmd}

      - name: 🏗️ Compile Static Binary
        env:
          CGO_ENABLED: "0"
        run: go build -ldflags="-s -w" -o server .

  deploy-distroless:
    name: 🚀 Distroless Container Deploy
    needs: test-and-compile
    if: github.ref == 'refs/heads/${branch}'
    runs-on: ubuntu-latest

    steps:
      - name: 🚀 Deploy Microservice
        run: |
          echo "Deploying scratch Go binary to Port ${port}..."
          echo "✔ Service ready at http://0.0.0.0:${port}"
`;
    }
  });

  openConfigTab(subTab?: 'editor' | 'validator' | 'history') {
    if (subTab) {
      this.configSubTab.set(subTab);
    }
    this.currentTab.set('config');
  }

  openConfigForRepo(repoName: string, templateId?: 'nodejs' | 'python' | 'staticsite' | 'docker' | 'golang') {
    const clean = repoName.includes('/') ? repoName.split('/')[1] : repoName;
    this.selectedConfigRepo.set(clean);
    if (templateId) {
      this.selectedConfigTemplateId.set(templateId);
    } else if (clean.includes('calculator') || clean.includes('task-board')) {
      this.selectedConfigTemplateId.set('nodejs');
    }
    this.isCustomYamlEdited.set(false);
    this.customWorkflowYaml.set('');
    this.workflowSuccessMessage.set(null);
    this.configSubTab.set('editor');
    this.currentTab.set('config');
  }

  selectConfigTemplate(templateId: 'nodejs' | 'python' | 'staticsite' | 'docker' | 'golang') {
    this.selectedConfigTemplateId.set(templateId);
    this.isCustomYamlEdited.set(false);
    this.customWorkflowYaml.set('');
    this.workflowSuccessMessage.set(null);
  }

  onWorkflowYamlEdit(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.customWorkflowYaml.set(target.value);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  fixTabsInYaml() {
    const current = this.generatedWorkflowYaml();
    const fixed = this.yamlLinter.fixTabs(current);
    this.customWorkflowYaml.set(fixed);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  autoFixActionVersions() {
    const current = this.generatedWorkflowYaml();
    const fixed = this.yamlLinter.upgradeActionVersions(current);
    this.customWorkflowYaml.set(fixed);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  autoFixAddRunsOn() {
    const current = this.generatedWorkflowYaml();
    const fixed = this.yamlLinter.addRunsOnUbuntu(current);
    this.customWorkflowYaml.set(fixed);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  formatWorkflowYaml() {
    const current = this.generatedWorkflowYaml();
    const fixed = this.yamlLinter.formatYaml(current);
    this.customWorkflowYaml.set(fixed);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  autoFixAll() {
    let current = this.generatedWorkflowYaml();
    current = this.yamlLinter.fixTabs(current);
    current = this.yamlLinter.upgradeActionVersions(current);
    current = this.yamlLinter.addRunsOnUbuntu(current);
    current = this.yamlLinter.formatYaml(current);
    this.customWorkflowYaml.set(current);
    this.isCustomYamlEdited.set(true);
    this.workflowSuccessMessage.set(null);
  }

  toggleSampleSyntaxError() {
    if (this.isYamlValid()) {
      // Intentionally introduce common YAML syntax errors to showcase the real-time linter
      const current = this.generatedWorkflowYaml();
      const broken = current + '\n\n# Sample Syntax Error Introduced for Testing\n\tinvalid_tab_line:\n    unclosed_quote: "forgot to close\n    duplicate_key: true\n    duplicate_key: false\n';
      this.customWorkflowYaml.set(broken);
      this.isCustomYamlEdited.set(true);
      this.workflowSuccessMessage.set(null);
    } else {
      this.resetWorkflowYaml();
    }
  }

  selectLintIssue(issue: YamlLintIssue | null) {
    this.selectedLintIssue.set(issue);
  }

  resetWorkflowYaml() {
    this.isCustomYamlEdited.set(false);
    this.customWorkflowYaml.set('');
    this.workflowSuccessMessage.set(null);
    this.selectedLintIssue.set(null);
  }

  async copyWorkflowYaml() {
    const content = this.generatedWorkflowYaml();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        this.copiedWorkflowYaml.set(true);
        setTimeout(() => this.copiedWorkflowYaml.set(false), 2500);
      }
    } catch (err) {
      console.warn('Failed to copy YAML:', err);
    }
  }

  downloadWorkflowYaml() {
    const content = this.generatedWorkflowYaml();
    const blob = new Blob([content], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deploy.yml';
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Workflow History Management ---

  selectHistoryRevision(id: string) {
    this.selectedHistoryRevisionId.set(id);
  }

  rollbackToRevision(rev: WorkflowRevision) {
    this.customWorkflowYaml.set(rev.yamlContent);
    this.isCustomYamlEdited.set(true);
    if (rev.branch) {
      this.configBranch.set(rev.branch);
    }
    if (rev.filePath) {
      this.configFilePath.set(rev.filePath);
    }
    if (rev.templateId && ['nodejs', 'python', 'staticsite', 'docker', 'golang'].includes(rev.templateId)) {
      this.selectedConfigTemplateId.set(rev.templateId as 'nodejs' | 'python' | 'staticsite' | 'docker' | 'golang');
    }
    if (rev.envVars && Array.isArray(rev.envVars)) {
      this.configEnvVars.set(JSON.parse(JSON.stringify(rev.envVars)));
    }

    // Record rollback in history
    this.workflowHistoryService.addRevision({
      repository: rev.repository,
      branch: rev.branch,
      filePath: rev.filePath,
      templateId: rev.templateId,
      templateName: rev.templateName,
      commitMessage: `Rollback to Revision v${rev.version} (${rev.formattedDate})`,
      yamlContent: rev.yamlContent,
      envVars: rev.envVars,
      healthScore: rev.healthScore,
      securityRating: rev.securityRating,
      errorsCount: rev.errorsCount,
      warningsCount: rev.warningsCount,
      jobsCount: rev.jobsCount,
      triggers: rev.triggers,
      source: 'rollback',
      tag: `Rollback to v${rev.version}`
    });

    this.historyActionToast.set(`⚡ Successfully restored configuration from Revision v${rev.version}`);
    setTimeout(() => this.historyActionToast.set(null), 4000);
    this.configSubTab.set('editor');
  }

  openSaveSnapshotModal() {
    this.snapshotCustomNote.set(`Milestone snapshot before deployment update`);
    this.snapshotTagName.set(`Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    this.showSaveSnapshotModal.set(true);
  }

  saveSnapshotNow() {
    const repo = this.selectedConfigRepo();
    const stats = this.yamlStats();
    const currentYaml = this.generatedWorkflowYaml();
    const currentVars = this.configEnvVars();
    const note = this.snapshotCustomNote().trim() || 'Manual workflow configuration snapshot';
    const tag = this.snapshotTagName().trim() || 'Manual Milestone';

    const newRev = this.workflowHistoryService.addRevision({
      repository: repo,
      branch: this.configBranch().trim() || 'main',
      filePath: this.configFilePath().trim() || '.github/workflows/deploy.yml',
      templateId: this.selectedConfigTemplateId(),
      templateName: this.workflowTemplates.find(t => t.id === this.selectedConfigTemplateId())?.name || 'Custom Workflow',
      commitMessage: note,
      yamlContent: currentYaml,
      envVars: currentVars,
      healthScore: stats.healthScore,
      securityRating: stats.securityRating,
      errorsCount: this.yamlErrors().length,
      warningsCount: this.yamlWarnings().length,
      jobsCount: stats.jobsCount,
      triggers: stats.triggers,
      source: 'manual_snapshot',
      tag
    });

    this.selectedHistoryRevisionId.set(newRev.id);
    this.showSaveSnapshotModal.set(false);
    this.historyActionToast.set(`✓ Snapshot saved as Revision v${newRev.version}`);
    setTimeout(() => this.historyActionToast.set(null), 4000);
  }

  deleteHistoryRevision(id: string) {
    this.workflowHistoryService.deleteRevision(id);
    this.historyActionToast.set('Revision removed from history.');
    setTimeout(() => this.historyActionToast.set(null), 3000);
  }

  clearCurrentRepoHistory() {
    this.workflowHistoryService.clearRepoHistory(this.selectedConfigRepo());
    this.historyActionToast.set('Repository revision history cleared.');
    setTimeout(() => this.historyActionToast.set(null), 3000);
  }

  resetHistoryDefaults() {
    this.workflowHistoryService.resetToDefaultSeeds();
    this.historyActionToast.set('Workflow revision history reset to defaults.');
    setTimeout(() => this.historyActionToast.set(null), 3000);
  }

  async copyHistoryRevisionYaml(rev: WorkflowRevision) {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(rev.yamlContent);
        this.copiedHistoryYaml.set(true);
        setTimeout(() => this.copiedHistoryYaml.set(false), 2500);
      }
    } catch (err) {
      console.warn('Failed to copy revision YAML:', err);
    }
  }

  downloadHistoryRevisionYaml(rev: WorkflowRevision) {
    const blob = new Blob([rev.yamlContent], { type: 'text/yaml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deploy-v${rev.version}.yml`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async commitAndGenerateWorkflow() {
    // 1. Guard against invalid YAML syntax before attempting commit
    if (!this.isYamlValid()) {
      const errCount = this.yamlErrors().length;
      const firstErr = this.yamlErrors()[0];
      this.workflowSuccessMessage.set(`⚠ Cannot commit: Found ${errCount} YAML syntax error(s). (Line ${firstErr?.line}: ${firstErr?.message})`);
      return;
    }

    const rawRepo = this.selectedConfigRepo();
    const { owner, name: repo } = this.getRepoOwnerAndName(rawRepo);
    const branch = this.configBranch().trim() || 'main';
    const filePath = this.configFilePath().trim() || '.github/workflows/deploy.yml';
    const yamlContent = this.generatedWorkflowYaml();
    const commitMessage = this.configCommitMessage().trim() || 'ci: add automated deployment workflow via ShipPulse';
    const stats = this.yamlStats();

    this.isGeneratingWorkflow.set(true);
    this.workflowSuccessMessage.set(null);

    try {
      const res = await fetch(`/api/github/repos/${owner}/${repo}/generate-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: this.selectedConfigTemplateId(),
          filePath,
          yamlContent,
          branch,
          commitMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        this.workflowSuccessMessage.set(data.message || `✓ Workflow '${filePath}' successfully created & committed to ${owner}/${repo} [branch: ${branch}]`);
        
        // Record committed revision into Workflow History
        const newRev = this.workflowHistoryService.addRevision({
          repository: repo,
          branch,
          filePath,
          templateId: this.selectedConfigTemplateId(),
          templateName: this.workflowTemplates.find(t => t.id === this.selectedConfigTemplateId())?.name || 'Custom Workflow',
          commitMessage,
          yamlContent,
          envVars: this.configEnvVars(),
          healthScore: stats.healthScore,
          securityRating: stats.securityRating,
          errorsCount: this.yamlErrors().length,
          warningsCount: this.yamlWarnings().length,
          jobsCount: stats.jobsCount,
          triggers: stats.triggers,
          source: 'committed',
          tag: 'Committed to GitHub'
        });
        this.selectedHistoryRevisionId.set(newRev.id);

        // Also refresh debug files if currently loaded
        if (this.selectedDebugRepo() === repo) {
          this.loadDebugRepoFiles(repo, filePath);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        this.workflowSuccessMessage.set(`⚠ Failed to commit workflow: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.warn('Error generating workflow:', err);
      this.workflowSuccessMessage.set(`⚠ Network error while committing workflow`);
    } finally {
      this.isGeneratingWorkflow.set(false);
    }
  }
}
