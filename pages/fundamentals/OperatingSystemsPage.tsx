import React from 'react';
import { Monitor } from 'lucide-react';
import CategoryPage from './CategoryPage';
import { getFundamentalsByCategory } from '../../data/fundamentalsData';

const OperatingSystemsPage: React.FC = () => {
  const modules = getFundamentalsByCategory('operating-systems');

  return (
    <CategoryPage
      icon={Monitor}
      iconColor="#f3a43a"
      title={{ en: 'Operating Systems', ar: 'أنظمة التشغيل' }}
      description={{
        en: 'Master Linux and Windows — the operating systems that power cybersecurity.',
        ar: 'أتقن لينكس وويندوز — أنظمة التشغيل التي تدعم الأمن السيبراني.',
      }}
      modules={modules}
    />
  );
};

export default OperatingSystemsPage;
