/* ─── Certificates of achievement, from the browser's side ───
 * Issued by the server for passing a path's final exam
 * (backend/src/routes/certificates.ts). A certificate is a public page: what
 * `verifyCertificate` returns is everything anyone holding its link can see.
 */

import { api } from './api';

/** Everything a certificate shows. Each field was fixed when it was issued. */
export interface CertificateData {
  /** Public verification code, 32 hex characters. */
  code: string;
  name: string;
  username: string | null;
  university: string | null;
  pathTitle: string;
  difficulty: string;
  stepCount: number;
  lessonCount: number;
  hours: number;
  /** The path's steps, by title, as they stood when it was finished. */
  syllabus: string[];
  practical: boolean;
  distinction: boolean;
  pathCompletedAt: string;
  issuedAt: string;
  revoked: boolean;
}

/** A certificate as its holder sees it. */
export interface MyCertificate extends CertificateData {
  scorePercent: number;
  revokedReason: string | null;
}

export interface MyCertificates {
  certificates: MyCertificate[];
  /** Exams passed whose certificate has not been claimed yet. */
  claimable: { pathId: string; pathTitle: string; pathSlug: string }[];
  /** The name printed last time. */
  name: string | null;
}

export const fetchMyCertificates = () => api.get<MyCertificates>('/certificates/mine');

export const claimCertificate = (pathId: string, name: string, showUniversity: boolean) =>
  api.post<{ certificate: CertificateData }>('/certificates/claim', { pathId, name, showUniversity });

export const verifyCertificate = (code: string) =>
  api.get<{ certificate: CertificateData }>(`/certificates/verify/${encodeURIComponent(code)}`);

/** Where a certificate lives. The Academy routes by hash, so the link carries
 *  the page's own address in front of it. */
export const certificateLink = (code: string): string =>
  `${window.location.origin}${window.location.pathname}#/certificates/${code}`;

/** LinkedIn's "add to profile" form, filled in. */
export function linkedInAddUrl(certificate: CertificateData): string {
  const issued = new Date(certificate.issuedAt);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: certificate.pathTitle,
    organizationName: 'CyberKhana Academy',
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: certificateLink(certificate.code),
    certId: certificate.code.toUpperCase(),
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

/* ── Admin ── */

export interface AdminCertificate extends CertificateData {
  userId: string;
  scorePercent: number;
  revokedAt: string | null;
  revokedReason: string | null;
}

export const fetchPathCertificates = (pathId: string, ownerId?: string) =>
  api.get<{ certificates: AdminCertificate[] }>(
    `/certificates/admin?pathId=${encodeURIComponent(pathId)}${ownerId ? `&owner=${encodeURIComponent(ownerId)}` : ''}`
  );

export const revokeCertificate = (code: string, reason: string) =>
  api.post<{ ok: true }>(`/certificates/admin/${code}/revoke`, { reason });

export const restoreCertificate = (code: string) => api.post<{ ok: true }>(`/certificates/admin/${code}/restore`);

export const reissueCertificate = (code: string, name: string) =>
  api.post<{ certificate: CertificateData }>(`/certificates/admin/${code}/reissue`, { name });
