import { Injectable, signal } from '@angular/core';

export type ChatOpsProvider = 'slack' | 'discord' | 'msteams' | 'telegram' | 'generic';

export interface NotificationChannel {
  id: string;
  name: string;
  provider: ChatOpsProvider;
  webhookUrl: string;
  channelOrRecipient: string;
  events: ('started' | 'success' | 'failure' | 'rollback')[];
  enabled: boolean;
  lastDispatchedAt?: string;
  lastStatus?: 'success' | 'failed';
}

export interface EscalationRule {
  id: string;
  title: string;
  triggerCondition: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  enabled: boolean;
  actionSummary: string;
  targetChannelId: string;
  consecutiveFailuresCount: number;
}

export interface DispatchTestResult {
  provider: ChatOpsProvider;
  targetUrl: string;
  httpStatus: number;
  durationMs: number;
  requestPayload: Record<string, unknown>;
  responseBody: string;
  success: boolean;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationIntegrationsService {
  private readonly defaultChannels: NotificationChannel[] = [
    {
      id: 'chan-slack-1',
      name: 'Engineering Deployments (Slack)',
      provider: 'slack',
      webhookUrl: 'https://example.com/api/webhooks/slack/engineering-releases',
      channelOrRecipient: '#production-releases',
      events: ['started', 'success', 'failure', 'rollback'],
      enabled: true,
      lastDispatchedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      lastStatus: 'success'
    },
    {
      id: 'chan-discord-1',
      name: 'DevOps Alerts (Discord)',
      provider: 'discord',
      webhookUrl: 'https://example.com/api/webhooks/discord/ci-cd-feed',
      channelOrRecipient: '#ci-cd-feed',
      events: ['failure', 'rollback'],
      enabled: true,
      lastDispatchedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      lastStatus: 'success'
    },
    {
      id: 'chan-telegram-1',
      name: 'On-Call Telegram Bot',
      provider: 'telegram',
      webhookUrl: 'https://example.com/api/webhooks/telegram/devops-bot',
      channelOrRecipient: '@devops_oncall_group',
      events: ['failure', 'rollback'],
      enabled: false
    }
  ];

  private readonly defaultEscalationRules: EscalationRule[] = [
    {
      id: 'rule-esc-1',
      title: 'Repeated Production Failure Alert',
      triggerCondition: '>= 2 consecutive deployment failures on "main" branch',
      severity: 'critical',
      enabled: true,
      actionSummary: 'Dispatches high-priority alert to #production-releases with automatic rollback prompt.',
      targetChannelId: 'chan-slack-1',
      consecutiveFailuresCount: 2
    },
    {
      id: 'rule-esc-2',
      title: 'Runaway Build Duration Ceiling',
      triggerCondition: 'Workflow execution time exceeds 15 minutes',
      severity: 'high',
      enabled: true,
      actionSummary: 'Sends performance warning and cancels hanging runner job.',
      targetChannelId: 'chan-slack-1',
      consecutiveFailuresCount: 1
    },
    {
      id: 'rule-esc-3',
      title: 'Plaintext Secret Leak Detected',
      triggerCondition: 'Security scanner detects unmasked API token or private key in commit YAML',
      severity: 'critical',
      enabled: true,
      actionSummary: 'Blocks runner build and immediately notifies security on-call.',
      targetChannelId: 'chan-discord-1',
      consecutiveFailuresCount: 1
    }
  ];

  channels = signal<NotificationChannel[]>(this.loadChannels());
  escalationRules = signal<EscalationRule[]>(this.loadRules());
  lastDispatchResult = signal<DispatchTestResult | null>(null);
  isDispatching = signal<boolean>(false);

  // Generate customized JSON payload for given provider & event
  generatePayload(provider: ChatOpsProvider, eventType: 'started' | 'success' | 'failure' | 'rollback', details: { repo: string; branch: string; commit: string; author: string; duration?: string }): Record<string, unknown> {
    const statusColors = {
      started: '#3B82F6',
      success: '#10B981',
      failure: '#EF4444',
      rollback: '#F59E0B'
    };

    const statusTitles = {
      started: '🚀 Deployment Triggered',
      success: '✅ Deployment Succeeded',
      failure: '❌ Deployment Failed',
      rollback: '⚠️ Auto-Rollback Executed'
    };

    if (provider === 'slack') {
      return {
        text: `${statusTitles[eventType]}: *${details.repo}* (${details.branch})`,
        attachments: [
          {
            color: statusColors[eventType],
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Repository:* \`${details.repo}\`\n*Branch:* \`${details.branch}\`\n*Commit:* \`${details.commit}\` by *${details.author}*`
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `*ShipPulse v2.0* • Status: *${eventType.toUpperCase()}* • Time: <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toLocaleTimeString()}>`
                  }
                ]
              }
            ]
          }
        ]
      };
    }

    if (provider === 'discord') {
      return {
        username: 'ShipPulse CI/CD',
        avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        embeds: [
          {
            title: statusTitles[eventType],
            description: `Pipeline event for repository **${details.repo}** on branch \`${details.branch}\`.`,
            color: parseInt(statusColors[eventType].replace('#', ''), 16),
            fields: [
              { name: 'Commit', value: `\`${details.commit}\``, inline: true },
              { name: 'Author', value: details.author, inline: true },
              { name: 'Status', value: eventType.toUpperCase(), inline: true }
            ],
            footer: {
              text: 'ShipPulse Automated Webhook Notification'
            },
            timestamp: new Date().toISOString()
          }
        ]
      };
    }

    if (provider === 'msteams') {
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: statusColors[eventType].replace('#', ''),
        summary: `${statusTitles[eventType]} - ${details.repo}`,
        sections: [
          {
            activityTitle: statusTitles[eventType],
            activitySubtitle: `${details.repo} (${details.branch})`,
            facts: [
              { name: 'Commit', value: details.commit },
              { name: 'Author', value: details.author },
              { name: 'Outcome', value: eventType.toUpperCase() }
            ],
            markdown: true
          }
        ]
      };
    }

    if (provider === 'telegram') {
      return {
        chat_id: '@devops_alerts',
        parse_mode: 'MarkdownV2',
        text: `*${statusTitles[eventType]}*\nRepo: \`${details.repo}\`\nBranch: \`${details.branch}\`\nCommit: \`${details.commit}\`\nAuthor: *${details.author}*`
      };
    }

    // Generic Webhook JSON
    return {
      event: `deployment.${eventType}`,
      repository: details.repo,
      branch: details.branch,
      commit_sha: details.commit,
      author: details.author,
      timestamp: new Date().toISOString(),
      hub_version: '2.0.0'
    };
  }

  // Simulate or execute live dispatch test
  testDispatch(channel: NotificationChannel, eventType: 'started' | 'success' | 'failure' | 'rollback' = 'success') {
    this.isDispatching.set(true);

    const payload = this.generatePayload(channel.provider, eventType, {
      repo: 'auto-deploy-hub',
      branch: 'main',
      commit: '8f1e29c',
      author: 'alphalegion09',
      duration: '42s'
    });

    // Simulate realistic webhook HTTP call
    setTimeout(() => {
      this.isDispatching.set(false);

      const result: DispatchTestResult = {
        provider: channel.provider,
        targetUrl: channel.webhookUrl,
        httpStatus: 200,
        durationMs: 148,
        requestPayload: payload,
        responseBody: '{"ok": true, "message_id": "msg_01jh82390a"}',
        success: true,
        timestamp: new Date().toISOString()
      };

      this.lastDispatchResult.set(result);

      // Update channel last status
      const updated = this.channels().map(c => {
        if (c.id === channel.id) {
          return { ...c, lastDispatchedAt: new Date().toISOString(), lastStatus: 'success' as const };
        }
        return c;
      });
      this.channels.set(updated);
      this.persistChannels(updated);
    }, 450);
  }

  addChannel(channel: Omit<NotificationChannel, 'id'>) {
    const newChan: NotificationChannel = {
      ...channel,
      id: 'chan-' + Date.now().toString(36)
    };
    const updated = [...this.channels(), newChan];
    this.channels.set(updated);
    this.persistChannels(updated);
  }

  toggleChannel(id: string) {
    const updated = this.channels().map(c => c.id === id ? { ...c, enabled: !c.enabled } : c);
    this.channels.set(updated);
    this.persistChannels(updated);
  }

  deleteChannel(id: string) {
    const updated = this.channels().filter(c => c.id !== id);
    this.channels.set(updated);
    this.persistChannels(updated);
  }

  toggleRule(id: string) {
    const updated = this.escalationRules().map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    this.escalationRules.set(updated);
    this.persistRules(updated);
  }

  private loadChannels(): NotificationChannel[] {
    if (typeof window === 'undefined') return this.defaultChannels;
    try {
      const stored = localStorage.getItem('shippulse_notification_channels_v1') || localStorage.getItem('autodeploy_notification_channels_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse channels from localStorage:', e);
    }
    return this.defaultChannels;
  }

  private persistChannels(channels: NotificationChannel[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('shippulse_notification_channels_v1', JSON.stringify(channels));
    } catch (e) {
      console.warn('Failed to persist channels:', e);
    }
  }

  private loadRules(): EscalationRule[] {
    if (typeof window === 'undefined') return this.defaultEscalationRules;
    try {
      const stored = localStorage.getItem('shippulse_escalation_rules_v1') || localStorage.getItem('autodeploy_escalation_rules_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse escalation rules from localStorage:', e);
    }
    return this.defaultEscalationRules;
  }

  private persistRules(rules: EscalationRule[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('shippulse_escalation_rules_v1', JSON.stringify(rules));
    } catch (e) {
      console.warn('Failed to persist rules:', e);
    }
  }
}
