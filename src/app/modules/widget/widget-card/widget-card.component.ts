import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  output,
  effect,
  input,
  inject
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {IChartData, IWidget} from '../models/widget';
import { DashboardStateService } from '../../../services/local-storage/dashboard-state.service';

@Component({
  selector: 'widget-card',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, ButtonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './widget-card.component.html',
  styleUrls: ['./widget-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class WidgetCardComponent {
  private confirmation = inject(ConfirmationService);
  private readonly dashboardState = inject(DashboardStateService);

  widgetData = input.required<IWidget>();
  /** id активного real-time виджета */
  activeId = input<number | null>();

  readonly component = signal<any>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

/** кэш лениво загруженных компонентов */
  private static cache = new Map<string, any>();

 /** эмуляция HTTP */
  readonly projects = toSignal(this.dashboardState.loadProjects(), { initialValue: [] });

 /** если этот виджет активный — стримим */
  readonly stream = computed(() => {
    const id = this.widgetData().id;
    const active = this.activeId();
    if (id !== active || !active) return null;

    return this.dashboardState.streamProject(id);
  });

 /** подготавливаем данные для конкретного дочернего виджета */
  readonly dataForChild = computed(() => {
    const w = this.widgetData() as IWidget;
    const rt = this.stream() as IWidget; // IWidget | null
    if (rt) return rt.chartData;   // real-time

    const fromList = this.projects().find(p => p.id === w.id);
    return (fromList?.chartData ?? w.chartData);
  });

  readonly edit = output<number>();
  readonly remove = output<number>();

  constructor() {
    effect(
      async () => {
        const w = this.widgetData();
        if (!w) return;
        this.loading.set(true);
        this.error.set(null);

        try {
          const cmp = await this.lazyLoad(w.type);
          this.component.set(cmp);
        } catch (e) {
          this.error.set((e as Error).message);
        } finally {
          this.loading.set(false);
        }
      },
      { allowSignalWrites: true }
    );
  }

  private async lazyLoad(type: string): Promise<any> {
    if (WidgetCardComponent.cache.has(type)) return WidgetCardComponent.cache.get(type)!;

    const loaders: Record<string, () => Promise<any>> = {
      progress: () =>
        import('../charts/widget-progress-bar/widget-progress-bar.component').then(
          (m) => m.WidgetProgressBarComponent
        ),
      statistics: () =>
        import('../charts/widget-pie/widget-pie.component').then(
          (m) => m.WidgetPieComponent
        ),
      timeline: () =>
        import('../charts/widget-timeline/widget-timeline.component').then(
          (m) => m.WidgetTimelineComponent
        ),
    };

    const loader = loaders[type];
    if (!loader) throw new Error(`Неизвестный тип виджета: ${type}`);

    const cmp = await loader();
    WidgetCardComponent.cache.set(type, cmp);
    return cmp;
  }

  editWidgetView(): void {
    const id = this.widgetData().id;
    this.edit.emit(id);
  }

  removeWidget(): void {
    const id = this.widgetData().id;
    this.confirmation.confirm({
      message: 'Вы действительно хотите удалить этот виджет?',
      header: 'Подтверждение удаления',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Удалить',
      rejectLabel: 'Отмена',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => this.remove.emit(id),
    });
  }

 /** получает актуальные данные для виджета */
  getDataForWidget() {
    const w = this.widgetData();
    return this.stream() ?? this.projects().find((p) => p.id === w.id);
  }
}
