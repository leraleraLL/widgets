export interface IWidget{
  id: number;
  name?: string;
  projectName?: string;
  type: WidgetType;
  chartData: IChartData;
  order: number;
  [k: string]: any;
}

export interface IChartData {
  tasksCompleted: number;
  tasksTotal: number;
  startDate: string | null;
  endDate :string | null;
  [k: string]: any;
}

export type WidgetType = 'progress' | 'statistics' | 'timeline';
