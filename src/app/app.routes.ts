import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'widget-view',
        loadComponent: () => import('./modules/widget/widget-view/widget-view.component')
          .then(m => m.WidgetViewComponent)
      }
    ]
  }
];
