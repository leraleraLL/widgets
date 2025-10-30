import { Injectable, signal, effect } from '@angular/core';
import { of, delay, delayWhen, timer } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { IWidget } from '../../modules/widget/models/widget';
import { WIDGET_DATA } from '../projects/widgetData';


@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly STORAGE_KEY = 'dashboard-state';

  widgets = signal<IWidget[]>(this.load() ?? WIDGET_DATA);

  constructor() {
    // автоматически сохраняем при изменении signal
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.widgets()));
    });
  }

  /** эмуляция HTTP */
  loadProjects() {
    const widgets$ = toObservable(this.widgets);
    // эмуляция небольшой задержки при первом запросе
    let first = true;
    return widgets$.pipe(
      delayWhen(() => {
        if (first) {
          first = false;
          return timer(400 + Math.random() * 400);
        }
        return timer(0);
      })
    );
  }

  /** эмуляция real-time обновления */
  streamProject(id: number) {
    const item = this.widgets().find(w => w.id === id);
    if (!item) throw new Error(`Проект с id=${id} не найден`);
    return item as IWidget;
  }

  /** перезапись всего состояния (например, после добавления/редактирования) */
  setWidgets(newWidgets: IWidget[]) {
    this.widgets.set([...newWidgets]);
  }

  /** добавить новый виджет */
  addWidget(widget: IWidget) {
    this.widgets.update((arr) => [...arr, widget]);
  }

  /** удалить */
  removeWidget(id: number) {
    this.widgets.update((arr) => arr.filter((w) => w.id !== id));
  }

  /** обновление одного виджета по id */
  updateWidget(id: number, patch: Partial<IWidget>) {
    this.widgets.update(widgets =>
      widgets.map(w => (w.id === id ? { ...w, ...patch } : w))
    );
  }

  private load(): IWidget[] | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }
}
