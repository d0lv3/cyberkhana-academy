import React from 'react';
import { Activity, Wifi } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import ModuleCard from '../../components/fundamentals/ModuleCard';
import NetworkingLessonCard from '../../components/fundamentals/NetworkingLessonCard';
import { useLang } from '../../contexts/LangContext';
import { getNetworkingLessons } from '../../data/networking';
import { getFundamentalsByCategory } from '../../data/fundamentalsData';

const NetworkingPage: React.FC = () => {
  const { lang, t } = useLang();
  // Static + published creator-authored lessons (merged), so studio content shows here.
  const lessons = getNetworkingLessons();
  // Standalone modules a creator filed under the Networking category.
  const categoryModules = getFundamentalsByCategory('networking');

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/fundamentals"
        backLabel={t('sidebar.fundamentals')}
        icon={Wifi}
        iconColor="#60a5fa"
        title={lang === 'ar' ? 'الشبكات' : 'Networking'}
        subtitle={
          lang === 'ar'
            ? 'تعلم أساسيات الشبكات من خلال شروحات تفاعلية ومحاكاة مرئية.'
            : 'Learn networking fundamentals through interactive explanations and visual simulations.'
        }
      />

      {/* Lesson cards */}
      {lessons.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={lang === 'ar' ? 'قريبا' : 'Coming Soon'}
          description={
            lang === 'ar'
              ? 'دروس الشبكات قيد التطوير. عد قريبا!'
              : 'Networking lessons are being developed. Check back soon!'
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {lessons.map((lesson, i) => (
            <NetworkingLessonCard key={lesson.id} lesson={lesson} index={i} />
          ))}
        </div>
      )}

      {/* Standalone modules filed under Networking */}
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

export default NetworkingPage;
