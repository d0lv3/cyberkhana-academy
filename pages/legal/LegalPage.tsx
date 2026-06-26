import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import BrandLogo from '../../components/ui/BrandLogo';
import LandingFooter from '../../components/landing/LandingFooter';
import { DISPLAY_FONT_STYLE } from '../../components/landing/displayFont';

const CONTACT = 'support@cyberkhana.tech';

interface Section {
  h: string;
  body: string[];
}
interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

const PRIVACY: Record<'en' | 'ar', LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: June 18, 2026',
    intro:
      'CyberKhana Academy ("we", "us", "our") respects your privacy. This policy explains what we collect, how we use it, and the choices you have when you use academy.cyberkhana.tech (the "Service").',
    sections: [
      {
        h: 'Information We Collect',
        body: [
          'Account information — when you sign in with Google, we receive your name, email address, and profile picture from your Google account.',
          'Profile information — details you choose to add, such as your university, country, and bio.',
          'Learning activity — your progress, completed lessons, points, ranks, and submissions, so we can track your journey and power the leaderboard.',
          'Technical data — a secure, httpOnly authentication cookie to keep you signed in, plus basic logs (such as IP address and browser type) for security.',
        ],
      },
      {
        h: 'How We Use Your Information',
        body: [
          'To operate and personalize the Service, track your progress, and award points and ranks.',
          'To display your name and score on the public leaderboard.',
          'To secure the platform, prevent abuse, and communicate important updates.',
        ],
      },
      {
        h: 'Cookies',
        body: [
          'We use a single essential, httpOnly cookie to keep you authenticated. We do not use advertising or third-party tracking cookies.',
        ],
      },
      {
        h: 'Google Sign-In',
        body: [
          'Authentication is handled through Google. We only request your basic profile and email. Your use of Google sign-in is also governed by Google’s own Privacy Policy.',
        ],
      },
      {
        h: 'How We Share Information',
        body: [
          'We do not sell your personal data. Your display name and score are visible to other users on the leaderboard.',
          'We may share data with service providers (such as hosting) strictly to operate the Service, or when required by law.',
        ],
      },
      {
        h: 'Data Retention',
        body: [
          'We keep your data while your account is active. You may request deletion at any time, after which we remove your personal data except where retention is legally required.',
        ],
      },
      {
        h: 'Your Rights',
        body: [
          'You can access, correct, or delete your information, or request a copy, by contacting us at ' + CONTACT + '.',
        ],
      },
      {
        h: 'Security',
        body: [
          'We protect your data with measures including encrypted connections (HTTPS), httpOnly cookies, rate limiting, and access controls. No system is perfectly secure, but we work hard to safeguard your information.',
        ],
      },
      {
        h: 'Children',
        body: [
          'The Service is intended for university students and adults. It is not directed at children under 13.',
        ],
      },
      {
        h: 'Changes to This Policy',
        body: [
          'We may update this policy from time to time. We will post the updated date at the top of this page.',
        ],
      },
      {
        h: 'Contact',
        body: ['Questions about your privacy? Reach us at ' + CONTACT + '.'],
      },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 18 يونيو 2026',
    intro:
      'تحترم أكاديمية سايبر خانة ("نحن") خصوصيتك. توضّح هذه السياسة ما الذي نجمعه، وكيف نستخدمه، والخيارات المتاحة لك عند استخدامك لموقع academy.cyberkhana.tech ("الخدمة").',
    sections: [
      {
        h: 'المعلومات التي نجمعها',
        body: [
          'معلومات الحساب — عند تسجيل الدخول عبر Google، نستلم اسمك وبريدك الإلكتروني وصورتك من حساب Google الخاص بك.',
          'معلومات الملف الشخصي — التفاصيل التي تختار إضافتها، مثل جامعتك وبلدك ونبذتك التعريفية.',
          'نشاط التعلّم — تقدّمك ودروسك المكتملة ونقاطك ورتبك وإجاباتك، لتتبع رحلتك وتشغيل لوحة المتصدرين.',
          'بيانات تقنية — ملف تعريف ارتباط آمن (httpOnly) لإبقائك مسجّلاً، إضافةً إلى سجلات أساسية (مثل عنوان IP ونوع المتصفح) لأغراض الأمان.',
        ],
      },
      {
        h: 'كيف نستخدم معلوماتك',
        body: [
          'لتشغيل الخدمة وتخصيصها، وتتبع تقدّمك، ومنحك النقاط والرتب.',
          'لعرض اسمك ونتيجتك على لوحة المتصدرين العامة.',
          'لتأمين المنصة، ومنع إساءة الاستخدام، وإبلاغك بالتحديثات المهمة.',
        ],
      },
      {
        h: 'ملفات تعريف الارتباط',
        body: [
          'نستخدم ملف تعريف ارتباط أساسيًا واحدًا (httpOnly) لإبقائك مسجّلاً. لا نستخدم ملفات تتبع إعلانية أو تابعة لجهات خارجية.',
        ],
      },
      {
        h: 'تسجيل الدخول عبر Google',
        body: [
          'تتم المصادقة عبر Google. نطلب فقط ملفك الأساسي وبريدك الإلكتروني. كما يخضع استخدامك لتسجيل الدخول عبر Google لسياسة خصوصية Google.',
        ],
      },
      {
        h: 'كيف نشارك المعلومات',
        body: [
          'نحن لا نبيع بياناتك الشخصية. اسمك المعروض ونتيجتك مرئيان للمستخدمين الآخرين على لوحة المتصدرين.',
          'قد نشارك البيانات مع مزوّدي خدمات (مثل الاستضافة) لتشغيل الخدمة فقط، أو عند الاقتضاء قانونًا.',
        ],
      },
      {
        h: 'الاحتفاظ بالبيانات',
        body: [
          'نحتفظ ببياناتك طالما كان حسابك نشطًا. يمكنك طلب الحذف في أي وقت، وعندها نزيل بياناتك الشخصية إلا حيث يُلزمنا القانون بالاحتفاظ بها.',
        ],
      },
      {
        h: 'حقوقك',
        body: [
          'يمكنك الوصول إلى معلوماتك أو تصحيحها أو حذفها أو طلب نسخة منها بالتواصل معنا عبر ' + CONTACT + '.',
        ],
      },
      {
        h: 'الأمان',
        body: [
          'نحمي بياناتك بإجراءات تشمل الاتصالات المشفّرة (HTTPS) وملفات تعريف ارتباط httpOnly وتحديد المعدّل وضوابط الوصول. لا يوجد نظام آمن تمامًا، لكننا نعمل جاهدين لحماية معلوماتك.',
        ],
      },
      {
        h: 'الأطفال',
        body: ['الخدمة موجّهة لطلاب الجامعات والبالغين، وليست موجّهة للأطفال دون سن 13.'],
      },
      {
        h: 'التغييرات على هذه السياسة',
        body: ['قد نحدّث هذه السياسة من وقت لآخر، وسننشر تاريخ التحديث أعلى هذه الصفحة.'],
      },
      {
        h: 'تواصل معنا',
        body: ['لأي استفسار حول خصوصيتك، تواصل معنا عبر ' + CONTACT + '.'],
      },
    ],
  },
};

