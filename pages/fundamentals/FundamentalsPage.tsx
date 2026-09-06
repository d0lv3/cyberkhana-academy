import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import FundamentalsRoadmap from '../../components/fundamentals/FundamentalsRoadmap';
import { useLang } from '../../contexts/LangContext';

/* ─── Fundamentals ───
 *
 * The one page in the Academy that is a place rather than a list, so it gets
 * its own sky instead of a panel drawn on the app's. The negative margins
 * reach back through the layout's padding, which is what lets the background
 * run to the edges of the content area; the padding is then put back on the
 * inside so the title and the road keep the page's normal rhythm.
 *
 * The sky wraps the heading too. Starting it below the title would draw a
 * horizontal seam across the page exactly where the eye lands first.
 */
const FundamentalsPage: React.FC = () => {
  const { t } = useLang();

  return (
    <div className="relative -m-4 overflow-hidden sm:-m-6 md:-m-8">
      {/* Desktop only: the mobile view is a stacked list, and a starfield
          behind a list is just a darker list. */}
      <div className="pointer-events-none absolute inset-0 hidden bg-[#0a0f18] md:block" />
      <div
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background:
            'radial-gradient(65vw 45vh at 52% -4%, rgba(0,168,89,0.10), transparent 68%), radial-gradient(45vw 38vh at 6% 62%, rgba(159,239,0,0.045), transparent 66%), radial-gradient(42vw 35vh at 96% 88%, rgba(96,165,250,0.045), transparent 66%)',
        }}
      />

      <div className="relative space-y-4 p-4 sm:p-6 md:p-8">
        <PageHeader title={t('sidebar.fundamentals')} />
        <FundamentalsRoadmap />
      </div>
    </div>
  );
};

export default FundamentalsPage;
