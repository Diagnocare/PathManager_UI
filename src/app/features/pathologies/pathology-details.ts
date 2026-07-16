import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PathologyCacheService } from '../../core/services/pathology-cache.service';
import { PathologyDetails as PathologyDetailsModel, License, LicenseSummary } from '../../core/models/pathology.models';
import { LicenseView } from '../license/license-view';
import { ExtendLicense } from '../license/extend-license';

@Component({
  selector: 'app-pathology-details',
  imports: [RouterLink, LicenseView, ExtendLicense],
  templateUrl: './pathology-details.html',
  styleUrl: './pathology-details.css',
})
export class PathologyDetails implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cache = inject(PathologyCacheService);
  private readonly route = inject(ActivatedRoute);

  private id = 0;

  readonly pathology = signal<PathologyDetailsModel | null>(null);
  readonly license = signal<License | null>(null);
  readonly history = signal<LicenseSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly licenseError = signal<string | null>(null);
  /** True when the currently shown details came from the localStorage cache. */
  readonly fromCache = signal(false);

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));

    // Show cached display-safe details immediately (if fresh), then refresh.
    const cached = this.cache.get(this.id);
    if (cached) {
      this.pathology.set(cached);
      this.fromCache.set(true);
      this.loading.set(false);
    }

    this.loadDetails();
    this.loadHistory();
  }

  loadHistory(): void {
    this.api.getLicenseHistory(this.id).subscribe({
      next: (h) => this.history.set(h),
      error: () => this.history.set([]),
    });
  }

  loadDetails(): void {
    // Only show the full-page spinner when we have nothing cached to display.
    if (!this.pathology()) this.loading.set(true);
    this.error.set(null);
    this.api.getPathology(this.id).subscribe({
      next: (data) => {
        this.pathology.set(data);
        this.cache.set(this.id, data);
        this.fromCache.set(false);
        this.loading.set(false);
      },
      error: () => {
        // Keep any cached copy on screen; only surface an error if we have nothing.
        if (!this.pathology()) this.error.set('Could not load this pathology.');
        this.loading.set(false);
      },
    });
  }

  loadLicense(): void {
    this.licenseError.set(null);
    this.api.getCurrentLicense(this.id).subscribe({
      next: (lic) => this.license.set(lic),
      error: () => this.licenseError.set('No license found, or failed to load it.'),
    });
  }

  /** Joins the address parts, skipping any that are empty. */
  formatAddress(p: PathologyDetailsModel): string {
    const parts = [p.address1, p.address2, p.city, p.state, p.country, p.pincode]
      .map((x) => (x ?? '').trim())
      .filter((x) => x.length > 0);
    return parts.length ? parts.join(', ') : '—';
  }

  onExtended(updated: License): void {
    this.license.set(updated);
    // Refresh the summary at the top and the history list (a new row was added).
    this.loadDetails();
    this.loadHistory();
  }
}
