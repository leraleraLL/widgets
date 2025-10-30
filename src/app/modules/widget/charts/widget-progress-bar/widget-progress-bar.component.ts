import {ChangeDetectionStrategy, Component, input, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { IChartData } from '../../models/widget';

@Component({
  selector: 'widget-progress-bar',
  standalone: true,
  imports: [CommonModule, ProgressBarModule, CardModule],
  templateUrl: './widget-progress-bar.component.html',
  styleUrl: './widget-progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetProgressBarComponent {
  data = input<IChartData>();

  percent = computed(() => {
    const val: number = this.data()?.tasksCompleted ?? 0;
    const max: number = this.data()?.tasksTotal ?? 1;
    if (!max) return 0;
    const percent: number = (val / max) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  });

  hasData = computed(() => {
    const d = this.data();
    return !!(d && typeof d.tasksCompleted === 'number' && typeof d.tasksTotal === 'number');
  });
}
