import { Injectable, signal, computed } from '@angular/core';

export type SubscriptionPlanId = 'free' | 'pro' | 'team' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceUsd: number;
  annualPriceUsd: number; // monthly equivalent when billed annually
  features: PlanFeature[];
  limits: {
    maxRepos: number; // -1 for unlimited
    maxTeamSeats: number;
    maxSimulationsPerMonth: number;
    chatOpsChannels: number;
    auditLogDays: number;
    hasAiOptimizer: boolean;
    hasSlsaCompliance: boolean;
    hasMultiCloudExporters: boolean;
    hasDoraFleet: boolean;
    hasCustomChaos: boolean;
    hasPrioritySupport: boolean;
    hasSsoSaml: boolean;
  };
  ctaText: string;
  isPopular?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amountUsd: number;
  planName: string;
  billingCycle: BillingCycle;
  status: 'paid' | 'pending' | 'refunded';
  pdfDownloadUrl?: string;
}

export interface PaymentMethod {
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BillingSubscriptionService {
  readonly plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Starter',
      description: 'Ideal for solo developers and open-source hobbyists automating personal projects.',
      monthlyPriceUsd: 0,
      annualPriceUsd: 0,
      ctaText: 'Current Plan',
      features: [
        { name: 'Up to 3 GitHub Repositories', included: true },
        { name: 'Workflow Studio & YAML Editor', included: true },
        { name: 'Basic Syntax & Linter Validator', included: true },
        { name: 'Standard CI/CD Community Templates', included: true },
        { name: 'Single Seat Workspace', included: true },
        { name: 'AI Workflow Optimizer & Cost Forecaster', included: false },
        { name: 'SLSA Level 1-3 Security & Secret Scanner', included: false },
        { name: 'Multi-Cloud & Container Exporters', included: false },
        { name: 'Multi-Channel ChatOps (Slack/Teams)', included: false },
        { name: 'DORA Fleet Health Matrix', included: false }
      ],
      limits: {
        maxRepos: 3,
        maxTeamSeats: 1,
        maxSimulationsPerMonth: 50,
        chatOpsChannels: 0,
        auditLogDays: 7,
        hasAiOptimizer: false,
        hasSlsaCompliance: false,
        hasMultiCloudExporters: false,
        hasDoraFleet: false,
        hasCustomChaos: false,
        hasPrioritySupport: false,
        hasSsoSaml: false
      }
    },
    {
      id: 'pro',
      name: 'Pro Developer',
      badge: 'MOST POPULAR',
      isPopular: true,
      description: 'Power tools for professional engineers and fast-moving indie developers.',
      monthlyPriceUsd: 19,
      annualPriceUsd: 15,
      ctaText: 'Upgrade to Pro',
      features: [
        { name: 'Unlimited Connected Repositories', included: true },
        { name: 'AI Workflow Optimizer & Cost Forecaster', included: true },
        { name: 'SLSA Level 1-3 Security & Secret Scanner', included: true },
        { name: '1-Click Action Commit SHA Pinning', included: true },
        { name: 'Multi-Cloud Exporters (GCP, AWS, Vercel, GHCR)', included: true },
        { name: 'ChatOps Alerts (Slack, Discord, Teams, Telegram)', included: true },
        { name: 'CI/CD Virtual Runner & 6 Chaos Scenarios', included: true },
        { name: 'Up to 3 Team Seats', included: true },
        { name: '30-Day Audit Log Trail', included: true },
        { name: 'Email Support (24h response)', included: true }
      ],
      limits: {
        maxRepos: -1,
        maxTeamSeats: 3,
        maxSimulationsPerMonth: 1000,
        chatOpsChannels: 5,
        auditLogDays: 30,
        hasAiOptimizer: true,
        hasSlsaCompliance: true,
        hasMultiCloudExporters: true,
        hasDoraFleet: true,
        hasCustomChaos: true,
        hasPrioritySupport: false,
        hasSsoSaml: false
      }
    },
    {
      id: 'team',
      name: 'Team / Growth',
      badge: 'BEST VALUE',
      description: 'For growing engineering organizations requiring cross-repo governance and DORA analytics.',
      monthlyPriceUsd: 79,
      annualPriceUsd: 64,
      ctaText: 'Upgrade to Team',
      features: [
        { name: 'Everything in Pro Plan', included: true },
        { name: 'Cross-Repository DORA Fleet Health Matrix', included: true },
        { name: 'Automated Incident Escalation Rules', included: true },
        { name: 'Up to 15 Team Members with RBAC Roles', included: true },
        { name: 'Personal Access Tokens & CI API Keys', included: true },
        { name: '90-Day SOC2 Audit Trail Logs', included: true },
        { name: 'Custom Multi-Tier Caching Rules', included: true },
        { name: 'Priority Support & Slack On-Call', included: true }
      ],
      limits: {
        maxRepos: -1,
        maxTeamSeats: 15,
        maxSimulationsPerMonth: 10000,
        chatOpsChannels: 25,
        auditLogDays: 90,
        hasAiOptimizer: true,
        hasSlsaCompliance: true,
        hasMultiCloudExporters: true,
        hasDoraFleet: true,
        hasCustomChaos: true,
        hasPrioritySupport: true,
        hasSsoSaml: false
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Dedicated infrastructure, custom SLA, self-hosted deployment, and SSO/SAML governance.',
      monthlyPriceUsd: 299,
      annualPriceUsd: 249,
      ctaText: 'Contact Enterprise',
      features: [
        { name: 'Everything in Team Plan', included: true },
        { name: 'Self-Hosted / On-Premise Air-Gapped License', included: true },
        { name: 'Unlimited Team Seats & Unlimited Workspaces', included: true },
        { name: 'SAML 2.0 / Okta / Azure AD Single Sign-On', included: true },
        { name: 'Unlimited Audit Log Retention & Compliance Export', included: true },
        { name: 'Custom Cloud Provider Integrations', included: true },
        { name: '99.99% Uptime SLA & Dedicated Account Manager', included: true }
      ],
      limits: {
        maxRepos: -1,
        maxTeamSeats: 9999,
        maxSimulationsPerMonth: 999999,
        chatOpsChannels: 999,
        auditLogDays: 365,
        hasAiOptimizer: true,
        hasSlsaCompliance: true,
        hasMultiCloudExporters: true,
        hasDoraFleet: true,
        hasCustomChaos: true,
        hasPrioritySupport: true,
        hasSsoSaml: true
      }
    }
  ];

