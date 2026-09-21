import { Component, ChangeDetectionStrategy, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingSubscriptionService, BillingCycle } from '../services/billing-subscription';

@Component({
  selector: 'app-landing-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      <!-- Top Marketing Navigation -->
      <nav class="sticky top-0 z-50 backdrop-blur-md bg-stone-950/80 border-b border-stone-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-black font-black text-lg shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <span class="text-base font-black tracking-tight text-white">Ship<span class="text-emerald-400">Pulse</span></span>
              <span class="ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-stone-800 text-stone-300 border border-stone-700">v2.0</span>
            </div>
          </div>

          <!-- Nav Links -->
          <div class="hidden md:flex items-center gap-8 text-xs font-semibold text-stone-300">
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#roi-calculator" class="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-400 text-[11px] font-mono">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              99.99% Uptime
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button 
              type="button"
              (click)="launchApp.emit()"
              class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5">
              <span>Launch Console</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

        </div>
      </nav>

      <!-- HERO SECTION -->
      <section class="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        
        <!-- Glow Orbs in Background -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>The Developer-First CI/CD & GitHub Actions Studio</span>
            <span class="text-stone-600">•</span>
            <span class="text-emerald-400 font-mono">SLSA 3 Ready</span>
          </div>

          <!-- Headline -->
          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
            Automate, Optimize & Secure <br/>
            <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Your Entire CI/CD Pipeline
            </span>
          </h1>

          <!-- Subhead -->
          <p class="text-base sm:text-lg text-stone-400 max-w-3xl mx-auto leading-relaxed">
            Eliminate broken GitHub Actions runs with a real-time virtual runner, automated multi-tier caching, 
            instant SLSA supply-chain audits, leaked secret redaction, and multi-cloud deployment exporters.
          </p>

          <!-- Hero CTAs -->
          <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button 
              type="button"
              (click)="launchApp.emit()"
              class="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2">
              <span>Start Free (No Credit Card)</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button 
              type="button"
              (click)="openPricing.emit()"
              class="px-6 py-4 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center gap-2">
              <span>View Plans & Pricing</span>
              <span class="text-[10px] font-mono px-2 py-0.5 bg-stone-800 text-amber-300 rounded-full font-bold">50% OFF</span>
            </button>
          </div>

          <!-- Social Proof Badges -->
          <div class="pt-8 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-8 text-xs text-stone-400 font-mono">
            <div class="flex items-center gap-2">
              <span class="text-emerald-400 font-bold text-sm">★ 4.9/5</span>
              <span>Developer Rating</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-white font-bold">100,000+</span>
              <span>Simulations Run</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-indigo-400 font-bold">55%</span>
              <span>Runner Cost Reduction</span>
            </div>
          </div>

        </div>

      </section>

      <!-- INTERACTIVE FEATURE PREVIEW TABS -->
      <section id="features" class="py-16 border-t border-stone-900 bg-stone-950/60">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Complete Feature Suite</span>
            <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Everything Engineers Need in One Studio</h2>
            <p class="text-sm text-stone-400">Switch between live preview modules below to see ShipPulse in action.</p>
          </div>

          <!-- Interactive Feature Tabs Switcher -->
          <div class="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            @for (tab of featureTabs; track tab.id) {
              <button 
                type="button"
                (click)="activePreviewTab.set(tab.id)"
                [class.bg-emerald-500]="activePreviewTab() === tab.id"
                [class.text-black]="activePreviewTab() === tab.id"
                [class.font-extrabold]="activePreviewTab() === tab.id"
                [class.bg-stone-900]="activePreviewTab() !== tab.id"
                [class.text-stone-300]="activePreviewTab() !== tab.id"
                [class.border-stone-800]="activePreviewTab() !== tab.id"
                class="px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2">
                <span>{{ tab.icon }}</span>
                <span>{{ tab.title }}</span>
              </button>
            }
          </div>

          <!-- Dynamic Feature Preview Card -->
          <div class="bg-stone-900 rounded-3xl border border-stone-800 p-6 md:p-10 shadow-2xl relative overflow-hidden">
            @if (activePreviewTab() === 'runner') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div class="space-y-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    VIRTUAL RUNNER & CHAOS SANDBOX
                  </span>
                  <h3 class="text-2xl font-bold text-white">Test Workflows Locally Without Burning Cloud Minutes</h3>
                  <p class="text-sm text-stone-400 leading-relaxed">
                    Dry-run your GitHub Actions pipelines inside an interactive browser engine. Inject flaky tests, 
                    missing secrets, and network timeout faults to ensure rock-solid resilience before pushing to production.
                  </p>
                  <ul class="space-y-2 text-xs text-stone-300 font-mono">
                    <li class="flex items-center gap-2 text-emerald-400">✓ Real-time streaming runner logs & exit code simulation</li>
                    <li class="flex items-center gap-2 text-emerald-400">✓ 6 Chaos Fault Injection scenarios</li>
                    <li class="flex items-center gap-2 text-emerald-400">✓ 1-Click automated recovery & rollback triggers</li>
                  </ul>
                  <button (click)="launchApp.emit()" class="mt-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl cursor-pointer">
                    Try Virtual Runner →
                  </button>
                </div>

                <div class="bg-black/80 rounded-2xl border border-stone-800 p-4 font-mono text-xs text-stone-300 space-y-2">
                  <div class="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px] text-stone-500">
                    <span>job: deploy-production</span>
                    <span class="text-emerald-400 font-bold">STATUS: RUNNING</span>
                  </div>
                  <p class="text-stone-500">> git checkout main @ 8f1e29c</p>
                  <p class="text-stone-400">> npm ci --prefer-offline [CACHE HIT]</p>
                  <p class="text-stone-400">> vitest run --coverage (148 passed)</p>
                  <p class="text-emerald-400">> gcloud run deploy production-api --image=gcr.io/app:8f1e29c</p>
                  <p class="text-emerald-300 font-bold">✔ Deployment live at https://api.production.app [Duration: 42s]</p>
                </div>
              </div>
            }

            @if (activePreviewTab() === 'optimizer') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div class="space-y-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    AI WORKFLOW OPTIMIZER
                  </span>
                  <h3 class="text-2xl font-bold text-white">Cut CI/CD Pipeline Costs by up to 55%</h3>
                  <p class="text-sm text-stone-400 leading-relaxed">
                    ShipPulse scans your repository dependencies and configures intelligent multi-tier caching 
                    (NPM, Pip, Docker Buildx, Go) along with concurrency auto-cancellation and least-privilege permissions.
                  </p>
                  <button (click)="launchApp.emit()" class="mt-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl cursor-pointer">
                    Optimize My Workflow →
                  </button>
                </div>

                <div class="p-6 bg-stone-950 rounded-2xl border border-stone-800 space-y-4 text-xs">
                  <div class="grid grid-cols-3 gap-3 text-center">
                    <div class="p-3 bg-stone-900 rounded-xl">
                      <span class="text-stone-500 text-[10px] block">Standard Build</span>
                      <strong class="text-rose-400 font-bold">14.2 mins</strong>
                    </div>
                    <div class="p-3 bg-stone-900 rounded-xl">
                      <span class="text-stone-500 text-[10px] block">Cached Build</span>
                      <strong class="text-emerald-400 font-bold">4.8 mins</strong>
                    </div>
                    <div class="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                      <span class="text-emerald-400 text-[10px] block font-bold">Savings</span>
                      <strong class="text-white font-bold">-66% Speedup</strong>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (activePreviewTab() === 'security') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div class="space-y-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    SLSA SECURITY & SECRET SCANNER
                  </span>
                  <h3 class="text-2xl font-bold text-white">Prevent Supply Chain Attacks & Secret Leaks</h3>
                  <p class="text-sm text-stone-400 leading-relaxed">
                    Scan for hardcoded AWS, GitHub, Stripe, and OpenAI tokens before they leak. Convert mutable action tags 
                    to immutable SHA commit hashes with one click for full SLSA Level 3 compliance.
                  </p>
                  <button (click)="launchApp.emit()" class="mt-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl cursor-pointer">
                    Scan Workflow Security →
                  </button>
                </div>

                <div class="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3 text-xs font-mono">
                  <div class="flex items-center justify-between text-rose-400 font-bold">
                    <span>⚠ LEAK DETECTED: Line 24</span>
                    <span class="px-2 py-0.5 bg-rose-900/40 text-rose-300 text-[10px] rounded">CRITICAL</span>
                  </div>
                  <code class="text-stone-400 block bg-black p-2.5 rounded text-[11px]">
                    AWS_KEY: AKIAIOSFODNN7EXAMPLE ➔ auto-masked to {{ '\${{ secrets.AWS_ACCESS_KEY_ID }}' }}
                  </code>
                  <div class="text-emerald-400 text-[11px] font-bold">
                    ✔ 1-Click Action SHA Pinning ready
                  </div>
                </div>
              </div>
            }

            @if (activePreviewTab() === 'dora') {
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div class="space-y-4">
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    DORA METRICS & FLEET HEALTH
                  </span>
                  <h3 class="text-2xl font-bold text-white">Track Elite Engineering Performance Across Repos</h3>
                  <p class="text-sm text-stone-400 leading-relaxed">
                    Measure Deployment Frequency, Lead Time for Changes, Change Failure Rate (CFR), and Mean Time to Recovery (MTTR) 
                    with Google Cloud DORA benchmark ratings.
                  </p>
                  <button (click)="launchApp.emit()" class="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl cursor-pointer">
                    View Fleet Health →
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div class="p-4 bg-stone-950 rounded-2xl border border-stone-800">
                    <span class="text-stone-500 text-[11px] block">Deploy Frequency</span>
                    <strong class="text-emerald-400 text-xl font-black">4.2 / day</strong>
                    <span class="text-[10px] text-emerald-400 block font-bold">ELITE TIER</span>
                  </div>
                  <div class="p-4 bg-stone-950 rounded-2xl border border-stone-800">
                    <span class="text-stone-500 text-[11px] block">Lead Time</span>
                    <strong class="text-emerald-400 text-xl font-black">1.8 hrs</strong>
                    <span class="text-[10px] text-emerald-400 block font-bold">ELITE TIER</span>
                  </div>
                </div>
              </div>
            }
          </div>

        </div>
      </section>

      <!-- INTERACTIVE ROI CALCULATOR SECTION -->
      <section id="roi-calculator" class="py-16 border-t border-stone-900 bg-stone-950">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div class="text-center space-y-2">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">ROI Calculator</span>
            <h2 class="text-3xl font-bold text-white">How Much Will ShipPulse Save Your Team?</h2>
            <p class="text-xs text-stone-400">Estimate your annual engineering hours and cloud runner dollar savings.</p>
          </div>

          <div class="bg-stone-900 rounded-3xl border border-stone-800 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            <div class="md:col-span-2 space-y-6">
              <div>
                <div class="flex justify-between text-xs font-bold text-stone-300 mb-2">
                  <span>Number of Engineers on Team</span>
                  <span class="text-emerald-400 font-mono">{{ teamSize() }} engineers</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  [value]="teamSize()" 
                  (input)="teamSize.set($any($event.target).value)" 
                  class="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div class="flex justify-between text-xs font-bold text-stone-300 mb-2">
                  <span>Daily CI/CD Pipeline Builds</span>
                  <span class="text-emerald-400 font-mono">{{ dailyBuilds() }} builds / day</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="500" 
                  [value]="dailyBuilds()" 
                  (input)="dailyBuilds.set($any($event.target).value)" 
                  class="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div class="bg-stone-950 p-6 rounded-2xl border border-stone-800 text-center space-y-3">
              <span class="text-xs font-mono text-stone-400 uppercase tracking-wider block">Estimated Annual Savings</span>
              <div class="text-3xl sm:text-4xl font-black text-emerald-400">
                \${{ calculateEstimatedSavings().dollars.toLocaleString() }}
              </div>
              <p class="text-xs text-stone-400 font-mono">
                + <strong class="text-white">{{ calculateEstimatedSavings().hours }} hours</strong> of developer wait time saved/year
              </p>
              <button (click)="openPricing.emit()" class="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl cursor-pointer">
                Claim Your Savings →
              </button>
            </div>

          </div>

        </div>
      </section>

      <!-- PRICING SECTION -->
      <section id="pricing" class="py-20 border-t border-stone-900 bg-stone-950/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center max-w-3xl mx-auto space-y-3">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Simple, Transparent Pricing</span>
            <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-white">Scale from Solo Hacker to Enterprise Fleet</h2>
            
            <!-- Annual / Monthly Switcher -->
            <div class="inline-flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs font-bold mt-2">
              <button 
                type="button" 
                (click)="pricingCycle.set('monthly')"
                [class.bg-stone-800]="pricingCycle() === 'monthly'"
                [class.text-white]="pricingCycle() === 'monthly'"
                [class.text-stone-400]="pricingCycle() !== 'monthly'"
                class="px-4 py-2 rounded-lg cursor-pointer transition-all">
                Monthly
              </button>
              <button 
                type="button" 
                (click)="pricingCycle.set('annual')"
                [class.bg-emerald-500]="pricingCycle() === 'annual'"
                [class.text-black]="pricingCycle() === 'annual'"
                [class.text-stone-400]="pricingCycle() !== 'annual'"
                class="px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5">
                <span>Annual</span>
                <span class="text-[9px] font-mono px-1.5 py-0.2 bg-black/30 rounded font-black">SAVE 20%</span>
              </button>
            </div>
          </div>

          <!-- Plans Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            @for (plan of billingService.plans; track plan.id) {
              @if (plan.id !== 'enterprise') {
                <div 
                  [class.ring-2]="plan.isPopular"
                  [class.ring-emerald-500]="plan.isPopular"
                  [class.bg-stone-900]="plan.isPopular"
                  [class.bg-stone-900/60]="!plan.isPopular"
                  class="rounded-3xl border border-stone-800 p-8 flex flex-col justify-between space-y-6 relative hover:border-stone-700 transition-all">
                  
                  @if (plan.badge) {
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-mono font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
                      {{ plan.badge }}
                    </div>
                  }

                  <div>
                    <h3 class="text-xl font-bold text-white mb-2">{{ plan.name }}</h3>
                    <p class="text-xs text-stone-400 min-h-[36px] leading-relaxed mb-6">{{ plan.description }}</p>

                    <div class="flex items-baseline gap-1.5 pb-6 border-b border-stone-800 mb-6">
                      @if (plan.monthlyPriceUsd === 0) {
                        <span class="text-4xl font-black text-white">$0</span>
                        <span class="text-xs text-stone-500">/ forever</span>
                      } @else {
                        <span class="text-4xl font-black text-white">
                          \${{ pricingCycle() === 'annual' ? plan.annualPriceUsd : plan.monthlyPriceUsd }}
                        </span>
                        <span class="text-xs text-stone-500">/ month</span>
                        @if (pricingCycle() === 'annual') {
                          <span class="text-[10px] font-mono text-emerald-400 block ml-2 font-bold">billed annually</span>
                        }
                      }
                    </div>

                    <ul class="space-y-3 text-xs text-stone-300">
                      @for (feat of plan.features; track feat.name) {
                        <li class="flex items-start gap-2.5">
                          @if (feat.included) {
                            <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{{ feat.name }}</span>
                          } @else {
                            <svg class="w-4 h-4 text-stone-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span class="text-stone-600 line-through">{{ feat.name }}</span>
                          }
                        </li>
                      }
                    </ul>
                  </div>

                  <button 
                    type="button"
                    (click)="openPricing.emit()"
                    [class.bg-emerald-500]="plan.isPopular"
                    [class.text-black]="plan.isPopular"
                    [class.hover:bg-emerald-400]="plan.isPopular"
                    [class.bg-stone-800]="!plan.isPopular"
                    [class.text-white]="!plan.isPopular"
                    [class.hover:bg-stone-700]="!plan.isPopular"
                    class="w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5">
                    <span>{{ plan.ctaText }}</span>
                  </button>

                </div>
              }
            }
          </div>

        </div>
      </section>

      <!-- FAQ SECTION -->
      <section id="faq" class="py-16 border-t border-stone-900 bg-stone-950">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div class="text-center space-y-2">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Questions & Answers</span>
            <h2 class="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div class="space-y-4 text-xs">
            <div class="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
              <h4 class="font-bold text-sm text-white">Can I run ShipPulse on-premise / self-hosted?</h4>
              <p class="text-stone-400 leading-relaxed">
                Yes! ShipPulse Enterprise Edition includes an air-gapped container license that runs inside your own VPC, AWS ECS, or Kubernetes cluster with zero external network phone-homes.
              </p>
            </div>

            <div class="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
              <h4 class="font-bold text-sm text-white">How does the virtual runner simulate GitHub Actions?</h4>
              <p class="text-stone-400 leading-relaxed">
                Our in-browser execution sandbox analyzes your YAML step commands, environment variables, and matrix definitions, simulating realistic step outputs, cache hits, and chaos failure scenarios in milliseconds.
              </p>
            </div>

            <div class="p-5 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
              <h4 class="font-bold text-sm text-white">Does ShipPulse store my private GitHub access tokens?</h4>
              <p class="text-stone-400 leading-relaxed">
                No. All repository interactions and token handshakes are executed via secure GitHub OAuth or client-side scoped personal access tokens with 256-bit AES encryption.
              </p>
            </div>
          </div>

        </div>
      </section>

      <!-- FOOTER -->
      <footer class="border-t border-stone-900 bg-black py-12 text-xs text-stone-500">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="w-7 h-7 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold">⚡</div>
            <span class="font-bold text-stone-300">ShipPulse Inc.</span>
            <span>© 2026 All rights reserved.</span>
          </div>

          <div class="flex items-center gap-6 font-mono text-[11px]">
            <a href="https://github.com" target="_blank" class="hover:text-stone-300">GitHub</a>
            <a href="https://discord.com" target="_blank" class="hover:text-stone-300">Discord Community</a>
            <button (click)="openPricing.emit()" class="hover:text-stone-300 cursor-pointer">Pricing</button>
            <button (click)="launchApp.emit()" class="text-emerald-400 font-bold cursor-pointer">Launch App</button>
          </div>
        </div>
      </footer>

    </div>
  `
})
export class LandingPageComponent {
  launchApp = output<void>();
  openPricing = output<void>();

  billingService = inject(BillingSubscriptionService);

  pricingCycle = signal<BillingCycle>('annual');
  activePreviewTab = signal<'runner' | 'optimizer' | 'security' | 'dora'>('runner');

  teamSize = signal<number>(8);
  dailyBuilds = signal<number>(35);

  featureTabs = [
    { id: 'runner' as const, title: 'Virtual Runner & Chaos', icon: '🏃' },
    { id: 'optimizer' as const, title: 'AI Workflow Optimizer', icon: '⚡' },
    { id: 'security' as const, title: 'SLSA Security & Secrets', icon: '🛡️' },
    { id: 'dora' as const, title: 'DORA Fleet Analytics', icon: '📊' }
  ];

  calculateEstimatedSavings() {
    const size = Number(this.teamSize()) || 1;
    const builds = Number(this.dailyBuilds()) || 1;
    // 8 mins saved per build * builds/day * 250 work days
    const totalMinutesSaved = builds * 8 * 250;
    const hoursSaved = Math.round(totalMinutesSaved / 60);
    // Dev hour cost $75/hr weighted by team productivity factor + GitHub Actions compute saved
    const dollarsSaved = Math.round((hoursSaved * 75) + (builds * 250 * 0.12 * Math.max(1, size / 5)));

    return {
      hours: hoursSaved.toLocaleString(),
      dollars: dollarsSaved
    };
  }
}
