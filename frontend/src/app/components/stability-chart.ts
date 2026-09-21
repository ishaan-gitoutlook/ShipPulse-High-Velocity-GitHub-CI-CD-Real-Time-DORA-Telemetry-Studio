import { ChangeDetectionStrategy, Component, ElementRef, OnInit, OnChanges, OnDestroy, SimpleChanges, input, signal, viewChild, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as d3 from 'd3';

export interface BuildStabilityDataPoint {
  date: Date;
  successRate: number; // 0 - 100
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  avgDurationSec: number;
}

@Component({
  selector: 'app-stability-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <h4 class="text-sm font-bold text-stone-900">Pipeline Stability & Success Rate (D3.js)</h4>
            <span class="text-[10px] font-semibold uppercase px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
              Open-Source D3 Core
            </span>
          </div>
          <p class="text-xs text-stone-500 mt-0.5">
            Rolling build health, MTTR resilience, and automated execution consistency across connected repositories.
          </p>
        </div>

        <!-- Metric KPI Badges -->
        <div class="flex items-center gap-3 text-xs">
          <div class="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center gap-2">
            <span class="text-[11px] font-medium text-emerald-700">Success Rate:</span>
            <span class="font-bold font-mono text-emerald-900 text-sm">{{ currentRate() }}%</span>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 flex items-center gap-2">
            <span class="text-[11px] font-medium text-stone-500">Avg Build:</span>
            <span class="font-bold font-mono text-stone-800 text-sm">{{ avgBuildTime() }}s</span>
          </div>
        </div>
      </div>

      <!-- D3 Chart Canvas Container -->
      <div class="relative w-full overflow-hidden">
        <div #chartContainer class="w-full h-48 sm:h-56"></div>
      </div>

      <!-- Chart Legend & Status Footer -->
      <div class="flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500 pt-1 border-t border-stone-100">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-1 bg-emerald-500 rounded-full"></span>
            <span>Success Rate Curve</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded"></span>
            <span>Reliability Envelope</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-stone-400"></span>
            <span>Sampled Build Point</span>
          </div>
        </div>

        <span class="font-mono text-[10px] text-stone-400">D3 SVG Vector Engine • 100% Free & Open-Source</span>
      </div>
    </div>
  `
})
export class StabilityChart implements OnInit, OnChanges, OnDestroy {
  pipelineCount = input<number>(0);
  chartContainer = viewChild<ElementRef<HTMLDivElement>>('chartContainer');
  
  private platformId = inject(PLATFORM_ID);
  currentRate = signal<string>('99.2');
  avgBuildTime = signal<string>('1.8');
  private resizeObserver: ResizeObserver | null = null;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.renderChart();
        const container = this.chartContainer()?.nativeElement;
        if (container && typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => this.renderChart());
          this.resizeObserver.observe(container);
        }
      }, 50);
      window.addEventListener('resize', this.handleResize);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['pipelineCount'] && isPlatformBrowser(this.platformId)) {
      this.renderChart();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.handleResize);
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
    }
  }

  private handleResize = () => {
    this.renderChart();
  };

  private generateMockTimeSeries(): BuildStabilityDataPoint[] {
    const data: BuildStabilityDataPoint[] = [];
    const now = new Date();
    const count = this.pipelineCount() || 1;

    for (let i = 14; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Realistic high success rate curve with slight natural variance
      const variance = Math.sin(i * 0.8) * 1.5 + (Math.random() * 0.8 - 0.4);
      const rate = Math.min(100, Math.max(94, 98.8 + variance));
      const total = Math.max(4, Math.floor(count * 6 + Math.random() * 8));
      const successful = Math.round((total * rate) / 100);
      const failed = total - successful;

      data.push({
        date: d,
        successRate: Math.round(rate * 10) / 10,
        totalBuilds: total,
        successfulBuilds: successful,
        failedBuilds: failed,
        avgDurationSec: Math.round((1.7 + Math.random() * 0.6) * 10) / 10
      });
    }

    return data;
  }

  renderChart() {
    const container = this.chartContainer()?.nativeElement;
    if (!container) return;

    // Clear previous SVG
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 220;
    const margin = { top: 15, right: 20, bottom: 28, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const data = this.generateMockTimeSeries();
    const latest = data[data.length - 1];
    if (latest) {
      this.currentRate.set(latest.successRate.toString());
      this.avgBuildTime.set(latest.avgDurationSec.toString());
    }

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'overflow-visible font-sans');

    // Gradient definitions
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'stabilityAreaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.25);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(data, d => d.date) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([90, 100]).range([innerHeight, 0]);

    // Grid lines
    const yGrid = d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'stroke-stone-100')
      .attr('stroke-dasharray', '2,2')
      .call(yGrid)
      .select('.domain')
      .remove();

    // Area generator
    const area = d3
      .area<BuildStabilityDataPoint>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.successRate))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3
      .line<BuildStabilityDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.successRate))
      .curve(d3.curveMonotoneX);

    // Render Area
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#stabilityAreaGradient)')
      .attr('d', area);

    // Render Stroke Line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Render Data Points
    g.selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.date))
      .attr('cy', d => yScale(d.successRate))
      .attr('r', 3.5)
      .attr('fill', '#ffffff')
      .attr('stroke', '#059669')
      .attr('stroke-width', 2);

    // X Axis
    const timeFormatter = d3.timeFormat('%b %d');
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d: Date | d3.NumberValue) => {
      const dateObj = d instanceof Date ? d : new Date(Number(d));
      return timeFormatter(dateObj);
    });
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('class', 'text-[10px] text-stone-400 font-mono')
      .call(xAxis)
      .select('.domain')
      .attr('stroke', '#e7e5e4');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d => `${d}%`);
    g.append('g')
      .attr('class', 'text-[10px] text-stone-400 font-mono')
      .call(yAxis)
      .select('.domain')
      .attr('stroke', '#e7e5e4');
  }
}