  // Active Subscription State
  currentPlanId = signal<SubscriptionPlanId>(this.loadPlanId());
  billingCycle = signal<BillingCycle>('annual');
  subscriptionStatus = signal<'active' | 'trialing' | 'past_due' | 'canceled'>('active');
  nextRenewalDate = signal<string>(this.calculateRenewalDate());
  licenseKey = signal<string | null>(this.loadLicenseKey());

  // Customer Payment & Invoices
  paymentMethod = signal<PaymentMethod>({
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2028,
    isDefault: true
  });

  invoices = signal<Invoice[]>([
    {
      id: 'inv_10928301',
      invoiceNumber: 'INV-2026-0042',
      date: 'Aug 01, 2026',
      amountUsd: 180,
      planName: 'Pro Developer (Annual)',
      billingCycle: 'annual',
      status: 'paid'
    },
    {
      id: 'inv_10827394',
      invoiceNumber: 'INV-2025-0018',
      date: 'Aug 01, 2025',
      amountUsd: 180,
      planName: 'Pro Developer (Annual)',
      billingCycle: 'annual',
      status: 'paid'
    }
  ]);

  // Computed Entitlements
  currentPlan = computed(() => {
    return this.plans.find(p => p.id === this.currentPlanId()) || this.plans[0];
  });

  isPro = computed(() => {
    return this.currentPlanId() !== 'free';
  });

  isTeamOrAbove = computed(() => {
    return this.currentPlanId() === 'team' || this.currentPlanId() === 'enterprise';
  });

  isEnterprise = computed(() => {
    return this.currentPlanId() === 'enterprise';
  });

  // Feature Access Guards
  canAccessAiOptimizer = computed(() => this.currentPlan().limits.hasAiOptimizer);
  canAccessSecurityCompliance = computed(() => this.currentPlan().limits.hasSlsaCompliance);
  canAccessMultiCloud = computed(() => this.currentPlan().limits.hasMultiCloudExporters);
  canAccessDora = computed(() => this.currentPlan().limits.hasDoraFleet);
  canAccessChatOps = computed(() => this.currentPlan().limits.chatOpsChannels > 0);

