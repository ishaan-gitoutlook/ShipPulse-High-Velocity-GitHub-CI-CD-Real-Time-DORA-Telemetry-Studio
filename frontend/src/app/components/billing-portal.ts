import { Component, ChangeDetectionStrategy, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingSubscriptionService } from '../services/billing-subscription';

@Component({
  selector: 'app-billing-portal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Banner -->
      <div class="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base font-bold text-stone-900">Customer Billing & Subscriptions</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                STRIPE CUSTOMER PORTAL
              </span>
            </div>
            <p class="text-xs text-stone-500">Manage plan tier, view past invoices, update payment methods, and monitor subscription status.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            (click)="openPricingModal.emit()"
            class="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Change / Upgrade Plan
          </button>
        </div>
      </div>

      <!-- Current Subscription Overview Card -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Active Plan Details -->
        <div class="md:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Subscription</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {{ billingService.subscriptionStatus() | uppercase }}
              </span>
            </div>

            <div class="flex items-baseline gap-3 mb-2">
              <h3 class="text-2xl font-black text-stone-900">{{ billingService.currentPlan().name }}</h3>
              <span class="text-xs font-mono font-semibold text-stone-500">({{ billingService.billingCycle() | titlecase }})</span>
            </div>

            <p class="text-xs text-stone-600 leading-relaxed mb-6">{{ billingService.currentPlan().description }}</p>

            <!-- Usage Limits Bar -->
            <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <span class="text-xs font-bold uppercase tracking-wider text-stone-500 block">Workspace Limits & Capacity</span>
              
              <div class="space-y-3 text-xs">
                <div>
                  <div class="flex justify-between font-semibold mb-1">
                    <span class="text-stone-700">Repositories Connected</span>
                    <span class="font-mono text-stone-900">
                      {{ billingService.currentPlan().limits.maxRepos === -1 ? 'Unlimited' : '3 of 3 used' }}
                    </span>
                  </div>
                  <div class="h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div class="h-full bg-emerald-600 rounded-full" [style.width]="billingService.currentPlan().limits.maxRepos === -1 ? '30%' : '100%'"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between font-semibold mb-1">
                    <span class="text-stone-700">Virtual CI/CD Runs</span>
                    <span class="font-mono text-stone-900">42 / {{ billingService.currentPlan().limits.maxSimulationsPerMonth }} runs</span>
                  </div>
                  <div class="h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div class="h-full bg-indigo-600 rounded-full" style="width: 14%"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div class="pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>Next billing date: <strong class="text-stone-800">{{ billingService.nextRenewalDate() }}</strong></span>
            @if (billingService.subscriptionStatus() === 'active' && billingService.currentPlanId() !== 'free') {
              <button 
                type="button"
                (click)="billingService.cancelSubscription()"
                class="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer text-[11px] underline">
                Cancel Subscription
              </button>
            }
          </div>
        </div>

        <!-- Payment Method Card -->
        <div class="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span class="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-3">Payment Method</span>
            
            <div class="p-4 bg-stone-900 text-white rounded-2xl space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-mono uppercase tracking-widest text-stone-400">CREDIT CARD</span>
                <span class="text-sm font-bold uppercase">{{ billingService.paymentMethod().brand }}</span>
              </div>

              <div class="text-lg font-mono tracking-widest text-stone-200">
                •••• •••• •••• {{ billingService.paymentMethod().last4 }}
              </div>

              <div class="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>Ishaan Sharma</span>
                <span>Expires {{ billingService.paymentMethod().expMonth }}/{{ billingService.paymentMethod().expYear }}</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            (click)="showUpdateCardModal.set(true)"
            class="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer">
            Update Payment Method
          </button>
        </div>

      </div>

      <!-- Invoices & Receipts Table -->
      <div class="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
        <div class="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-stone-900">Billing History & Invoices</h3>
            <p class="text-xs text-stone-500">Download official tax invoices and receipts for expense reporting.</p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-stone-50/75 border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase tracking-wider">
                <th class="py-3 px-4 font-semibold">Invoice Number</th>
                <th class="py-3 px-4 font-semibold">Date</th>
                <th class="py-3 px-4 font-semibold">Description</th>
                <th class="py-3 px-4 font-semibold">Amount</th>
                <th class="py-3 px-4 font-semibold">Status</th>
                <th class="py-3 px-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              @for (inv of billingService.invoices(); track inv.id) {
                <tr class="hover:bg-stone-50/60 transition-colors">
                  <td class="py-3.5 px-4 font-mono font-bold text-stone-900">{{ inv.invoiceNumber }}</td>
                  <td class="py-3.5 px-4 text-stone-600">{{ inv.date }}</td>
                  <td class="py-3.5 px-4 text-stone-800 font-medium">{{ inv.planName }}</td>
                  <td class="py-3.5 px-4 font-mono font-bold text-stone-900">\${{ inv.amountUsd }}.00</td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {{ inv.status }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button 
                      type="button"
                      (click)="downloadInvoice(inv.invoiceNumber)"
                      class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1">
                      <svg class="w-3 h-3 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PDF
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class BillingPortalComponent {
  openPricingModal = output<void>();

  billingService = inject(BillingSubscriptionService);

  showUpdateCardModal = signal<boolean>(false);

  downloadInvoice(num: string) {
    const blob = new Blob([`INVOICE: ${num}\nShipPulse Subscription\nStatus: PAID\nDate: ${new Date().toLocaleDateString()}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${num}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
