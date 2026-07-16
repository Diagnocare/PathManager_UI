import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PathologyListItem,
  PathologySearchCriteria,
  PathologyDetails,
  License,
  LicenseSummary,
  ExtendLicenseRequest,
  PathologyCreateRequest,
  PathologyUpdateRequest,
} from '../models/pathology.models';

/** Single typed gateway to the Pathology Manager API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * Finds pathologies matching the given criteria (server-side, case-insensitive
   * substring match, AND-combined). There is no "get all" — at least one field
   * must be provided, which the caller is expected to enforce.
   */
  searchPathologies(criteria: PathologySearchCriteria): Observable<PathologyListItem[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(criteria)) {
      if (value && value.trim().length > 0) params = params.set(key, value.trim());
    }
    return this.http.get<PathologyListItem[]>(`${this.base}/api/pathologies`, { params });
  }

  getPathology(id: number): Observable<PathologyDetails> {
    return this.http.get<PathologyDetails>(`${this.base}/api/pathologies/${id}`);
  }

  /** Create a pathology + initial license (from license type). */
  createPathology(body: PathologyCreateRequest): Observable<PathologyDetails> {
    return this.http.post<PathologyDetails>(`${this.base}/api/pathologies`, body);
  }

  /** Update a pathology's details (license unchanged). */
  updatePathology(id: number, body: PathologyUpdateRequest): Observable<PathologyDetails> {
    return this.http.put<PathologyDetails>(`${this.base}/api/pathologies/${id}`, body);
  }

  /** Full license incl. key — restricted-view endpoint. */
  getCurrentLicense(pathologyId: number): Observable<License> {
    return this.http.get<License>(`${this.base}/api/pathologies/${pathologyId}/license`);
  }

  /** Full license history (display-safe summaries, newest first). */
  getLicenseHistory(pathologyId: number): Observable<LicenseSummary[]> {
    return this.http.get<LicenseSummary[]>(`${this.base}/api/pathologies/${pathologyId}/licenses`);
  }

  /** Extend a license by months or to an explicit date; returns the updated license. */
  extendLicense(licenseId: number, body: ExtendLicenseRequest): Observable<License> {
    return this.http.post<License>(`${this.base}/api/licenses/${licenseId}/extend`, body);
  }
}