const TERMS: Record<'en' | 'ar', LegalDoc> = {
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: June 18, 2026',
    intro:
      'These Terms of Service ("Terms") govern your use of CyberKhana Academy (academy.cyberkhana.tech, the "Service"). By using the Service, you agree to these Terms.',
    sections: [
      {
        h: 'Eligibility',
        body: [
          'You must be at least 13 years old to use the Service. It is built primarily for university students in Iraq and the Arab world.',
        ],
      },
      {
        h: 'Your Account',
        body: [
          'You sign in via Google and are responsible for all activity under your account. Keep your Google account secure.',
        ],
      },
      {
        h: 'Acceptable Use',
        body: [
          'You agree not to: disrupt or attack the platform or its infrastructure; attempt to access other users’ accounts or data; use the interactive labs or tools to target systems you do not own or are not explicitly authorized to test; upload malicious, illegal, or infringing content; or scrape or abuse the Service.',
          'The security skills taught here are for ethical, authorized, and educational purposes only.',
        ],
      },
      {
        h: 'Creator & User Content',
        body: [
          'If you create content (lessons, modules, paths), you keep ownership but grant us a non-exclusive license to host and display it on the Service. You are responsible for your content and must have the rights to it.',
        ],
      },
      {
        h: 'Intellectual Property',
        body: [
          'The Service, its branding, and original content are owned by CyberKhana. You may not copy or redistribute them without permission.',
        ],
      },
      {
        h: 'Educational Disclaimer',
        body: [
          'Content is provided for educational purposes. Labs are sandboxed simulations. We do not guarantee certifications, employment, or specific outcomes.',
        ],
      },
      {
        h: 'No Warranty',
        body: ['The Service is provided "as is" and "as available", without warranties of any kind.'],
      },
      {
        h: 'Limitation of Liability',
        body: [
          'To the maximum extent permitted by law, CyberKhana is not liable for any indirect, incidental, or consequential damages arising from your use of the Service.',
        ],
      },
      {
        h: 'Termination',
        body: [
          'We may suspend or terminate accounts that violate these Terms. You may stop using the Service at any time.',
        ],
      },
      {
        h: 'Governing Law',
        body: ['These Terms are governed by the laws of the Republic of Iraq.'],
      },
      {
        h: 'Changes to These Terms',
        body: ['We may update these Terms. Continued use of the Service means you accept the changes.'],
      },
      {
        h: 'Contact',
        body: ['Questions about these Terms? Reach us at ' + CONTACT + '.'],
      },
    ],
  },
  ar: {
    title: 'شروط الخدمة',
    updated: 'آخر تحديث: 18 يونيو 2026',
    intro:
      'تحكم شروط الخدمة هذه ("الشروط") استخدامك لأكاديمية سايبر خانة (academy.cyberkhana.tech، "الخدمة"). باستخدامك للخدمة، فإنك توافق على هذه الشروط.',
    sections: [
      {
        h: 'الأهلية',
        body: [
          'يجب أن يكون عمرك 13 عامًا على الأقل لاستخدام الخدمة. وهي مصمّمة بشكل أساسي لطلاب الجامعات في العراق والعالم العربي.',
        ],
      },
      {
        h: 'حسابك',
        body: [
          'تسجّل الدخول عبر Google وأنت مسؤول عن جميع الأنشطة التي تتم عبر حسابك. حافظ على أمان حساب Google الخاص بك.',
        ],
      },
      {
        h: 'الاستخدام المقبول',
        body: [
          'توافق على ألا: تعطّل المنصة أو بنيتها التحتية أو تهاجمها؛ أو تحاول الوصول إلى حسابات أو بيانات مستخدمين آخرين؛ أو تستخدم المختبرات أو الأدوات التفاعلية لاستهداف أنظمة لا تملكها أو غير مصرّح لك صراحةً باختبارها؛ أو ترفع محتوى ضارًا أو غير قانوني أو منتهكًا للحقوق؛ أو تسيء استخدام الخدمة.',
          'المهارات الأمنية المقدّمة هنا هي لأغراض أخلاقية ومصرّح بها وتعليمية فقط.',
        ],
      },
      {
        h: 'محتوى المنشئين والمستخدمين',
        body: [
          'إذا أنشأت محتوى (دروسًا أو وحدات أو مسارات)، فإنك تحتفظ بملكيته لكنك تمنحنا ترخيصًا غير حصري لاستضافته وعرضه على الخدمة. أنت مسؤول عن محتواك ويجب أن تمتلك حقوقه.',
        ],
      },
      {
        h: 'الملكية الفكرية',
        body: [
          'الخدمة وعلامتها التجارية ومحتواها الأصلي مملوكة لسايبر خانة. لا يجوز نسخها أو إعادة توزيعها دون إذن.',
        ],
      },
      {
        h: 'إخلاء مسؤولية تعليمي',
        body: [
          'يُقدَّم المحتوى لأغراض تعليمية. المختبرات عبارة عن محاكاة معزولة. لا نضمن أي شهادات أو توظيف أو نتائج محددة.',
        ],
      },
      {
        h: 'إخلاء الضمان',
        body: ['تُقدَّم الخدمة "كما هي" و"حسب توفّرها"، دون أي ضمانات من أي نوع.'],
      },
      {
        h: 'حدود المسؤولية',
        body: [
          'إلى الحد الأقصى الذي يسمح به القانون، لا تتحمّل سايبر خانة المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية ناتجة عن استخدامك للخدمة.',
        ],
      },
      {
        h: 'إنهاء الخدمة',
        body: [
          'يجوز لنا تعليق أو إنهاء الحسابات التي تنتهك هذه الشروط. ويمكنك التوقف عن استخدام الخدمة في أي وقت.',
        ],
      },
      {
        h: 'القانون الحاكم',
        body: ['تخضع هذه الشروط لقوانين جمهورية العراق.'],
      },
      {
        h: 'التغييرات على هذه الشروط',
        body: ['قد نحدّث هذه الشروط. استمرارك في استخدام الخدمة يعني قبولك للتغييرات.'],
      },
      {
        h: 'تواصل معنا',
        body: ['لأي استفسار حول هذه الشروط، تواصل معنا عبر ' + CONTACT + '.'],
      },
    ],
  },
};