  // Upgrade or Switch Plan
  upgradePlan(planId: SubscriptionPlanId, cycle: BillingCycle = 'annual', paymentDetails?: { last4: string; brand: 'visa' | 'mastercard' | 'amex' }) {
    this.currentPlanId.set(planId);
    this.billingCycle.set(cycle);
    this.subscriptionStatus.set('active');
    this.nextRenewalDate.set(this.calculateRenewalDate());

    if (paymentDetails) {
      this.paymentMethod.set({
        brand: paymentDetails.brand,
        last4: paymentDetails.last4,
        expMonth: 11,
        expYear: 2029,
        isDefault: true
      });
    }

    // Add generated invoice record
    const targetPlan = this.plans.find(p => p.id === planId);
    if (targetPlan && targetPlan.monthlyPriceUsd > 0) {
      const amount = cycle === 'annual' ? targetPlan.annualPriceUsd * 12 : targetPlan.monthlyPriceUsd;
      const newInvoice: Invoice = {
        id: 'inv_' + Date.now().toString(36),
        invoiceNumber: 'INV-2026-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amountUsd: amount,
        planName: `${targetPlan.name} (${cycle === 'annual' ? 'Annual' : 'Monthly'})`,
        billingCycle: cycle,
        status: 'paid'
      };
      this.invoices.set([newInvoice, ...this.invoices()]);
    }

    this.persistPlanId(planId);
  }

  // Activate Self-Hosted / Enterprise License Key
  activateLicenseKey(rawKey: string): { success: boolean; message: string } {
    const key = rawKey.trim().toUpperCase();

    if (key.startsWith('SP-ENT-') || key.startsWith('ADH-ENT-') || key.includes('ENT')) {
      this.licenseKey.set(key);
      this.currentPlanId.set('enterprise');
      this.persistLicenseKey(key);
      this.persistPlanId('enterprise');
      return { success: true, message: 'Successfully activated ShipPulse Enterprise Edition license!' };
    }

    if (key.startsWith('SP-PRO-') || key.startsWith('ADH-PRO-') || key.includes('PRO')) {
      this.licenseKey.set(key);
      this.currentPlanId.set('pro');
      this.persistLicenseKey(key);
      this.persistPlanId('pro');
      return { success: true, message: 'Successfully activated ShipPulse Pro Developer license!' };
    }

    return { success: false, message: 'Invalid or expired license key. Please check your activation key format (e.g. SP-PRO-XXXX-XXXX).' };
  }

  // Validate Promo / Coupon Code
  applyCouponCode(code: string): { valid: boolean; discountPercent: number; message: string } {
    const clean = code.trim().toUpperCase();
    if (clean === 'SHIP20' || clean === 'LAUNCH20') {
      return { valid: true, discountPercent: 20, message: 'Coupon SHIP20 applied! 20% off all plans.' };
    }
    if (clean === 'DEV50' || clean === 'STARTUP50') {
      return { valid: true, discountPercent: 50, message: 'Founder discount applied! 50% off first 12 months.' };
    }
    return { valid: false, discountPercent: 0, message: 'Invalid promo code. Try SHIP20 or DEV50.' };
  }

  cancelSubscription() {
    this.subscriptionStatus.set('canceled');
  }

  private calculateRenewalDate(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  private loadPlanId(): SubscriptionPlanId {
    if (typeof window === 'undefined') return 'pro';
    try {
      const stored = (localStorage.getItem('shippulse_plan_id_v1') || localStorage.getItem('autodeploy_plan_id_v1')) as SubscriptionPlanId;
      if (stored && ['free', 'pro', 'team', 'enterprise'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Failed to load plan from localStorage:', e);
    }
    return 'pro'; // default to pro for rich developer experience
  }

  private persistPlanId(planId: SubscriptionPlanId) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('shippulse_plan_id_v1', planId);
    } catch (e) {
      console.warn('Failed to persist plan to localStorage:', e);
    }
  }

  private loadLicenseKey(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('shippulse_license_key_v1') || localStorage.getItem('autodeploy_license_key_v1');
    } catch {
      return null;
    }
  }

  private persistLicenseKey(key: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('shippulse_license_key_v1', key);
    } catch (e) {
      console.warn('Failed to persist license key:', e);
    }
  }
}
