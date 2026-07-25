import {
  Component, ViewChild, ElementRef, OnDestroy, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PathologyListItem, PathologySearchCriteria } from '../../core/models/pathology.models';
import { LabTemplate } from '../../core/models/template.models';

/** One entry in the placeholder reference panel. */
interface PlaceholderRef {
  token: string;
  description: string;
  category: string;
}

/**
 * Central super-admin report-template designer. Pick a lab, load one of its existing
 * ReportTemplate rows (or start a new one), edit the HTML/CSS with live preview and
 * placeholder insertion, then push it into the lab's database. Also sets the active template.
 */
@Component({
  selector: 'app-template-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-management.html',
  styleUrl: './template-management.css',
})
export class TemplateManagement implements OnDestroy {
  private readonly api = inject(ApiService);

  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('htmlTextarea') htmlTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('cssTextarea') cssTextarea!: ElementRef<HTMLTextAreaElement>;

  // ── Lab selection ──────────────────────────────────────────────────────────
  searchModel: PathologySearchCriteria = { pathId: '', name: '' };
  readonly results = signal<PathologyListItem[]>([]);
  readonly searched = signal(false);
  selectedLab: PathologyListItem | null = null;

  // ── Template metadata ──────────────────────────────────────────────────────
  templateId: number | null = null;
  templateName = '';
  description = '';
  private loadedDisplayOrder = 0;
  private loadedThumbnail: string | null = null;

  // ── Editor content ─────────────────────────────────────────────────────────
  htmlBody = this.defaultHtmlBody();
  cssStyles = this.defaultCssStyles();

  // ── UI state ───────────────────────────────────────────────────────────────
  activeTab: 'html' | 'css' = 'html';
  isLoading = false;
  isSaving = false;
  isSaved = false;
  isDirty = false;
  autoPreview = true;
  showPlaceholders = false;

  existingTemplates: LabTemplate[] = [];
  loadingTemplates = false;
  selectedLoadId: number | null = null;

  statusMsg = '';
  errorMsg = '';
  unknownTokens: string[] = [];

  readonly placeholders: PlaceholderRef[] = [
    { category: 'Pathology', token: '{{PATHOLOGY_NAME}}', description: 'Lab / pathology centre name' },
    { category: 'Pathology', token: '{{PATHOLOGY_BRANCH}}', description: 'Branch name' },
    { category: 'Pathology', token: '{{PATHOLOGY_ADDRESS}}', description: 'Full address line' },
    { category: 'Pathology', token: '{{PATHOLOGY_CONTACT}}', description: 'Phone number' },
    { category: 'Pathology', token: '{{PATHOLOGY_EMAIL}}', description: 'Email address' },
    { category: 'Pathology', token: '{{PATHOLOGY_LOGO}}', description: '<img> tag with base-64 logo' },
    { category: 'Patient', token: '{{PATIENT_NAME}}', description: 'Full name with salutation' },
    { category: 'Patient', token: '{{PATIENT_ID}}', description: 'Patient registration ID' },
    { category: 'Patient', token: '{{PATIENT_AGE}}', description: 'Age (years)' },
    { category: 'Patient', token: '{{PATIENT_GENDER}}', description: 'Gender' },
    { category: 'Patient', token: '{{PATIENT_DOB}}', description: 'Date of birth' },
    { category: 'Patient', token: '{{PATIENT_CONTACT}}', description: 'Mobile / phone number' },
    { category: 'Patient', token: '{{PATIENT_ADDRESS}}', description: 'Patient address' },
    { category: 'Test', token: '{{TEST_CODE}}', description: 'Short test code, e.g. CBC' },
    { category: 'Test', token: '{{TEST_NAME}}', description: 'Full test name' },
    { category: 'Test', token: '{{REPORT_DATE}}', description: 'Report generation date' },
    { category: 'Test', token: '{{COLLECTION_DATE}}', description: 'Sample collection date' },
    { category: 'Test', token: '{{REFERRED_BY}}', description: 'Referring doctor' },
    { category: 'Test', token: '{{TEST_PARAMETERS_TABLE}}', description: 'Auto-generated HTML table of parameters + results' },
    { category: 'Doctor', token: '{{DOCTOR_NAME}}', description: 'Reporting doctor name' },
    { category: 'Doctor', token: '{{DOCTOR_QUALIFICATION}}', description: 'Qualifications, e.g. MBBS, MD' },
    { category: 'Doctor', token: '{{DOCTOR_SIGNATURE}}', description: '<img> tag with doctor signature' },
    { category: 'CSS', token: '{{CSS_STYLES}}', description: 'Injected CSS — must appear inside a <style> tag in <head>' },
  ];

  get placeholderCategories(): string[] {
    return [...new Set(this.placeholders.map((p) => p.category))];
  }
  placeholdersByCategory(cat: string): PlaceholderRef[] {
    return this.placeholders.filter((p) => p.category === cat);
  }

  private destroy$ = new Subject<void>();
  private previewRefresh$ = new Subject<void>();

