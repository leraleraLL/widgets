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

/** тип с обязательными полями, чтобы исключить undefined в шаблоне */
type TimelineOptionsType = Required<
  Pick<
    ApexOptions,
    | 'series'
    | 'chart'
    | 'xaxis'
    | 'yaxis'
    | 'plotOptions'
    | 'colors'
    | 'grid'
    | 'tooltip'
  >
>;

@Component({
  selector: 'widget-timeline',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './widget-timeline.component.html',
  styleUrl: './widget-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetTimelineComponent {
  // входные данные
  readonly data = input<IChartData>();

  // дефолтные данные графика
  private readonly defaultOptions: TimelineOptionsType = {
    chart: {
      type: 'rangeBar',
      height: 200,
      toolbar: {show: false},
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '50%',
        borderRadius: 4,
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        style: {colors: '#9ca3af', fontSize: '12px'},
      },
    },
    yaxis: {
      labels: {show: false},
    },
    series: [
      {
        name: 'Период проекта',
        data: [
          {
            x: 'Нет данных',
            y: [new Date().getTime(), new Date().getTime()],
          },
        ],
      },
    ],
    colors: ['#e5e7eb'],
    grid: {borderColor: '#f3f4f6'},
    tooltip: {
      x: {format: 'dd MMM yyyy'},
    },
  };

  readonly chartOptions = computed<TimelineOptionsType>(() => {
    const data = this.data();
    if (!data) return this.defaultOptions;

    const start = this.toUtcMidnight(data.startDate);
    const end = this.toUtcMidnight(data.endDate);

    if (start === null || end === null || start > end) {
      return this.defaultOptions;
    }

    return {
      chart: {
        type: 'rangeBar',
        height: 200,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '50%',
          borderRadius: 4,
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          style: { colors: '#6b7280', fontSize: '12px' },
        },
      },
      yaxis: { labels: { show: false } },
      series: [
        {
          name: 'Период проекта',
          data: [{ x: 'Проект', y: [start, end] }],
        },
      ],
      colors: ['#3b82f6'],
      grid: { borderColor: '#f3f4f6' },
      tooltip: { x: { format: 'dd MMM yyyy' } },
    };
  });

  private toUtcMidnight(date: string | Date | null | undefined): number | null {
    if (!date) return null;

    // Если уже Date
    if (date instanceof Date) {
      return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Проверяем строку в формате 'YYYY-MM-DD'
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const timestamp = Date.parse(`${date}T00:00:00Z`);
      return isNaN(timestamp) ? null : timestamp;
    }

    return null;
  }
}
