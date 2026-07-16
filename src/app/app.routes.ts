import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pathologies' },
  {
    path: 'pathologies',
    loadComponent: () =>
      import('./features/pathologies/pathology-list').then((m) => m.PathologyList),
  },
  {
    path: 'pathologies/:id/edit',
    loadComponent: () =>
      import('./features/pathologies/pathology-form').then((m) => m.PathologyForm),
  },
  {
    path: 'pathologies/:id',
    loadComponent: () =>
      import('./features/pathologies/pathology-details').then((m) => m.PathologyDetails),
  },
  { path: '**', redirectTo: 'pathologies' },
];
