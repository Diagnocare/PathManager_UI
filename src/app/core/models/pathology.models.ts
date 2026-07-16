/** Row in the pathology list — operational fields only. */
export interface PathologyListItem {
  id: number;
  pathId: string;
  name: string;
}

/** Optional search fields sent to the server; at least one should be non-empty. */
export interface PathologySearchCriteria {
  pathId: string;
  name: string;
}

/** Display-safe license projection: number + expiry + status, never the key. */
export interface LicenseSummary {
  id: number;
  licenseType: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  isExpired: boolean;
  daysRemaining: number;
}

/** Full pathology detail with a display-safe license summary. */
export interface PathologyDetails {
  id: number;
  pathId: string;
  name: string;
  branch: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contactNo: string;
  email: string;
  license?: LicenseSummary | null;
}

/** Full license including the raw key (super-admin view). */
export interface License {
  id: number;
  pathologyId: number;
  licenseType: string;
  licenseKey: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  isExpired: boolean;
  daysRemaining: number;
}

/** Extend request — send exactly one of months or newExpiryDate. */
export interface ExtendLicenseRequest {
  months?: number;
  newExpiryDate?: string;
  licenseType?: string;
}

/** Fields for updating a pathology's details (no license). */
export interface PathologyUpdateRequest {
  name: string;
  branch: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contactNo: string;
  email: string;
}

/** Create request — pathology details plus the license type (drives the initial license). */
export interface PathologyCreateRequest extends PathologyUpdateRequest {
  licenseType: string;
  expiryDate?: string;
}
