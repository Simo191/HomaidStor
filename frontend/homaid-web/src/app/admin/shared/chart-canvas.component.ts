import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import Chart, { ChartConfiguration, ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-canvas',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`:host { display: block; position: relative; width: 100%; height: 100%; }`]
})
export class ChartCanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @Input() type: ChartType = 'line';
  @Input() data!: ChartConfiguration['data'];
  @Input() options: ChartConfiguration['options'] = {};

  private chart?: Chart;

  ngAfterViewInit(): void { this.render(); }

  ngOnChanges(c: SimpleChanges): void {
    if (this.chart && (c['data'] || c['options'])) {
      this.chart.data = this.data;
      this.chart.options = this.options ?? {};
      this.chart.update();
    }
  }

  ngOnDestroy(): void { this.chart?.destroy(); }

  private render(): void {
    if (!this.canvas) return;
    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: this.data,
      options: this.options
    });
  }
}
