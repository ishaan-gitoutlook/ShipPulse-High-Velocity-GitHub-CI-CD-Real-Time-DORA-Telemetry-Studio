import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationTeamService, TeamRole } from '../services/organization-team';
import { BillingSubscriptionService } from '../services/billing-subscription';

@Component({
  selector: 'app-team-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner -->
      <div class="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-stone-900">Organization & Team Governance</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                ROLE-BASED ACCESS (RBAC)
              </span>
            </div>
            <p class="text-xs text-stone-500">Manage workspace members, assign RBAC permissions, generate API keys, and review SOC2 audit logs.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="showInviteModal.set(true)"
            class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Invite Team Member
          </button>
        </div>
      </div>

      <!-- Navigation Subtabs: Members | API Tokens | Audit Logs -->
      <div class="flex items-center gap-2 border-b border-stone-200 pb-3 text-xs font-bold">
        <button 
          type="button"
          (click)="activeSubTab.set('members')"
          [class.bg-stone-900]="activeSubTab() === 'members'"
          [class.text-white]="activeSubTab() === 'members'"
          [class.bg-stone-100]="activeSubTab() !== 'members'"
          [class.text-stone-700]="activeSubTab() !== 'members'"
          class="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
          Team Members ({{ teamService.members().length }})
        </button>
        <button 
          type="button"
          (click)="activeSubTab.set('tokens')"
          [class.bg-stone-900]="activeSubTab() === 'tokens'"
          [class.text-white]="activeSubTab() === 'tokens'"
          [class.bg-stone-100]="activeSubTab() !== 'tokens'"
          [class.text-stone-700]="activeSubTab() !== 'tokens'"
          class="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
          CI/CD API Tokens ({{ teamService.apiTokens().length }})
        </button>
        <button 
          type="button"
          (click)="activeSubTab.set('audit')"
          [class.bg-stone-900]="activeSubTab() === 'audit'"
          [class.text-white]="activeSubTab() === 'audit'"
          [class.bg-stone-100]="activeSubTab() !== 'audit'"
          [class.text-stone-700]="activeSubTab() !== 'audit'"
          class="px-3.5 py-1.5 rounded-xl transition-all cursor-pointer">
          SOC2 Audit Trail ({{ teamService.auditLogs().length }})
        </button>
      </div>

      <!-- VIEW 1: TEAM MEMBERS -->
      @if (activeSubTab() === 'members') {
        <div class="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm animate-in fade-in">
          <div class="p-5 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-stone-900">Workspace Members & Permissions</h3>
              <p class="text-xs text-stone-500">Seats Used: <strong>{{ teamService.members().length }}</strong> / {{ billingService.currentPlan().limits.maxTeamSeats === 9999 ? 'Unlimited' : billingService.currentPlan().limits.maxTeamSeats }}</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-stone-50/75 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                  <th class="py-3 px-4 font-semibold">User</th>
                  <th class="py-3 px-4 font-semibold">Role</th>
                  <th class="py-3 px-4 font-semibold">Status</th>
                  <th class="py-3 px-4 font-semibold">Joined Date</th>
                  <th class="py-3 px-4 font-semibold">Last Active</th>
                  <th class="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                @for (mem of teamService.members(); track mem.id) {
                  <tr class="hover:bg-stone-50/60 transition-colors">
                    
                    <!-- User Avatar & Info -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-3">
                        <img [src]="mem.avatarUrl" [alt]="mem.name + ' avatar'" class="w-8 h-8 rounded-full border border-stone-200 object-cover" />
                        <div>
                          <p class="font-bold text-stone-900">{{ mem.name }}</p>
                          <p class="text-[11px] text-stone-500 font-mono">{{ mem.email }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Role Badge -->
                    <td class="py-3.5 px-4">
                      <span 
                        [class.bg-purple-100]="mem.role === 'owner'"
                        [class.text-purple-800]="mem.role === 'owner'"
                        [class.bg-blue-100]="mem.role === 'admin'"
                        [class.text-blue-800]="mem.role === 'admin'"
                        [class.bg-emerald-100]="mem.role === 'devops'"
                        [class.text-emerald-800]="mem.role === 'devops'"
                        [class.bg-stone-100]="mem.role === 'viewer'"
                        [class.text-stone-700]="mem.role === 'viewer'"
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {{ mem.role }}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="py-3.5 px-4">
                      <span 
                        [class.bg-emerald-100]="mem.status === 'active'"
                        [class.text-emerald-800]="mem.status === 'active'"
                        [class.bg-amber-100]="mem.status === 'invited'"
                        [class.text-amber-800]="mem.status === 'invited'"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {{ mem.status }}
                      </span>
                    </td>

                    <td class="py-3.5 px-4 text-stone-600">{{ mem.joinedAt }}</td>
                    <td class="py-3.5 px-4 text-stone-500 font-mono text-[11px]">{{ mem.lastActive }}</td>

                    <td class="py-3.5 px-4 text-right">
                      @if (mem.role !== 'owner') {
                        <button 
                          type="button"
                          (click)="teamService.removeMember(mem.id)"
                          class="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer">
                          Revoke
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- VIEW 2: API ACCESS TOKENS -->
      @if (activeSubTab() === 'tokens') {
        <div class="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm p-6 space-y-6 animate-in fade-in">
          <div class="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 class="text-sm font-bold text-stone-900">Personal Access Tokens (PATs) & Webhook Secrets</h3>
              <p class="text-xs text-stone-500">Authenticate GitHub Actions runners, CLI tools, and automated deployment bots.</p>
            </div>
            <button 
              type="button"
              (click)="showTokenModal.set(true)"
              class="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer">
              Generate New Token
            </button>
          </div>

          <div class="space-y-3">
            @for (tok of teamService.apiTokens(); track tok.id) {
              <div class="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-xs text-stone-900">{{ tok.name }}</span>
                    <span class="text-[10px] font-mono bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded font-semibold">Created by {{ tok.creatorName }}</span>
                  </div>
                  <code class="text-xs font-mono font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-200 block w-fit">
                    {{ tok.tokenPrefix }}
                  </code>
                  <div class="flex flex-wrap gap-1 pt-1">
                    @for (sc of tok.scopes; track sc) {
                      <span class="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-mono text-[9px] rounded font-semibold border border-indigo-200/60">
                        {{ sc }}
                      </span>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right text-[11px] font-mono text-stone-400">
                    <span>Last used: {{ tok.lastUsedAt || 'Never' }}</span>
                  </div>
                  <button 
                    type="button"
                    (click)="teamService.revokeToken(tok.id)"
                    class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- VIEW 3: SOC2 AUDIT TRAIL -->
      @if (activeSubTab() === 'audit') {
        <div class="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm animate-in fade-in">
          <div class="p-5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-sm font-bold text-stone-900">SOC2 & ISO-27001 Security Audit Log</h3>
              <p class="text-xs text-stone-500">Immutable chronological audit trail recording deployment rollbacks, secret modifications, and access events.</p>
            </div>
            <button 
              type="button"
              (click)="exportAuditCsv()"
              class="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-stone-50/75 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                  <th class="py-3 px-4 font-semibold">Timestamp</th>
                  <th class="py-3 px-4 font-semibold">Actor</th>
                  <th class="py-3 px-4 font-semibold">Action / Event</th>
                  <th class="py-3 px-4 font-semibold">Target Resource</th>
                  <th class="py-3 px-4 font-semibold">IP Address</th>
                  <th class="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                @for (log of teamService.auditLogs(); track log.id) {
                  <tr class="hover:bg-stone-50/60 transition-colors">
                    <td class="py-3.5 px-4 font-mono text-stone-400 whitespace-nowrap">{{ log.timestamp }}</td>
                    
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-2">
                        <img [src]="log.actor.avatarUrl" [alt]="log.actor.name + ' avatar'" class="w-5 h-5 rounded-full object-cover" />
                        <span class="font-bold text-stone-900">{{ log.actor.name }}</span>
                      </div>
                    </td>

                    <td class="py-3.5 px-4">
                      <code class="font-mono font-bold text-[11px] text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">
                        {{ log.action }}
                      </code>
                      <p class="text-[10px] text-stone-500 mt-0.5">{{ log.details }}</p>
                    </td>

                    <td class="py-3.5 px-4 font-mono text-[11px] text-stone-700">{{ log.targetResource }}</td>
                    <td class="py-3.5 px-4 font-mono text-[11px] text-stone-400">{{ log.ipAddress }}</td>

                    <td class="py-3.5 px-4">
                      <span 
                        [class.bg-emerald-100]="log.status === 'success'"
                        [class.text-emerald-800]="log.status === 'success'"
                        [class.bg-amber-100]="log.status === 'warning'"
                        [class.text-amber-800]="log.status === 'warning'"
                        [class.bg-rose-100]="log.status === 'critical'"
                        [class.text-rose-800]="log.status === 'critical'"
                        class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
                        {{ log.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- INVITE MEMBER MODAL -->
      @if (showInviteModal()) {
        <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 class="text-sm font-bold text-stone-900">Invite Team Member</h3>
              <button (click)="showInviteModal.set(false)" class="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label for="invite-name-input" class="block font-bold text-stone-700 mb-1">Full Name</label>
                <input 
                  id="invite-name-input"
                  type="text" 
                  [value]="inviteName()" 
                  (input)="inviteName.set($any($event.target).value)" 
                  placeholder="e.g. Sarah Connor" 
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label for="invite-email-input" class="block font-bold text-stone-700 mb-1">Work Email</label>
                <input 
                  id="invite-email-input"
                  type="email" 
                  [value]="inviteEmail()" 
                  (input)="inviteEmail.set($any($event.target).value)" 
                  placeholder="sarah@company.com" 
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label for="invite-role-select" class="block font-bold text-stone-700 mb-1">RBAC Role</label>
                <select 
                  id="invite-role-select"
                  [value]="inviteRole()" 
                  (change)="inviteRole.set($any($event.target).value)"
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold focus:outline-hidden">
                  <option value="admin">Admin (Full workflow & team access)</option>
                  <option value="devops">DevOps Engineer (Deploy & edit workflows)</option>
                  <option value="viewer">Viewer (Read-only logs & metrics)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button 
                type="button" 
                (click)="showInviteModal.set(false)" 
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Cancel
              </button>
              <button 
                type="button" 
                (click)="sendInvitation()" 
                class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      }

      <!-- GENERATE TOKEN MODAL -->
      @if (showTokenModal()) {
        <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 class="text-sm font-bold text-stone-900">Generate Personal Access Token (PAT)</h3>
              <button (click)="showTokenModal.set(false)" class="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label for="token-name-input" class="block font-bold text-stone-700 mb-1">Token Name / Service</label>
                <input 
                  id="token-name-input"
                  type="text" 
                  [value]="newTokenName()" 
                  (input)="newTokenName.set($any($event.target).value)" 
                  placeholder="e.g. Jenkins Runner Token" 
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-hidden"
                />
              </div>

              <div>
                <span class="block font-bold text-stone-700 mb-1.5">Authorized Scopes</span>
                <div class="space-y-1.5 font-mono text-[11px]">
                  <label class="flex items-center gap-2">
                    <input type="checkbox" checked class="accent-stone-900" />
                    <span>repo:read (Read repository metadata)</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="checkbox" checked class="accent-stone-900" />
                    <span>workflow:write (Commit workflow YAMLs)</span>
                  </label>
                  <label class="flex items-center gap-2">
                    <input type="checkbox" checked class="accent-stone-900" />
                    <span>deploy:trigger (Trigger pipeline executions)</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button (click)="showTokenModal.set(false)" class="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold">Cancel</button>
              <button (click)="createToken()" class="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs">Generate Token</button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class TeamManagementComponent {
  teamService = inject(OrganizationTeamService);
  billingService = inject(BillingSubscriptionService);

  activeSubTab = signal<'members' | 'tokens' | 'audit'>('members');

  showInviteModal = signal<boolean>(false);
  inviteName = signal<string>('');
  inviteEmail = signal<string>('');
  inviteRole = signal<TeamRole>('devops');

  showTokenModal = signal<boolean>(false);
  newTokenName = signal<string>('CLI Deployment Agent');

  sendInvitation() {
    if (!this.inviteEmail().trim()) return;
    this.teamService.inviteMember(
      this.inviteName().trim() || 'New Engineer',
      this.inviteEmail().trim(),
      this.inviteRole()
    );
    this.showInviteModal.set(false);
    this.inviteName.set('');
    this.inviteEmail.set('');
  }

  createToken() {
    this.teamService.generateApiToken(
      this.newTokenName().trim() || 'Custom Access Token',
      ['repo:read', 'workflow:write', 'deploy:trigger']
    );
    this.showTokenModal.set(false);
    this.newTokenName.set('');
  }

  exportAuditCsv() {
    const header = 'Timestamp,Actor,Email,Action,TargetResource,IPAddress,Status\n';
    const rows = this.teamService.auditLogs().map(l => 
      `"${l.timestamp}","${l.actor.name}","${l.actor.email}","${l.action}","${l.targetResource}","${l.ipAddress}","${l.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
