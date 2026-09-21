import { Component, ChangeDetectionStrategy, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudExportersService, CloudTargetPreset } from '../services/cloud-exporters';

@Component({
  selector: 'app-cloud-exporters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col space-y-6 p-6">
      
      <!-- Top Banner -->
      <div class="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-stone-900">Multi-Cloud & Container Exporters</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                GCP • AWS • VERCEL • GHCR • FLY.IO
              </span>
            </div>
            <p class="text-xs text-stone-500">Ready-to-deploy GitHub Actions templates for modern cloud infrastructures with pre-configured secret bindings.</p>
          </div>
        </div>

        <!-- Filter Category Pills -->
        <div class="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
          <button 
            type="button"
            (click)="selectedCategory.set('all')"
            [class.bg-white]="selectedCategory() === 'all'"
            [class.shadow-xs]="selectedCategory() === 'all'"
            [class.text-stone-900]="selectedCategory() === 'all'"
            [class.text-stone-500]="selectedCategory() !== 'all'"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer">
            All Targets
          </button>
          <button 
            type="button"
            (click)="selectedCategory.set('serverless')"
            [class.bg-white]="selectedCategory() === 'serverless'"
            [class.shadow-xs]="selectedCategory() === 'serverless'"
            [class.text-stone-900]="selectedCategory() === 'serverless'"
            [class.text-stone-500]="selectedCategory() !== 'serverless'"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer">
            Serverless
          </button>
          <button 
            type="button"
            (click)="selectedCategory.set('containers')"
            [class.bg-white]="selectedCategory() === 'containers'"
            [class.shadow-xs]="selectedCategory() === 'containers'"
            [class.text-stone-900]="selectedCategory() === 'containers'"
            [class.text-stone-500]="selectedCategory() !== 'containers'"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer">
            Containers
          </button>
          <button 
            type="button"
            (click)="selectedCategory.set('static')"
            [class.bg-white]="selectedCategory() === 'static'"
            [class.shadow-xs]="selectedCategory() === 'static'"
            [class.text-stone-900]="selectedCategory() === 'static'"
            [class.text-stone-500]="selectedCategory() !== 'static'"
            class="px-3 py-1 rounded-lg transition-all cursor-pointer">
            Static & Edge
          </button>
        </div>
      </div>

      <!-- Main Layout: Grid of Target Cards (Left) + Selected Preview & Secrets (Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Target Selector Grid -->
        <div class="lg:col-span-5 space-y-3">
          @for (preset of filteredPresets(); track preset.id) {
            <div 
              role="button"
              tabindex="0"
              (click)="selectedPresetId.set(preset.id)"
              (keydown.enter)="selectedPresetId.set(preset.id)"
              (keydown.space)="selectedPresetId.set(preset.id)"
              [class.ring-2]="selectedPresetId() === preset.id"
              [class.ring-stone-900]="selectedPresetId() === preset.id"
              [class.bg-stone-50]="selectedPresetId() === preset.id"
              class="p-4 rounded-2xl border border-stone-200 hover:border-stone-300 transition-all cursor-pointer bg-white flex items-start justify-between gap-3 shadow-2xs">
              
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span 
                    [class.bg-blue-100]="preset.provider === 'gcp'"
                    [class.text-blue-800]="preset.provider === 'gcp'"
                    [class.bg-amber-100]="preset.provider === 'aws'"
                    [class.text-amber-800]="preset.provider === 'aws'"
                    [class.bg-purple-100]="preset.provider === 'vercel' || preset.provider === 'flyio'"
                    [class.text-purple-800]="preset.provider === 'vercel' || preset.provider === 'flyio'"
                    [class.bg-stone-100]="preset.provider === 'ghcr' || preset.provider === 'railway'"
                    [class.text-stone-800]="preset.provider === 'ghcr' || preset.provider === 'railway'"
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {{ preset.provider }}
                  </span>
                  <h4 class="text-sm font-bold text-stone-900">{{ preset.name }}</h4>
                </div>
                <p class="text-xs text-stone-500 leading-relaxed">{{ preset.description }}</p>
                <div class="flex items-center gap-2 pt-1">
                  <span class="text-[10px] font-mono font-semibold text-stone-400">
                    {{ preset.requiredSecrets.length }} secret(s) required
                  </span>
                </div>
              </div>

              <div class="shrink-0 text-stone-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          }
        </div>

        <!-- Right: Detail & YAML Code Preview -->
        <div class="lg:col-span-7 bg-stone-900 text-stone-100 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          @if (activePreset(); as active) {
            <div class="space-y-4">
              
              <!-- Header Info -->
              <div class="flex items-center justify-between pb-3 border-b border-stone-800">
                <div>
                  <h4 class="text-sm font-bold text-white">{{ active.name }} Workflow Template</h4>
                  <p class="text-xs text-stone-400">Production GitHub Actions workflow configuration</p>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    type="button"
                    (click)="copyYaml(active.yamlTemplate)"
                    class="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                    {{ copySuccess() ? '✓ Copied' : 'Copy YAML' }}
                  </button>
                  <button 
                    type="button"
                    (click)="useTemplate(active.yamlTemplate)"
                    class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Apply to Active Workflow
                  </button>
                </div>
              </div>

              <!-- Required Secrets Checklist -->
              <div class="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">Required GitHub Repository Secrets</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  @for (sec of active.requiredSecrets; track sec.key) {
                    <div class="p-2 bg-stone-900 rounded-lg border border-stone-800/80">
                      <code class="text-xs font-mono font-bold text-emerald-400">{{ sec.key }}</code>
                      <p class="text-[10px] text-stone-400 mt-0.5">{{ sec.description }}</p>
                    </div>
                  }
                </div>
              </div>

              <!-- Code Preview -->
              <div class="font-mono text-xs overflow-x-auto max-h-[300px] p-3 bg-stone-950 rounded-xl border border-stone-800 select-text scrollbar-thin scrollbar-thumb-stone-800">
                <pre class="text-stone-300 leading-relaxed">{{ active.yamlTemplate }}</pre>
              </div>

            </div>
          }
        </div>

      </div>

    </div>
  `
})
export class CloudExportersComponent {
  yamlSelected = output<string>();

  cloudService = inject(CloudExportersService);

  selectedCategory = signal<'all' | 'serverless' | 'containers' | 'static'>('all');
  selectedPresetId = signal<string>('gcp-cloudrun');
  copySuccess = signal<boolean>(false);

  filteredPresets = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return this.cloudService.presets;
    return this.cloudService.presets.filter(p => p.category === cat || (cat === 'static' && p.category === 'paas'));
  });

  activePreset = computed<CloudTargetPreset | undefined>(() => {
    return this.cloudService.presets.find(p => p.id === this.selectedPresetId()) || this.cloudService.presets[0];
  });

  useTemplate(yaml: string) {
    this.yamlSelected.emit(yaml);
  }

  copyYaml(yaml: string) {
    navigator.clipboard.writeText(yaml);
    this.copySuccess.set(true);
    setTimeout(() => this.copySuccess.set(false), 2000);
  }
}
