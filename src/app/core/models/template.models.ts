export interface LabPicker {
  id: number;
  pathId: string;
  name: string;
  city: string;
}

/** A report template row (mirrors the lab's ReportTemplate table). */
export interface LabTemplate {
  templateId: number;
  templateName: string;
  description: string;
  htmlBody: string;
  cssStyles: string;
  thumbnailBase64: string | null;
  displayOrder: number;
  isActive: boolean;
  isAvailable: boolean;
  lastModified: string | null;
}

export interface CreateTemplateRequest {
  templateName: string;
  description: string;
  htmlBody: string;
  cssStyles: string;
  thumbnailBase64: string | null;
  displayOrder: number;
}

export interface PushTemplateRequest {
  templateId: number;
  templateName: string;
  description: string;
  htmlBody: string;
  cssStyles: string;
  thumbnailBase64: string | null;
  displayOrder: number;
}

export interface PreviewTemplateRequest {
  htmlBody: string;
  cssStyles: string;
}

export interface PreviewTemplateResponse {
  isValid: boolean;
  unknownTokens: string[];
  renderedHtml: string | null;
}

export interface TemplateTokens {
  allowedTokens: string[];
}

export interface TemplateAudit {
  id: number;
  templateName: string;
  action: string;
  templateId: number;
  changedBy: string;
  changedOnUtc: string;
}
