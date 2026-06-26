import React from 'react';
import { Code } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import ModuleCard from '../../components/fundamentals/ModuleCard';
import LanguageCard from '../../components/fundamentals/LanguageCard';
import { useLang } from '../../contexts/LangContext';
import { getProgrammingLanguages } from '../../data/programming';
import { getFundamentalsByCategory } from '../../data/fundamentalsData';

const ProgrammingPage: React.FC = () => {
  const { lang, t } = useLang();
  // Static + published creator modules/concepts (merged), so counts match the detail page.
  const languages = getProgrammingLanguages();
  // Standalone modules a creator filed under the Programming category.
  const categoryModules = getFundamentalsByCategory('programming');

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/fundamentals"
        backLabel={t('sidebar.fundamentals')}
        icon={Code}
        iconColor="#9fef00"
        title={lang === 'ar' ? 'البرمجة' : 'Programming'}
        subtitle={
          lang === 'ar'
            ? 'اختر لغة برمجة وابدأ التعلم من خلال دروس تفاعلية وتحديات عملية.'
            : 'Choose a programming language and learn through interactive lessons with a built-in coding environment.'
        }
      />

      {/* Language cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {languages.map((language, i) => (
          <LanguageCard key={language.id} language={language} index={i} />
        ))}
      </div>

      {/* Standalone modules filed under Programming */}
      {categoryModules.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#f3f6ff] mb-4">{t('sidebar.modules')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {categoryModules.map((mod, i) => (
              <ModuleCard key={mod.id} module={mod} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProgrammingPage;
