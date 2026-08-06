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
import {
  LabPicker,
  LabTemplate,
  CreateTemplateRequest,
  PushTemplateRequest,
  PreviewTemplateRequest,
  PreviewTemplateResponse,
  TemplateTokens,
  TemplateAudit,
} from '../models/template.models';

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

  /** Extend the current license of a pathology (by its path id) by months or to an
   * explicit date; returns the newly issued license. */
  extendLicense(pathId: number, body: ExtendLicenseRequest): Observable<License> {
    return this.http.post<License>(`${this.base}/api/licenses/${pathId}/extend`, body);
  }

  // ── Centralized template management (super admin) ─────────────────────────────

  /** Lists every lab for the admin template picker. */
  listLabs(): Observable<LabPicker[]> {
    return this.http.get<LabPicker[]>(`${this.base}/api/admin/labs`);
  }

  /** All available report templates for a lab. */
  getLabTemplates(pathologyId: number): Observable<LabTemplate[]> {
    return this.http.get<LabTemplate[]>(`${this.base}/api/admin/labs/${pathologyId}/templates`);
  }

  /** A single template (full HTML/CSS) for a lab. */
  getLabTemplate(pathologyId: number, templateId: number): Observable<LabTemplate> {
    return this.http.get<LabTemplate>(
      `${this.base}/api/admin/labs/${pathologyId}/templates/${templateId}`,
    );
  }

  /** Allowed placeholder tokens for report templates. */
  getTemplateTokens(): Observable<TemplateTokens> {
    return this.http.get<TemplateTokens>(`${this.base}/api/admin/templates/tokens`);
  }

  /** Renders a preview with sample data. */
  previewTemplate(body: PreviewTemplateRequest): Observable<PreviewTemplateResponse> {
    return this.http.post<PreviewTemplateResponse>(`${this.base}/api/admin/templates/preview`, body);
  }

  /** Creates a new template in the lab DB. */
  createTemplate(pathologyId: number, body: CreateTemplateRequest): Observable<LabTemplate> {
    return this.http.post<LabTemplate>(`${this.base}/api/admin/labs/${pathologyId}/templates`, body);
  }

  /** Pushes edited template content into the lab DB. */
  pushTemplate(pathologyId: number, body: PushTemplateRequest): Observable<LabTemplate> {
    return this.http.post<LabTemplate>(
      `${this.base}/api/admin/labs/${pathologyId}/templates/push`,
      body,
    );
  }

  /** Sets which template is active for a lab. */
  setActiveTemplate(pathologyId: number, templateId: number): Observable<LabTemplate> {
    return this.http.post<LabTemplate>(
      `${this.base}/api/admin/labs/${pathologyId}/templates/${templateId}/activate`,
      {},
    );
  }

  /** Template change audit history for a lab. */
  getTemplateAudit(pathologyId: number): Observable<TemplateAudit[]> {
    return this.http.get<TemplateAudit[]>(`${this.base}/api/admin/labs/${pathologyId}/templates/audit`);
  }
}
