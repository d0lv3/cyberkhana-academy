import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Trophy, ChevronRight } from 'lucide-react';
import EnhancedCard from '../../components/ui/EnhancedCard';
import Button from '../../components/ui/EnhancedButton';
import PageHeader from '../../components/ui/PageHeader';
import { useLang } from '../../contexts/LangContext';
import { getLanguage } from '../../data/programming';

const ProgrammingLanguagePage: React.FC = () => {
  const { langSlug } = useParams<{ langSlug: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();

  const language = getLanguage(langSlug || '');

  if (!language) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#f3f6ff] mb-4">Language not found</h2>
          <Button variant="outline" onClick={() => navigate('/fundamentals/programming')}>
            Back to Programming
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        backTo="/fundamentals/programming"
        backLabel={lang === 'ar' ? 'البرمجة' : 'Programming'}
        title={language.name}
        subtitle={language.description[lang]}
        iconNode={
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{
              backgroundColor: `${language.color}15`,
              border: `1px solid ${language.color}30`,
              color: language.color,
            }}
          >
            {language.name === 'Python' ? 'Py' : language.name === 'C' ? 'C' : '#!'}
          </div>
        }
      />

      {/* Module list */}
      <div className="space-y-4">
        {language.modules.map((mod, modIdx) => {
          const lessonCount = mod.concepts.filter((c) => c.type === 'lesson').length;
          const challengeCount = mod.concepts.filter((c) => c.type === 'challenge').length;
          const firstConceptSlug = mod.concepts[0]?.slug;

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + modIdx * 0.07, duration: 0.4 }}
            >
            <EnhancedCard
              padding="none"
              hoverable
              glowColor="green"
              onClick={() =>
                navigate(
                  `/fundamentals/programming/${langSlug}/${mod.slug}/${firstConceptSlug}`
                )
              }
              className="overflow-hidden group"
            >
              <div className="flex items-center gap-5 p-5">
                {/* Module number */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1a2332] border border-[#263248] flex items-center justify-center">
                  <span className="text-lg font-bold text-[#6e7a94] group-hover:text-[#00a859] transition-colors">
                    {modIdx + 1}
                  </span>
                </div>

                {/* Module info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-[#f3f6ff] group-hover:text-[#00a859] transition-colors">
                    {mod.title[lang]}
                  </h3>
                  <p className="text-sm text-[#9aa5bf] mt-0.5 line-clamp-1">
                    {mod.description[lang]}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-[#6e7a94]">
                      <BookOpen size={12} /> {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                    </span>
                    {challengeCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#f3a43a]">
                        <Trophy size={12} /> {challengeCount} {challengeCount === 1 ? 'challenge' : 'challenges'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Concept preview dots */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {mod.concepts.map((c) => (
                    <span
                      key={c.id}
                      className={`w-2 h-2 rounded-full ${
                        c.type === 'challenge' ? 'bg-[#f3a43a]/40' : 'bg-[#263248]'
                      }`}
                      title={c.title[lang]}
                    />
                  ))}
                </div>

                <ChevronRight
                  size={18}
                  className="text-[#3d4a63] group-hover:text-[#00a859] transition-colors flex-shrink-0"
                />
              </div>
            </EnhancedCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgrammingLanguagePage;