  constructor() {
    this.previewRefresh$
      .pipe(debounceTime(600), takeUntil(this.destroy$))
      .subscribe(() => this.refreshPreview());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Lab selection ──────────────────────────────────────────────────────────
  onSearch(): void {
    const { pathId, name } = this.searchModel;
    if (![pathId, name].some((v) => v.trim().length > 0)) {
      this.errorMsg = 'Enter at least one search field (Path ID or name).';
      return;
    }
    this.errorMsg = '';
    this.isLoading = true;
    this.api.searchPathologies(this.searchModel).subscribe({
      next: (rows) => {
        this.results.set(rows);
        this.searched.set(true);
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg = 'Search failed.';
        this.isLoading = false;
      },
    });
  }

  selectLab(lab: PathologyListItem): void {
    this.selectedLab = lab;
    this.resetEditorToDefault();
    this.loadExistingTemplates();
    setTimeout(() => this.refreshPreview(), 0);
  }

  clearLab(): void {
    this.selectedLab = null;
    this.existingTemplates = [];
    this.resetEditorToDefault();
  }

  // ── Loading templates ──────────────────────────────────────────────────────
  loadExistingTemplates(): void {
    if (!this.selectedLab) return;
    this.loadingTemplates = true;
    this.api.getLabTemplates(this.selectedLab.id).subscribe({
      next: (list) => {
        this.existingTemplates = list;
        this.loadingTemplates = false;
      },
      error: () => {
        this.loadingTemplates = false;
      },
    });
  }

  onLoadSelected(): void {
    if (!this.selectedLab || !this.selectedLoadId) return;
    this.isLoading = true;
    this.api.getLabTemplate(this.selectedLab.id, this.selectedLoadId).subscribe({
      next: (t) => {
        this.templateId = t.templateId;
        this.templateName = t.templateName;
        this.description = t.description || '';
        this.htmlBody = t.htmlBody;
        this.cssStyles = t.cssStyles;
        this.loadedDisplayOrder = t.displayOrder;
        this.loadedThumbnail = t.thumbnailBase64;
        this.isLoading = false;
        this.isDirty = false;
        this.isSaved = false;
        this.statusMsg = `Loaded: ${t.templateName}`;
        setTimeout(() => this.refreshPreview(), 0);
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Failed to load template.';
      },
    });
  }

  newTemplate(): void {
    this.selectedLoadId = null;
    this.resetEditorToDefault();
    setTimeout(() => this.refreshPreview(), 0);
  }

  // ── Editing ────────────────────────────────────────────────────────────────
  onContentChange(): void {
    this.isDirty = true;
    this.isSaved = false;
    if (this.autoPreview) this.previewRefresh$.next();
  }

  insertPlaceholder(token: string): void {
    const ref = this.activeTab === 'html' ? this.htmlTextarea : this.cssTextarea;
    const field: 'htmlBody' | 'cssStyles' = this.activeTab === 'html' ? 'htmlBody' : 'cssStyles';

    if (ref?.nativeElement) {
      const el = ref.nativeElement;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      (this as any)[field] = el.value.substring(0, start) + token + el.value.substring(end);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + token.length;
        el.focus();
      }, 0);
    } else {
      (this as any)[field] += token;
    }
    this.onContentChange();
  }

  private buildPreviewDoc(): string {
    const CSS_TOKEN = '{{CSS_STYLES}}';
    const styleBlock = `<style>\n${this.cssStyles}\n</style>`;
    if (this.htmlBody.includes(CSS_TOKEN)) return this.htmlBody.replace(CSS_TOKEN, this.cssStyles);
    if (/<\/head>/i.test(this.htmlBody)) return this.htmlBody.replace(/<\/head>/i, `${styleBlock}\n</head>`);
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" />${styleBlock}</head><body>${this.htmlBody}</body></html>`;
  }

  refreshPreview(): void {
    if (!this.previewFrame?.nativeElement) return;
    this.previewFrame.nativeElement.srcdoc = this.buildPreviewDoc();
  }

  // ── Persist (push to lab DB) ───────────────────────────────────────────────
  save(): void {
    if (!this.selectedLab) return;
    if (!this.templateName.trim()) {
      this.errorMsg = 'Please enter a template name before saving.';
      return;
    }
    this.errorMsg = '';
    this.unknownTokens = [];
    this.isSaving = true;

    const done = (t: LabTemplate) => {
      this.isSaving = false;
      this.isSaved = true;
      this.isDirty = false;
      this.templateId = t.templateId;
      this.statusMsg = `Pushed "${t.templateName}" to ${this.selectedLab!.name}.`;
      this.loadExistingTemplates();
    };
    const fail = (err: any) => {
      this.isSaving = false;
      if (err?.status === 422 && err.error?.unknownTokens) {
        this.unknownTokens = err.error.unknownTokens;
        this.errorMsg = 'Template has unknown tokens — fix them before pushing.';
      } else {
        this.errorMsg = err?.error ?? 'Push failed.';
      }
    };

    if (this.templateId) {
      this.api.pushTemplate(this.selectedLab.id, {
        templateId: this.templateId,
        templateName: this.templateName.trim(),
        description: this.description.trim(),
        htmlBody: this.htmlBody,
        cssStyles: this.cssStyles,
        thumbnailBase64: this.loadedThumbnail,
        displayOrder: this.loadedDisplayOrder,
      }).subscribe({ next: done, error: fail });
    } else {
      this.api.createTemplate(this.selectedLab.id, {
        templateName: this.templateName.trim(),
        description: this.description.trim(),
        htmlBody: this.htmlBody,
        cssStyles: this.cssStyles,
        thumbnailBase64: null,
        displayOrder: 0,
      }).subscribe({ next: done, error: fail });
    }
  }

  setActiveLoaded(): void {
    if (!this.selectedLab || !this.templateId || this.isLoading) return;
    this.isLoading = true;
    this.api.setActiveTemplate(this.selectedLab.id, this.templateId).subscribe({
      next: () => {
        this.isLoading = false;
        this.statusMsg = `"${this.templateName}" is now the active template.`;
        this.loadExistingTemplates();
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg = 'Failed to set active template.';
      },
    });
  }

  /** True while any backend request is in flight — drives the loading overlay. */
  get busy(): boolean {
    return this.isLoading || this.isSaving || this.loadingTemplates;
  }

  private resetEditorToDefault(): void {
    this.templateId = null;
    this.templateName = '';
    this.description = '';
    this.htmlBody = this.defaultHtmlBody();
    this.cssStyles = this.defaultCssStyles();
    this.isDirty = false;
    this.isSaved = false;
    this.statusMsg = '';
    this.errorMsg = '';
    this.unknownTokens = [];
  }

  private defaultHtmlBody(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>{{TEST_NAME}} Report</title>
  <style>
    {{CSS_STYLES}}
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-header">
      <div class="lab-logo">{{PATHOLOGY_LOGO}}</div>
      <div class="lab-info">
        <h1 class="lab-name">{{PATHOLOGY_NAME}}</h1>
        <p class="lab-branch">{{PATHOLOGY_BRANCH}}</p>
        <p class="lab-address">{{PATHOLOGY_ADDRESS}}</p>
        <p class="lab-contact">{{PATHOLOGY_CONTACT}} &nbsp;|&nbsp; {{PATHOLOGY_EMAIL}}</p>
      </div>
    </div>
    <hr class="divider" />
    <div class="patient-section">
      <div class="patient-row">
        <span class="label">Patient Name:</span><span class="value">{{PATIENT_NAME}}</span>
        <span class="label">Patient ID:</span><span class="value">{{PATIENT_ID}}</span>
      </div>
      <div class="patient-row">
        <span class="label">Age:</span><span class="value">{{PATIENT_AGE}}</span>
        <span class="label">Gender:</span><span class="value">{{PATIENT_GENDER}}</span>
      </div>
      <div class="patient-row">
        <span class="label">Collection Date:</span><span class="value">{{COLLECTION_DATE}}</span>
        <span class="label">Report Date:</span><span class="value">{{REPORT_DATE}}</span>
      </div>
    </div>
    <hr class="divider" />
    <div class="test-title"><h2>{{TEST_NAME}} <span class="test-code">({{TEST_CODE}})</span></h2></div>
    <div class="params-section">{{TEST_PARAMETERS_TABLE}}</div>
    <div class="report-footer">
      <div class="signature-block">
        <div class="sig-image">{{DOCTOR_SIGNATURE}}</div>
        <p class="doctor-name">{{DOCTOR_NAME}}</p>
        <p class="doctor-qual">{{DOCTOR_QUALIFICATION}}</p>
        <p class="sig-label">Reporting Doctor</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private defaultCssStyles(): string {
    return `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; }
.report-wrapper { max-width: 800px; margin: 0 auto; padding: 24px; }
.report-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
.lab-name { font-size: 1.4em; font-weight: 700; color: #1d4ed8; }
.lab-branch { font-size: 0.95em; font-weight: 600; color: #374151; }
.lab-address, .lab-contact { font-size: 0.82em; color: #6b7280; margin-top: 2px; }
.divider { border: none; border-top: 2px solid #1d4ed8; margin: 10px 0; }
.patient-section { margin: 12px 0; }
.patient-row { display: flex; gap: 8px; margin-bottom: 4px; }
.label { font-weight: 600; min-width: 130px; color: #374151; }
.value { color: #1e293b; flex: 1; }
.test-title { margin: 14px 0 8px; }
.test-title h2 { font-size: 1.1em; font-weight: 700; color: #1d4ed8; }
.test-code { font-size: 0.85em; color: #6b7280; }
.params-section table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.params-section th { background: #eff6ff; color: #1d4ed8; font-weight: 600; padding: 8px 10px; border: 1px solid #bfdbfe; text-align: left; font-size: 0.85em; }
.params-section td { padding: 7px 10px; border: 1px solid #e2e8f0; font-size: 0.85em; }
.report-footer { margin-top: 32px; display: flex; justify-content: flex-end; }
.signature-block { text-align: center; }
.doctor-name { font-weight: 700; font-size: 0.9em; }
.doctor-qual { font-size: 0.78em; color: #6b7280; }
.sig-label { font-size: 0.75em; color: #94a3b8; margin-top: 2px; }`;
  }
}
