import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ExtendLicenseRequest, License } from '../../core/models/pathology.models';

type Mode = 'months' | 'date';

/**
 * Extend-license form. Lets the user extend by a number of months or to an
 * explicit date, POSTs to the API, and emits the updated license so the parent
 * can refresh.
 */
@Component({
  selector: 'app-extend-license',
  imports: [FormsModule],
  templateUrl: './extend-license.html',
  styleUrl: './extend-license.css',
})
export class ExtendLicense {
  private readonly api = inject(ApiService);

  /** License id to extend. */
  readonly licenseId = input.required<number>();
  /** Emitted with the updated license on success. */
  readonly extended = output<License>();

  readonly mode = signal<Mode>('months');
  readonly months = signal(12);
  readonly newExpiryDate = signal('');
  readonly licenseType = signal('Full');

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    const body: ExtendLicenseRequest =
      this.mode() === 'months'
        ? { months: Number(this.months()), licenseType: this.licenseType() }
        : { newExpiryDate: this.newExpiryDate(), licenseType: this.licenseType() };

    if (this.mode() === 'date' && !this.newExpiryDate()) {
      this.error.set('Please choose a new expiry date.');
      return;
    }

    this.submitting.set(true);
    this.api.extendLicense(this.licenseId(), body).subscribe({
      next: (updated) => {
        this.submitting.set(false);
        this.success.set(`Extended to ${updated.expiryDate.slice(0, 10)}.`);
        this.extended.emit(updated);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(
          typeof err?.error === 'string' ? err.error : 'Extension failed. Please try again.',
        );
      },
    });
  }
}