const LegalPage: React.FC<{ kind: 'privacy' | 'terms' }> = ({ kind }) => {
  const { lang, setLang } = useLang();
  const doc = (kind === 'privacy' ? PRIVACY : TERMS)[lang];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [kind]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-[#1e293b] bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <BrandLogo variant="full" loading="eager" className="h-8 w-auto max-w-[170px] object-contain" />
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9aa5bf] hover:text-[#9fef00] hover:bg-[#182235] transition-all"
          >
            <Globe size={14} />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-14 md:py-20">
        <article className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#6e7a94] hover:text-[#9fef00] transition-colors mb-8"
          >
            <ArrowLeft size={15} className="rtl:rotate-180" />
            {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to home'}
          </Link>

          <h1
            style={DISPLAY_FONT_STYLE}
            className="text-3xl md:text-4xl font-black tracking-tight text-[#f3f6ff]"
          >
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-[#6e7a94]">{doc.updated}</p>

          <p className="mt-6 text-[#9aa5bf] leading-relaxed">{doc.intro}</p>

          <div className="mt-10 space-y-9">
            {doc.sections.map((s, i) => (
              <section key={i}>
                <h2 className="text-lg font-bold text-[#f3f6ff] mb-3">
                  <span className="text-[#00a859] font-mono text-sm me-2">{String(i + 1).padStart(2, '0')}</span>
                  {s.h}
                </h2>
                <div className="space-y-2.5">
                  {s.body.map((p, j) => (
                    <p key={j} className="text-[#9aa5bf] text-[15px] leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LegalPage;
