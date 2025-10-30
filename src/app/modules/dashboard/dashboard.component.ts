import { Component, ChangeDetectionStrategy, inject, effect, signal, computed } from '@angular/core';
import { timer, map, debounceTime, Subject } from 'rxjs';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';
import { toSignal } from '@angular/core/rxjs-interop';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TooltipModule } from 'primeng/tooltip';
import { IWidget } from '../widget/models/widget';
import { DashboardStateService } from '../../services/local-storage/dashboard-state.service';
import { WidgetCardComponent } from '../widget/widget-card/widget-card.component';
import { WidgetViewComponent } from '../widget/widget-view/widget-view.component';


@Component({
  selector: 'dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CdkDropList,
    CdkDrag,
    WidgetCardComponent,
    WidgetViewComponent,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    TooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly dashboardState = inject(DashboardStateService);

  private readonly widgets = this.dashboardState.widgets;
  readonly randomWidgetId = signal<number | null>(null);
  readonly showModal = signal(false);
  readonly editWidgetId = signal<number | null>(null);

  private readonly search$ = new Subject<string>();
  readonly filterText = signal('');

  /** отфильтрованные и отсортированные виджеты */
  readonly visibleWidgets = computed(() => {
    const query = this.filterText().trim().toLowerCase();
    return [...this.widgets()]
      .filter((w) => !query || w.name?.toLowerCase().includes(query))
      .sort((a, b) => a.order - b.order);
  });

  constructor() {
    effect(() => {
      const widgets = this.widgets();
      if (!widgets?.length) return;

      // генерируем id
      this.randomWidgetId.set(this.getRandomId(widgets));

      // каждые 5 секунд обновляем
      const interval = setInterval(() => {
        this.randomWidgetId.set(this.getRandomId(widgets));
      }, 5000);

      // очистка при уничтожении компонента
      return () => clearInterval(interval);
    });

    /** debounce поиска */
    this.search$.pipe(debounceTime(300)).subscribe((value) => {
      this.filterText.set(value);
    });
  }

  /** обработчик drag-drop */
  drop(event: CdkDragDrop<IWidget[]>) {
    const newOrder = [...this.widgets()];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);

    // обновляем поле order и сохраняем в сигнал
    newOrder.forEach((w, i) => (w.order = i));
    this.widgets.set(newOrder);
  }

  onWidgetView(): void {
    this.showModal.set(true);
  }

  onCloseModal(): void {
    this.editWidgetId.set(null);
    this.showModal.set(false);
  }

  onEditWidget(id: number): void {
    this.editWidgetId.set(id);
    this.showModal.set(true);
  }

  onRemoveWidget(id: number): void {
    this.dashboardState.removeWidget(id);
  }

  /** ввод поиска */
  onSearch(value: string): void {
    this.search$.next(value);
  }

  private getRandomId(widgets: IWidget[]): number {
    const random = widgets[Math.floor(Math.random() * widgets.length)];
    return random.id;
  }
}
