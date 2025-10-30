import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import { IChartData } from '../../models/widget';

// тип с обязательными полями, чтобы исключить undefined в шаблоне
type PieOptionsType = Required<
  Pick<
    ApexOptions,
    | 'series'
    | 'chart'
    | 'labels'
    | 'colors'
    | 'legend'
    | 'dataLabels'
    | 'stroke'
    | 'tooltip'
  >
>;

@Component({
  selector: 'widget-pie',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './widget-pie.component.html',
  styleUrl: './widget-pie.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetPieComponent {
  // входные данные
  readonly data = input<IChartData>();

  // дефолтные данные графика
  private readonly defaultOptions: PieOptionsType = {
    chart: {
      type: 'pie',
      width: '100%',
      height: 200,
      toolbar: {show: false},
    },
    labels: ['Нет данных', ''],
    series: [1, 0],
    colors: ['#e5e7eb', '#f9fafb'],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: {colors: '#9ca3af'},
    },
    dataLabels: {
      enabled: true,
      formatter: () => '—',
    },
    stroke: {width: 0},
    tooltip: {enabled: false},
  };

  // реактивные опции для ApexCharts
  readonly chartOptions = computed<PieOptionsType>(() => {
    const data = this.data();
    if (!data) return this.defaultOptions;

    const completed = data.tasksCompleted ?? 0;
    const total = data.tasksTotal || 1;
    const remaining = Math.max(total - completed, 0);

    return {
      ...this.defaultOptions,
      labels: ['Завершено', 'Осталось'],
      series: [completed, remaining],
      colors: ['#3b82f6', '#e5e7eb'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`,
      },
      tooltip: {
        y: { formatter: (val: number) => `${val} задач` },
      },
    };
  });
}
