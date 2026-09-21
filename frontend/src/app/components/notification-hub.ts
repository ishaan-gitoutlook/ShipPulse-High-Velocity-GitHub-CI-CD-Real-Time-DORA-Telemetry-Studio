import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationIntegrationsService, NotificationChannel, ChatOpsProvider } from '../services/notification-integrations';

@Component({
  selector: 'app-notification-hub',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      
      <!-- Top Banner -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-stone-900">Multi-Channel Alerts & ChatOps Dispatcher</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                SLACK • DISCORD • TEAMS • TELEGRAM
              </span>
            </div>
            <p class="text-xs text-stone-500">Route deployment milestones, failure alerts, and automatic rollbacks directly to engineering channels.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="showAddChannelModal.set(true)"
            class="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Connect Channel
          </button>
        </div>
      </div>

      <!-- Test Dispatch Result Banner (if any) -->
      @if (notifService.lastDispatchResult(); as res) {
        <div class="p-4 bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 text-xs space-y-2 animate-in fade-in">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="font-bold text-white">Live Webhook Dispatched to {{ res.provider | uppercase }}</span>
              <span class="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 font-mono text-[10px] rounded border border-emerald-800">
                HTTP {{ res.httpStatus }} ({{ res.durationMs }}ms)
              </span>
            </div>
            <button 
              type="button"
              (click)="notifService.lastDispatchResult.set(null)"
              class="text-stone-400 hover:text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
            <div class="p-2.5 bg-stone-950 rounded-xl overflow-x-auto max-h-32">
              <span class="text-stone-500 block mb-1">Payload Sent:</span>
              <pre class="text-stone-300">{{ formatJson(res.requestPayload) }}</pre>
            </div>
            <div class="p-2.5 bg-stone-950 rounded-xl overflow-x-auto max-h-32">
              <span class="text-stone-500 block mb-1">Response Body:</span>
              <pre class="text-emerald-400">{{ res.responseBody }}</pre>
            </div>
          </div>
        </div>
      }

      <!-- Connected Channels List -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500">Connected ChatOps Channels ({{ notifService.channels().length }})</h4>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (chan of notifService.channels(); track chan.id) {
            <div 
              [class.opacity-60]="!chan.enabled"
              class="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between space-y-4 hover:border-stone-300 transition-all">
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span 
                      [class.bg-purple-100]="chan.provider === 'slack'"
                      [class.text-purple-800]="chan.provider === 'slack'"
                      [class.bg-indigo-100]="chan.provider === 'discord'"
                      [class.text-indigo-800]="chan.provider === 'discord'"
                      [class.bg-blue-100]="chan.provider === 'msteams'"
                      [class.text-blue-800]="chan.provider === 'msteams'"
                      [class.bg-sky-100]="chan.provider === 'telegram'"
                      [class.text-sky-800]="chan.provider === 'telegram'"
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {{ chan.provider }}
                    </span>
                    <span class="font-bold text-xs text-stone-900 truncate">{{ chan.channelOrRecipient }}</span>
                  </div>

                  <button 
                    type="button"
                    (click)="notifService.toggleChannel(chan.id)"
                    [class.bg-emerald-600]="chan.enabled"
                    [class.bg-stone-300]="!chan.enabled"
                    class="w-8 h-4.5 rounded-full transition-colors relative cursor-pointer">
                    <span 
                      [class.translate-x-3.5]="chan.enabled"
                      [class.translate-x-0.5]="!chan.enabled"
                      class="block w-3.5 h-3.5 rounded-full bg-white transition-transform">
                    </span>
                  </button>
                </div>

                <p class="text-xs font-semibold text-stone-800 mb-1">{{ chan.name }}</p>
                <code class="text-[10px] font-mono text-stone-500 bg-white px-2 py-1 rounded border border-stone-200 block truncate mb-3">
                  {{ chan.webhookUrl }}
                </code>

                <div class="flex flex-wrap gap-1">
                  @for (ev of chan.events; track ev) {
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-stone-200 text-stone-700">
                      {{ ev }}
                    </span>
                  }
                </div>
              </div>

              <!-- Channel Footer Actions -->
              <div class="pt-3 border-t border-stone-200 flex items-center justify-between">
                <button 
                  type="button"
                  (click)="testDispatch(chan)"
                  [disabled]="notifService.isDispatching()"
                  class="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                  <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Test Webhook
                </button>

                <button 
                  type="button"
                  (click)="notifService.deleteChannel(chan.id)"
                  class="text-stone-400 hover:text-rose-600 transition-colors p-1 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

            </div>
          }
        </div>
      </div>

      <!-- Incident Escalation Rules Engine -->
      <div class="space-y-3 pt-4 border-t border-stone-100">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500">Automated Incident Escalation Rules</h4>
            <p class="text-xs text-stone-400">Trigger high-severity PagerDuty / ChatOps escalation when automated thresholds are breached.</p>
          </div>
        </div>

        <div class="space-y-2.5">
          @for (rule of notifService.escalationRules(); track rule.id) {
            <div class="p-3.5 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-4">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span 
                    [class.bg-rose-100]="rule.severity === 'critical'"
                    [class.text-rose-800]="rule.severity === 'critical'"
                    [class.bg-amber-100]="rule.severity === 'high'"
                    [class.text-amber-800]="rule.severity === 'high'"
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                    {{ rule.severity }}
                  </span>
                  <span class="text-xs font-bold text-stone-900">{{ rule.title }}</span>
                </div>
                <p class="text-xs text-stone-600">Condition: <strong class="text-stone-800 font-mono text-[11px]">{{ rule.triggerCondition }}</strong></p>
                <p class="text-[11px] text-stone-400">Action: {{ rule.actionSummary }}</p>
              </div>

              <button 
                type="button"
                (click)="notifService.toggleRule(rule.id)"
                [class.bg-emerald-600]="rule.enabled"
                [class.bg-stone-300]="!rule.enabled"
                class="w-8 h-4.5 rounded-full transition-colors relative cursor-pointer shrink-0">
                <span 
                  [class.translate-x-3.5]="rule.enabled"
                  [class.translate-x-0.5]="!rule.enabled"
                  class="block w-3.5 h-3.5 rounded-full bg-white transition-transform">
                </span>
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Add Channel Modal -->
      @if (showAddChannelModal()) {
        <div class="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            
            <div class="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 class="text-sm font-bold text-stone-900">Connect Webhook / ChatOps Channel</h3>
              <button 
                type="button"
                (click)="showAddChannelModal.set(false)"
                class="text-stone-400 hover:text-stone-700 cursor-pointer">
                ✕
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <span class="block font-bold text-stone-700 mb-1">Provider</span>
                <select 
                  [value]="newProvider()"
                  (change)="newProvider.set($any($event.target).value)"
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold focus:outline-hidden">
                  <option value="slack">Slack Incoming Webhook</option>
                  <option value="discord">Discord Webhook</option>
                  <option value="msteams">Microsoft Teams Connector</option>
                  <option value="telegram">Telegram Bot API</option>
                  <option value="generic">Generic JSON Webhook</option>
                </select>
              </div>

              <div>
                <span class="block font-bold text-stone-700 mb-1">Channel Name / Label</span>
                <input 
                  type="text" 
                  [value]="newName()"
                  (input)="newName.set($any($event.target).value)"
                  placeholder="e.g. #deploy-alerts"
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <span class="block font-bold text-stone-700 mb-1">Webhook URL Endpoint</span>
                <input 
                  type="text" 
                  [value]="newWebhookUrl()"
                  (input)="newWebhookUrl.set($any($event.target).value)"
                  placeholder="https://example.com/api/webhooks/..."
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <span class="block font-bold text-stone-700 mb-1">Target Room / Recipient</span>
                <input 
                  type="text" 
                  [value]="newRecipient()"
                  (input)="newRecipient.set($any($event.target).value)"
                  placeholder="#production-releases"
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button 
                type="button"
                (click)="showAddChannelModal.set(false)"
                class="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                Cancel
              </button>
              <button 
                type="button"
                (click)="saveNewChannel()"
                class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
                Save Channel
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class NotificationHubComponent {
  notifService = inject(NotificationIntegrationsService);

  showAddChannelModal = signal<boolean>(false);
  newProvider = signal<ChatOpsProvider>('slack');
  newName = signal<string>('');
  newWebhookUrl = signal<string>('');
  newRecipient = signal<string>('#deployments');

  testDispatch(channel: NotificationChannel) {
    this.notifService.testDispatch(channel, 'success');
  }

  saveNewChannel() {
    if (!this.newWebhookUrl().trim()) return;
    this.notifService.addChannel({
      name: this.newName().trim() || `${this.newProvider().toUpperCase()} Alerts`,
      provider: this.newProvider(),
      webhookUrl: this.newWebhookUrl().trim(),
      channelOrRecipient: this.newRecipient().trim() || '#alerts',
      events: ['started', 'success', 'failure', 'rollback'],
      enabled: true
    });
    this.showAddChannelModal.set(false);
    this.newWebhookUrl.set('');
    this.newName.set('');
  }

  formatJson(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }
}
