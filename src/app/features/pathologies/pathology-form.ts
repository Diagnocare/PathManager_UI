import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { PathologyUpdateRequest } from '../../core/models/pathology.models';

/**
 * Add / edit pathology form.
 *  - Add mode  (route: pathologies/new)      → POST, also captures license type.
 *  - Edit mode (route: pathologies/:id/edit) → PUT details only (license unchanged).
 */
@Component({
  selector: 'app-pathology-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './pathology-form.html',
  styleUrl: './pathology-form.css',
})
export class PathologyForm implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  id: number | null = null;

  model: PathologyUpdateRequest = {
    name: '',branch: '', address1: '', address2: '', city: '', state: '',
    country: '',pincode: '', contactNo: '', email: '',
  };
  licenseType = 'Full';

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  get isEdit(): boolean {
    return this.id !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id = Number(idParam);
    this.loading.set(true);
    this.api.getPathology(this.id).subscribe({
      next: (p) => {
        this.model = {
          name: p.name || '',
          branch: p.branch, address1: p.address1, address2: p.address2 ?? '',
          city: p.city, state: p.state, country: p.country,
          pincode: p.pincode, contactNo: p.contactNo, email: p.email,
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this pathology.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set(null);

    const done = {
      next: (p: { id: number }) => this.router.navigate(['/pathologies', p.id]),
      error: (e: unknown) => this.fail(e),
    };

    if (this.isEdit) {
      this.api.updatePathology(this.id!, this.model).subscribe(done);
    } else {
      this.api.createPathology({ ...this.model, licenseType: this.licenseType }).subscribe(done);
    }
  }

  private fail(e: unknown): void {
    this.saving.set(false);
    const err = e as { error?: unknown };
    this.error.set(typeof err?.error === 'string' ? err.error : 'Save failed. Please try again.');
  }
}
