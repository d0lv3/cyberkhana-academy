import { Code2, GraduationCap, Layers, Network, Route } from 'lucide-react';
import type { JourneyTarget } from '../../services/journeyService';

/** What each kind of stop is called and what colour it carries, so a card
 *  about a networking lesson looks like networking everywhere it appears. */
export const TARGET_META: Record<
  JourneyTarget['kind'],
  { icon: React.ElementType; color: string; label: { en: string; ar: string } }
> = {
  programming: { icon: Code2, color: '#9fef00', label: { en: 'Programming', ar: 'البرمجة' } },
  networking: { icon: Network, color: '#60a5fa', label: { en: 'Networking', ar: 'الشبكات' } },
  module: { icon: Layers, color: '#00a859', label: { en: 'Module', ar: 'وحدة' } },
  path: { icon: Route, color: '#a78bfa', label: { en: 'Career path', ar: 'مسار مهني' } },
  fundamentals: { icon: GraduationCap, color: '#00a859', label: { en: 'Fundamentals', ar: 'الأساسيات' } },
};
