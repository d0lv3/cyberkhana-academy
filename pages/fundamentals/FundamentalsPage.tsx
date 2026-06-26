import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import FundamentalsRoadmap from '../../components/fundamentals/FundamentalsRoadmap';
import { useLang } from '../../contexts/LangContext';

const FundamentalsPage: React.FC = () => {
  const { t, lang } = useLang();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sidebar.fundamentals')}
        subtitle={
          lang === 'ar'
            ? 'رحلة من ثلاث مراحل نحو القمة: الأمن السيبراني.'
            : 'A three-stage journey to the summit: Cybersecurity.'
        }
      />
      <FundamentalsRoadmap />
    </div>
  );
};

export default FundamentalsPage;
