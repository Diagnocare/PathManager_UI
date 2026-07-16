import { Component, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { License } from '../../core/models/pathology.models';

/**
 * Presentational card showing a full license, including the raw key.
 * The key is masked by default and only revealed on explicit user action —
 * a small nod to keeping the sensitive value out of casual view.
 */
@Component({
  selector: 'app-license-view',
  imports: [DatePipe],
  templateUrl: './license-view.html',
  styleUrl: './license-view.css',
})
export class LicenseView {
  readonly license = input.required<License>();
  readonly revealed = signal(false);

  statusClass(status: string): string {
    return status.toLowerCase();
  }

  maskedKey(key: string): string {
    if (this.revealed()) return key;
    const last = key.slice(-4);
    return `••••-••••-••••-${last}`;
  }

  toggleReveal(): void {
    this.revealed.update((v) => !v);
  }
}
