import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pathologies' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'pathologies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pathologies/pathology-list').then((m) => m.PathologyList),
  },
  {
    path: 'pathologies/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pathologies/pathology-form').then((m) => m.PathologyForm),
  },
  {
    path: 'pathologies/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pathologies/pathology-details').then((m) => m.PathologyDetails),
  },
  {
    path: 'templates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/templates/template-management').then((m) => m.TemplateManagement),
  },
  { path: '**', redirectTo: 'pathologies' },
];
