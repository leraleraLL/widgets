import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  input,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageModule } from 'primeng/message';
import { DashboardStateService } from '../../../services/local-storage/dashboard-state.service';
import { IWidget } from '../models/widget';

@Component({
  selector: 'widget-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    AutoCompleteModule,
    ButtonModule,
    InputNumberModule,
    DatePickerModule,

  ],
  templateUrl: './widget-view.component.html',
  styleUrls: ['./widget-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetViewComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dashboard = inject(DashboardStateService);

  readonly editWidgetId = input<number | null>();

  readonly widgetTypes = ['progress', 'statistics', 'timeline'];

  readonly visible = signal(true);
  readonly filteredTypes = signal<string[]>(this.widgetTypes);
  readonly actionLabel = computed(() =>
    this.editWidgetId() ? 'Сохранить' : 'Создать'
  );

  readonly close = output<void>();

  readonly form: FormGroup = this.fb.group({
    id: [null],
    name: ['', Validators.required],
    projectName: ['', Validators.required],
    type: [null, Validators.required],
    tasksCompleted: [0, [Validators.min(0)]],
    tasksTotal: [0, [Validators.min(1)]],
    dateRange: [null], // [startDate, endDate]
  });

  constructor() {
    effect(() => {
      const editId = this.editWidgetId();
      if (editId !== null) {
        const widget = this.dashboard.widgets().find(w => w.id === editId);
        if (widget) {
          this.loadWidgetForEdit(widget);
        }
      } else {
        this.form.reset();
      }
    });
  }

  filterTypes(event: any) {
    const query = event.query.toLowerCase();
    this.filteredTypes.set(
      this.widgetTypes.filter((type) => type.toLowerCase().includes(query))
    );
  }

  closeModal(): void {
    this.visible.set(false);
    this.close.emit();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const widgets = this.dashboard.widgets();
    const widget = this.buildWidgetFromForm(widgets);

    this.editWidgetId()
      ? this.dashboard.updateWidget(widget.id, widget)
      : this.dashboard.setWidgets([...widgets, widget]);

    this.closeModal();
  }

  private loadWidgetForEdit(widget: IWidget): void {
    const chart = widget.chartData || {};

    const start = chart.startDate ? new Date(chart.startDate) : null;
    const end = chart.endDate ? new Date(chart.endDate) : null;

    this.form.patchValue({
      id: widget.id,
      name: widget.name,
      projectName: widget.projectName,
      type: widget.type,
      tasksCompleted: chart.tasksCompleted ?? 0,
      tasksTotal: chart.tasksTotal ?? 0,
      dateRange: start && end ? [start, end] : null,
    });
  }

  /** Формирует IWidget из формы */
  private buildWidgetFromForm(widgets: IWidget[]): IWidget {
    const raw = this.form.getRawValue();
    const [startDate, endDate] = raw.dateRange || [null, null];
    const isEdit = !!this.editWidgetId();

    const id = isEdit
      ? raw.id
      : this.getNextId(widgets);

    const order = isEdit
      ? this.getExistingOrder(widgets, id)
      : this.getNextOrder(widgets);

    return {
      id,
      order,
      name: raw.name?.trim(),
      projectName: raw.projectName?.trim(),
      type: raw.type,
      chartData: {
        tasksCompleted: raw.tasksCompleted ?? 0,
        tasksTotal: raw.tasksTotal ?? 1,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
      },
    };
  }

  /** Следующий уникальный ID */
  private getNextId(widgets: IWidget[]): number {
    if (!widgets.length) return 1;
    return Math.max(...widgets.map(w => w.id ?? 0)) + 1;
  }

  /** Следующий order (вне зависимости от порядка массива) */
  private getNextOrder(widgets: IWidget[]): number {
    if (!widgets.length) return 0;
    return Math.max(...widgets.map(w => w.order ?? 0)) + 1;
  }

  /** Сохраняем order, если виджет редактируется */
  private getExistingOrder(widgets: IWidget[], id: number): number {
    return widgets.find(w => w.id === id)?.order ?? 0;
  }

  /** Форматирование даты в yyyy-MM-dd */
  private formatDate(date: any): string | null {
    return date ? new Date(date).toISOString().slice(0, 10) : null;
  }
}
