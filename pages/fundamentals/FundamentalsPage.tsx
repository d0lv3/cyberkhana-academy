import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import FundamentalsRoadmap from '../../components/fundamentals/FundamentalsRoadmap';
import { useLang } from '../../contexts/LangContext';

const FundamentalsPage: React.FC = () => {
  const { t } = useLang();

  return (
    // The strapline now lives inside the roadmap itself, which frees the
    // vertical space here for a bigger scene.
    <div className="space-y-4">
      <PageHeader title={t('sidebar.fundamentals')} />
      <FundamentalsRoadmap />
    </div>
  );
};

export default FundamentalsPage;
