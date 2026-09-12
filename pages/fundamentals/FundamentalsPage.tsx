import React from 'react';
import { GraduationCap } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import FundamentalsRoadmap from '../../components/fundamentals/FundamentalsRoadmap';
import { useLang } from '../../contexts/LangContext';

/* ─── Fundamentals ───
 *
 * A place rather than a list, so it stands on a sky instead of the app's flat
 * ground. The sky itself belongs to AppLayout (see SKIES there): drawn from
 * inside this page it would stop at the layout's padding and again at the
 * content's max width, which is exactly the pair of edges it exists not to
 * have.
 */
const FundamentalsPage: React.FC = () => {
  const { t } = useLang();

  return (
    <div className="space-y-4">
      <PageHeader
        iconNode={<GraduationCap size={38} strokeWidth={1.7} className="flex-shrink-0 text-[#00a859]" />}
        title={t('sidebar.fundamentals')}
      />
      <FundamentalsRoadmap />
    </div>
  );
};

export default FundamentalsPage;
