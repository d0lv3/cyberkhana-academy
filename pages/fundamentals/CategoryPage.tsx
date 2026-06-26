import React from 'react';
import { Layers } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ModuleCard from '../../components/fundamentals/ModuleCard';
import { useLang } from '../../contexts/LangContext';
import { FundamentalModule } from '../../data/fundamentalsData';

interface CategoryPageProps {
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  modules: FundamentalModule[];
  backLabel?: string;
  icon?: React.ElementType;
  iconColor?: string;
}

const CategoryPage: React.FC<CategoryPageProps> = ({
  title,
  description,
  modules,
  backLabel,
  icon,
  iconColor = '#f3a43a',
}) => {
  const { lang, t } = useLang();

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/fundamentals"
        backLabel={backLabel ?? t('sidebar.fundamentals')}
        icon={icon}
        iconColor={iconColor}
        title={title[lang]}
        subtitle={description[lang]}
      />

      {/* Module cards */}
      {modules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={lang === 'ar' ? 'قريباً' : 'Coming Soon'}
          description={lang === 'ar' ? 'هذا القسم قيد التطوير. عد قريباً!' : 'Modules for this section are being developed. Check back soon!'}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {modules.map((mod, i) => (
            <ModuleCard key={mod.id} module={mod} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
