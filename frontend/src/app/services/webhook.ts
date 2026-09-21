import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface WebhookEventRecord {
  id: string;
  event: string;
  repoFullName: string;
  branch: string;
  sender: string;
  commitSha: string;
  commitMessage: string;
  timestamp: string;
  actionTaken: string;
  pipelineTriggered?: string;
  payloadSnippet: string;
}

export interface WebhookTriggerResult {
  success: boolean;
  message: string;
  event: string;
  deliveryId: string;
  timestamp: string;
  triggeredDeployment: {
    pipelineId: string;
    repoFullName: string;
    branch: string;
    status: 'Building' | 'Active';
    commit: {
      sha: string;
      message: string;
      author: string;
    };
    liveUrl: string;
    logs: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class WebhookService {
  private platformId = inject(PLATFORM_ID);

  webhookSecret = signal<string>('mock_webhook_secret_key');
  isTestingWebhook = signal<boolean>(false);
  lastTriggerResult = signal<WebhookTriggerResult | null>(null);
  webhookHistory = signal<WebhookEventRecord[]>([]);
  activeBranchFilter = signal<string>('main');

  webhookUrl = computed(() => {
    if (isPlatformBrowser(this.platformId)) {
      return `${window.location.origin}/api/github/webhook`;
    }
    return 'https://api.shippulse.io/api/github/webhook';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedSecret = localStorage.getItem('shippulse_webhook_secret') || localStorage.getItem('autodeploy_webhook_secret');
      if (savedSecret) {
        this.webhookSecret.set(savedSecret);
      }
      this.refreshHistory();
    }
  }

  setWebhookSecret(secret: string) {
    this.webhookSecret.set(secret);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('shippulse_webhook_secret', secret);
    }
  }

  generateRandomSecret(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = 'whsec_';
    for (let i = 0; i < 24; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.setWebhookSecret(res);
    return res;
  }

  private resolveUrl(path: string): string {
    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' && !window.location.origin.includes('://null')) {
      return `${window.location.origin}${path.startsWith('/') ? path : '/' + path}`;
    }
    return `http://localhost:3000${path.startsWith('/') ? path : '/' + path}`;
  }

  async refreshHistory() {
    try {
      const res = await fetch(this.resolveUrl('/api/github/webhooks/history'));
      if (res.ok) {
        const data = await res.json();
        if (data.events) {
          this.webhookHistory.set(data.events);
        }
      }
    } catch (e: unknown) {
      const err = e as { message?: string; cause?: { code?: string } };
      const isConnRefused = err?.cause?.code === 'ECONNREFUSED' || String(err?.message || e).includes('ECONNREFUSED');
      if (!isConnRefused) {
        console.warn('Could not fetch webhook history:', e);
      }
    }
  }

  async fetchWebhookHistory() {
    return this.refreshHistory();
  }

  /**
   * Dispatches a simulated GitHub push event to test auto-deployment pipeline triggering
   */
  async simulatePushEvent(
    repoOrParams: string | { repoFullName: string; branch: string; author: string; message: string },
    branchArg?: string,
    authorArg?: string,
    messageArg?: string
  ): Promise<WebhookTriggerResult | null> {
    this.isTestingWebhook.set(true);
    const params = typeof repoOrParams === 'string'
      ? { repoFullName: repoOrParams, branch: branchArg || 'main', author: authorArg || 'developer', message: messageArg || 'Automated commit' }
      : repoOrParams;

    try {
      const res = await fetch(this.resolveUrl('/api/github/webhook/test'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'push'
        },
        body: JSON.stringify(params)
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json() as WebhookTriggerResult;
      this.lastTriggerResult.set(data);
      await this.refreshHistory();
      return data;
    } catch (err) {
      console.error('Error simulating push webhook:', err);
      return null;
    } finally {
      this.isTestingWebhook.set(false);
    }
  }
}
