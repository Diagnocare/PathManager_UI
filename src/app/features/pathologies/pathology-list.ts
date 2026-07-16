import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PathologyListItem, PathologySearchCriteria } from '../../core/models/pathology.models';

/**
 * Landing page: find a pathology by Path ID, name, code, or category — no
 * full listing is shown up front. Search runs server-side (GET /api/pathologies
 * with query params); there is no client-side caching or filtering.
 */
@Component({
  selector: 'app-pathology-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './pathology-list.html',
  styleUrl: './pathology-list.css',
})
export class PathologyList {
  private readonly api = inject(ApiService);

  searchModel: PathologySearchCriteria = { pathId: '', name: ''};

  readonly results = signal<PathologyListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly validationMsg = signal<string | null>(null);
  /** True once a search has been run, so we can tell "no matches" apart from "haven't searched yet". */
  readonly searched = signal(false);

  onSearch(): void {
    const { pathId, name } = this.searchModel;
    if (![pathId, name].some((v) => v.trim().length > 0)) {
      this.validationMsg.set('Enter at least one search field (Path ID or name).');
      return;
    }
    this.validationMsg.set(null);
    this.error.set(null);
    this.loading.set(true);

    this.api.searchPathologies(this.searchModel).subscribe({
      next: (data) => {
        this.results.set(data);
        this.loading.set(false);
        this.searched.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.searched.set(true);
        this.results.set([]);
        this.error.set('Could not search pathologies. Is the API running?');
      },
    });
  }

  onReset(form: NgForm): void {
    form.resetForm({ pathId: '', name: ''});
    this.results.set([]);
    this.searched.set(false);
    this.validationMsg.set(null);
    this.error.set(null);
  }
}
