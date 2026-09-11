/* ─── Roles, as members see them ───
 * One label, colour and icon per role, shared by the Members page and the
 * profile badge. The profile used to work its label out on its own, from two
 * cases instead of three, and called admins "Creator" and creators "Student".
 */

import type { ElementType } from 'react';
import { GraduationCap, PenTool, ShieldCheck } from 'lucide-react';
import type { AcademyUser } from '../types';

export type Role = AcademyUser['role'];

export const ROLE_META: Record<Role, { color: string; icon: ElementType; label: { en: string; ar: string } }> = {
  admin: { color: '#9fef00', icon: ShieldCheck, label: { en: 'Admin', ar: 'مدير' } },
  creator: { color: '#f3a43a', icon: PenTool, label: { en: 'Creator', ar: 'منشئ محتوى' } },
  user: { color: '#62738f', icon: GraduationCap, label: { en: 'Student', ar: 'طالب' } },
};
