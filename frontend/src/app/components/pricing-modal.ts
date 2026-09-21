import { Component, ChangeDetectionStrategy, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingSubscriptionService, SubscriptionPlanId, BillingCycle } from '../services/billing-subscription';

@Component({
  selector: 'app-pricing-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in">
      <div class="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8">
        
        <!-- Header -->
        <div class="p-6 md:p-8 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-stone-800">
          <div>
            <div class="flex items-center gap-2.5 mb-1.5">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PLANS & PRICING
              </span>
              <h2 class="text-xl font-bold tracking-tight text-white">Upgrade Your CI/CD Capabilities</h2>
            </div>
            <p class="text-xs text-stone-400">Unlock AI workflow optimization, SLSA supply chain security, multi-cloud exporters, and DORA fleet analytics.</p>
          </div>

          <!-- Billing Cycle Switcher -->
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-stone-800 rounded-xl p-1 border border-stone-700 text-xs font-bold">
              <button 
                type="button"
                (click)="selectedCycle.set('monthly')"
                [class.bg-stone-700]="selectedCycle() === 'monthly'"
                [class.text-white]="selectedCycle() === 'monthly'"
                [class.text-stone-400]="selectedCycle() !== 'monthly'"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                Monthly
              </button>
              <button 
                type="button"
                (click)="selectedCycle.set('annual')"
                [class.bg-emerald-600]="selectedCycle() === 'annual'"
                [class.text-white]="selectedCycle() === 'annual'"
                [class.text-stone-400]="selectedCycle() !== 'annual'"
                class="px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
                <span>Annual</span>
                <span class="text-[9px] font-mono px-1 py-0.2 bg-white/20 text-white rounded font-bold">SAVE 20%</span>
              </button>
            </div>

            <button 
              type="button"
              (click)="closeModal.emit()"
              class="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer transition-colors">
              ✕
            </button>
          </div>
        </div>

        <!-- Navigation Tabs: Subscription Plans vs License Key Activation -->
        <div class="px-6 pt-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-bold">
            <button 
              type="button"
              (click)="activeTab.set('plans')"
              [class.border-stone-900]="activeTab() === 'plans'"
              [class.text-stone-900]="activeTab() === 'plans'"
              [class.border-transparent]="activeTab() !== 'plans'"
              [class.text-stone-500]="activeTab() !== 'plans'"
              class="py-2.5 px-3 border-b-2 transition-all cursor-pointer">
              Subscription Plans (Cloud)
            </button>
            <button 
              type="button"
              (click)="activeTab.set('license')"
              [class.border-stone-900]="activeTab() === 'license'"
              [class.text-stone-900]="activeTab() === 'license'"
              [class.border-transparent]="activeTab() !== 'license'"
              [class.text-stone-500]="activeTab() !== 'license'"
              class="py-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5">
              <span>Enterprise License Key</span>
              <span class="text-[9px] font-mono px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded font-bold">ON-PREM</span>
            </button>
          </div>

          <div class="text-[11px] text-stone-500 font-mono hidden sm:block">
            Current Tier: <strong class="text-stone-900 uppercase">{{ billingService.currentPlan().name }}</strong>
          </div>
        </div>

        <!-- TAB 1: PRICING CARDS GRID -->
        @if (activeTab() === 'plans') {
          <div class="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (plan of billingService.plans; track plan.id) {
              @if (plan.id !== 'enterprise') {
                <div 
                  [class.ring-2]="plan.isPopular"
                  [class.ring-stone-900]="plan.isPopular"
                  [class.shadow-xl]="plan.isPopular"
                  class="rounded-3xl border border-stone-200 p-6 bg-white flex flex-col justify-between space-y-6 relative hover:border-stone-400 transition-all">
                  
                  @if (plan.badge) {
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900 text-amber-300 text-[9px] font-mono font-black uppercase px-3 py-1 rounded-full border border-amber-300/30 tracking-wider">
                      {{ plan.badge }}
                    </div>
                  }

                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="text-lg font-bold text-stone-900">{{ plan.name }}</h3>
                      @if (billingService.currentPlanId() === plan.id) {
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      }
                    </div>

                    <p class="text-xs text-stone-500 min-h-[32px] leading-relaxed mb-4">{{ plan.description }}</p>

                    <!-- Price Display -->
                    <div class="flex items-baseline gap-1.5 pb-4 border-b border-stone-100 mb-4">
                      @if (plan.monthlyPriceUsd === 0) {
                        <span class="text-3xl font-black text-stone-900">$0</span>
                        <span class="text-xs text-stone-400 font-semibold">/ forever</span>
                      } @else {
                        <span class="text-3xl font-black text-stone-900">
                          \${{ selectedCycle() === 'annual' ? plan.annualPriceUsd : plan.monthlyPriceUsd }}
                        </span>
                        <span class="text-xs text-stone-400 font-semibold">/ month</span>
                        @if (selectedCycle() === 'annual') {
                          <span class="text-[10px] font-mono text-emerald-600 block ml-1 font-bold">billed yearly</span>
                        }
                      }
                    </div>

                    <!-- Features Checklist -->
                    <ul class="space-y-2.5 text-xs text-stone-600">
                      @for (feat of plan.features; track feat.name) {
                        <li class="flex items-start gap-2">
                          @if (feat.included) {
                            <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <span class="text-stone-800">{{ feat.name }}</span>
                          } @else {
                            <svg class="w-4 h-4 text-stone-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span class="text-stone-400 line-through">{{ feat.name }}</span>
                          }
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- CTA Button -->
                  <div>
                    @if (billingService.currentPlanId() === plan.id) {
                      <button 
                        type="button"
                        disabled
                        class="w-full py-2.5 bg-stone-100 text-stone-400 rounded-xl text-xs font-bold cursor-not-allowed">
                        Current Plan
                      </button>
                    } @else {
                      <button 
                        type="button"
                        (click)="initiateCheckout(plan.id)"
                        [class.bg-stone-900]="plan.isPopular"
                        [class.text-white]="plan.isPopular"
                        [class.hover:bg-stone-800]="plan.isPopular"
                        [class.bg-emerald-600]="!plan.isPopular"
                        [class.text-white]="!plan.isPopular"
                        [class.hover:bg-emerald-500]="!plan.isPopular"
                        class="w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5">
                        <span>{{ plan.ctaText }}</span>
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    }
                  </div>

                </div>
              }
            }
          </div>
        }

        <!-- TAB 2: LICENSE KEY ACTIVATION -->
        @if (activeTab() === 'license') {
          <div class="p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
            <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs space-y-1">
              <span class="font-bold text-indigo-900 block">Self-Hosted Air-Gapped & Enterprise Activation</span>
              <p class="text-indigo-800">Enter your purchased offline license key from LemonSqueezy, GitHub Marketplace, or your Enterprise contract.</p>
            </div>

            <div class="space-y-3">
              <label for="license-key-input" class="block text-xs font-bold text-stone-700">Enter License Key</label>
              <input 
                id="license-key-input"
                type="text"
                [value]="licenseInput()"
                (input)="licenseInput.set($any($event.target).value)"
                placeholder="ADH-PRO-8F1E-9A2C-4B7D"
                class="w-full px-4 py-3 rounded-2xl border border-stone-300 font-mono text-sm uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-stone-900"
              />

              @if (licenseResult(); as res) {
                <div 
                  [class.bg-emerald-50]="res.success"
                  [class.text-emerald-800]="res.success"
                  [class.border-emerald-200]="res.success"
                  [class.bg-rose-50]="!res.success"
                  [class.text-rose-800]="!res.success"
                  [class.border-rose-200]="!res.success"
                  class="p-3 rounded-xl border text-xs font-medium">
                  {{ res.message }}
                </div>
              }

              <button 
                type="button"
                (click)="submitLicenseKey()"
                class="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                Validate & Activate License
              </button>
            </div>

            <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-500 space-y-1 font-mono">
              <p>💡 <strong>Demo Keys for Testing:</strong></p>
              <p>• Pro License: <code class="text-stone-900 font-bold">ADH-PRO-DEMO-2026</code></p>
              <p>• Enterprise License: <code class="text-stone-900 font-bold">ADH-ENT-UNLIMITED-2026</code></p>
            </div>
          </div>
        }

        <!-- CHECKOUT SIMULATOR OVERLAY MODAL -->
        @if (showCheckoutModal()) {
          <div class="fixed inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
            <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5">
              
              <div class="flex items-center justify-between pb-3 border-b border-stone-100">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    💳
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-stone-900">Secure Stripe Checkout</h3>
                    <p class="text-[10px] text-stone-500">256-bit TLS Encrypted Payment</p>
                  </div>
                </div>
                <button (click)="showCheckoutModal.set(false)" class="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
              </div>

              <!-- Order Summary -->
              <div class="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
                <div class="flex items-center justify-between font-bold text-stone-900">
                  <span>{{ pendingPlan()?.name }} ({{ selectedCycle() | titlecase }})</span>
                  <span>\${{ calculateCheckoutAmount() }}</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Billed {{ selectedCycle() === 'annual' ? 'yearly' : 'monthly' }}</span>
                  <span class="text-emerald-600 font-bold">{{ discountPercent() > 0 ? '-' + discountPercent() + '% Applied' : 'Standard Rate' }}</span>
                </div>
              </div>

              <!-- Coupon Code -->
              <div>
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    [value]="couponInput()" 
                    (input)="couponInput.set($any($event.target).value)" 
                    placeholder="Coupon code (e.g. LAUNCH50)" 
                    class="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs uppercase font-mono focus:outline-hidden"
                  />
                  <button 
                    type="button" 
                    (click)="applyCoupon()"
                    class="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer">
                    Apply
                  </button>
                </div>
                @if (couponMessage()) {
                  <p class="text-[10px] mt-1 text-emerald-600 font-bold">{{ couponMessage() }}</p>
                }
              </div>

              <!-- Card Inputs (Simulated) -->
              <div class="space-y-2 text-xs">
                <span class="block font-bold text-stone-700">Cardholder Information</span>
                <input 
                  type="text" 
                  value="Ishaan Sharma" 
                  placeholder="Cardholder Name" 
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-hidden"
                />
                <input 
                  type="text" 
                  value="4242 •••• •••• 4242" 
                  placeholder="Card Number" 
                  class="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono focus:outline-hidden"
                />
                <div class="grid grid-cols-2 gap-2">
                  <input type="text" value="12/28" placeholder="MM/YY" class="px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-center focus:outline-hidden" />
                  <input type="text" value="888" placeholder="CVC" class="px-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-center focus:outline-hidden" />
                </div>
              </div>

              <!-- Pay Button -->
              <button 
                type="button"
                (click)="completeCheckout()"
                class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                <span>Complete Purchase (\${{ calculateCheckoutAmount() }})</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>

            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class PricingModalComponent {
  closeModal = output<void>();
  planUpgraded = output<SubscriptionPlanId>();

  billingService = inject(BillingSubscriptionService);

  activeTab = signal<'plans' | 'license'>('plans');
  selectedCycle = signal<BillingCycle>('annual');
  
  // Checkout modal
  showCheckoutModal = signal<boolean>(false);
  pendingPlanId = signal<SubscriptionPlanId>('pro');
  couponInput = signal<string>('LAUNCH50');
  discountPercent = signal<number>(50);
  couponMessage = signal<string>('50% Launch discount applied!');

  licenseInput = signal<string>('');
  licenseResult = signal<{ success: boolean; message: string } | null>(null);

  pendingPlan = computed(() => {
    return this.billingService.plans.find(p => p.id === this.pendingPlanId());
  });

  initiateCheckout(planId: SubscriptionPlanId) {
    this.pendingPlanId.set(planId);
    this.showCheckoutModal.set(true);
  }

  applyCoupon() {
    const res = this.billingService.applyCouponCode(this.couponInput());
    if (res.valid) {
      this.discountPercent.set(res.discountPercent);
      this.couponMessage.set(res.message);
    } else {
      this.discountPercent.set(0);
      this.couponMessage.set('Invalid code');
    }
  }

  calculateCheckoutAmount(): number {
    const plan = this.pendingPlan();
    if (!plan) return 0;
    const base = this.selectedCycle() === 'annual' ? plan.annualPriceUsd * 12 : plan.monthlyPriceUsd;
    const discount = (base * this.discountPercent()) / 100;
    return Math.round(base - discount);
  }

  completeCheckout() {
    this.billingService.upgradePlan(this.pendingPlanId(), this.selectedCycle(), {
      brand: 'visa',
      last4: '4242'
    });
    this.showCheckoutModal.set(false);
    this.planUpgraded.emit(this.pendingPlanId());
    this.closeModal.emit();
  }

  submitLicenseKey() {
    const res = this.billingService.activateLicenseKey(this.licenseInput());
    this.licenseResult.set(res);
    if (res.success) {
      setTimeout(() => {
        this.closeModal.emit();
      }, 1200);
    }
  }
}
