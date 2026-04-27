import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'nl' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('profiley-language', lang);
    // Update HTML dir and lang attributes
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('profiley-language') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profile',
    'nav.uploads': 'Uploads',
    'nav.knowledge': 'Knowledge',
    'nav.chatPreview': 'Chat Preview',
    'nav.jobFit': 'Job Fit',
    'nav.settings': 'Settings',
    'nav.viewPublicProfile': 'View Public Profile',
    'nav.signOut': 'Sign Out',
    'nav.language': 'Language',

    // Landing Page
    'landing.hero.badge': 'Your AI-Powered Professional Identity',
    'landing.hero.title': 'Replace Your CV with an',
    'landing.hero.titleHighlight': 'Interactive AI',
    'landing.hero.description': "Let recruiters have real conversations with your AI persona. Get instant job-fit analyses. Stand out with a living, breathing professional profile.",
    'landing.hero.cta': 'Create Your AI Profile',
    'landing.hero.viewExample': 'See Example Profile',
    'landing.features.title': 'Why Profiley?',
    'landing.features.subtitle': 'Go beyond static resumes. Let AI tell your professional story.',
    'landing.feature.aiChat.title': 'AI Conversations',
    'landing.feature.aiChat.description': 'Recruiters chat with your AI persona to learn about your experience, skills, and working style',
    'landing.feature.jobFit.title': 'Instant Job-Fit Analysis',
    'landing.feature.jobFit.description': 'AI analyzes job descriptions against your profile and provides structured fit scores, strengths, and gaps',
    'landing.feature.evidence.title': 'Evidence-Based Answers',
    'landing.feature.evidence.description': 'AI only answers from your uploaded documents and data. No hallucinations, no false claims.',
    'landing.feature.multilingual.title': 'Multilingual Support',
    'landing.feature.multilingual.description': "AI responds in the recruiter's language. Perfect for global job searches and international teams.",
    'landing.feature.privacy.title': 'Privacy-First',
    'landing.feature.privacy.description': "Your data is yours. Control what's public, what's private, and who can access your AI profile.",
    'landing.feature.avatar.title': 'Future: Live AI Avatar',
    'landing.feature.avatar.description': 'Soon: Let your AI avatar join video calls and represent you in real-time conversations with recruiters.',
    'landing.howItWorks.title': 'How It Works',
    'landing.howItWorks.subtitle': 'Three simple steps to create your AI professional identity',
    'landing.step1.title': 'Upload Your Materials',
    'landing.step1.description': 'Add your CV, portfolio, project descriptions, and any other professional documents',
    'landing.step2.title': 'AI Learns Your Profile',
    'landing.step2.description': 'Our AI processes your documents and creates a knowledge base that represents your professional identity',
    'landing.step3.title': 'Share & Connect',
    'landing.step3.description': 'Share your public profile link. Recruiters can chat with your AI and analyze job fit instantly',
    'landing.cta.title': 'Ready to Stand Out?',
    'landing.cta.description': 'Join the future of professional profiles. Create your AI persona today.',
    'landing.cta.button': 'Get Started Free',
    'landing.cta.noCreditCard': 'No credit card required',
    'landing.cta.quickSetup': '5-minute setup',
    'landing.cta.privacyFirst': 'Privacy-first',
    'landing.footer.copyright': '© 2026 Profiley. Your AI-powered professional identity.',
    'landing.nav.signIn': 'Sign In',
    'landing.nav.getStarted': 'Get Started',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': "Welcome back, {name}. Here's what's happening with your AI profile.",
    'dashboard.viewPublicProfile': 'View Public Profile',
    'dashboard.completeProfile': 'Complete Your Profile',
    'dashboard.profileProgress': 'Your profile is {percent}% complete. Upload documents to improve your AI persona.',
    'dashboard.uploadDocuments': 'Upload Documents',
    'dashboard.stats.profileViews': 'Profile Views',
    'dashboard.stats.conversations': 'AI Conversations',
    'dashboard.stats.jobFitAnalyses': 'Job-Fit Analyses',
    'dashboard.stats.engagementRate': 'Engagement Rate',
    'dashboard.stats.fromLastMonth': 'from last month',
    'dashboard.recentActivity': 'Recent Recruiter Activity',
    'dashboard.activitySubtitle': 'Latest interactions with your AI profile',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.quickActionsSubtitle': 'Manage and optimize your profile',
    'dashboard.action.editProfile': 'Edit Profile Information',
    'dashboard.action.uploadDocs': 'Upload New Documents',
    'dashboard.action.testPersona': 'Test AI Persona',
    'dashboard.action.testJobFit': 'Test Job-Fit Analyzer',
    'dashboard.action.configureAI': 'Configure AI Settings',
    'dashboard.knowledgeBase': 'Knowledge Base',
    'dashboard.knowledgeBaseSubtitle': "Your AI's training data at a glance",
    'dashboard.kb.documents': 'Documents',
    'dashboard.kb.chunks': 'Knowledge Chunks',
    'dashboard.kb.processing': 'Processing',
    'dashboard.kb.complete': 'Complete',
    'dashboard.activity.viewed': 'Viewed',
    'dashboard.activity.chatted': 'Chatted',
    'dashboard.activity.jobFit': 'Job Fit',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.upload': 'Upload',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.english': 'English',
    'common.dutch': 'Dutch',
    'common.arabic': 'Arabic',
  },
  nl: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'Profiel',
    'nav.uploads': 'Uploads',
    'nav.knowledge': 'Kennis',
    'nav.chatPreview': 'Chat Voorbeeld',
    'nav.jobFit': 'Functie Match',
    'nav.settings': 'Instellingen',
    'nav.viewPublicProfile': 'Bekijk Openbaar Profiel',
    'nav.signOut': 'Uitloggen',
    'nav.language': 'Taal',

    // Landing Page
    'landing.hero.badge': 'Uw AI-Aangedreven Professionele Identiteit',
    'landing.hero.title': 'Vervang Uw CV met een',
    'landing.hero.titleHighlight': 'Interactieve AI',
    'landing.hero.description': 'Laat recruiters echte gesprekken voeren met uw AI-persona. Krijg directe functie-match analyses. Val op met een levend, ademend professioneel profiel.',
    'landing.hero.cta': 'Maak Uw AI-Profiel',
    'landing.hero.viewExample': 'Bekijk Voorbeeldprofiel',
    'landing.features.title': 'Waarom Profiley?',
    'landing.features.subtitle': 'Ga verder dan statische cv\'s. Laat AI uw professionele verhaal vertellen.',
    'landing.feature.aiChat.title': 'AI Gesprekken',
    'landing.feature.aiChat.description': 'Recruiters chatten met uw AI-persona om meer te weten te komen over uw ervaring, vaardigheden en werkstijl',
    'landing.feature.jobFit.title': 'Directe Functie-Match Analyse',
    'landing.feature.jobFit.description': 'AI analyseert functiebeschrijvingen tegen uw profiel en biedt gestructureerde match-scores, sterke punten en hiaten',
    'landing.feature.evidence.title': 'Bewijs-Gebaseerde Antwoorden',
    'landing.feature.evidence.description': 'AI antwoordt alleen uit uw geüploade documenten en gegevens. Geen hallucinaties, geen valse beweringen.',
    'landing.feature.multilingual.title': 'Meertalige Ondersteuning',
    'landing.feature.multilingual.description': 'AI reageert in de taal van de recruiter. Perfect voor wereldwijde functies en internationale teams.',
    'landing.feature.privacy.title': 'Privacy-First',
    'landing.feature.privacy.description': 'Uw gegevens zijn van u. Bepaal wat openbaar is, wat privé is en wie toegang heeft tot uw AI-profiel.',
    'landing.feature.avatar.title': 'Toekomst: Live AI Avatar',
    'landing.feature.avatar.description': 'Binnenkort: Laat uw AI-avatar deelnemen aan videogesprekken en u vertegenwoordigen in realtime gesprekken met recruiters.',
    'landing.howItWorks.title': 'Hoe Het Werkt',
    'landing.howItWorks.subtitle': 'Drie eenvoudige stappen om uw AI professionele identiteit te creëren',
    'landing.step1.title': 'Upload Uw Materialen',
    'landing.step1.description': 'Voeg uw CV, portfolio, projectbeschrijvingen en andere professionele documenten toe',
    'landing.step2.title': 'AI Leert Uw Profiel',
    'landing.step2.description': 'Onze AI verwerkt uw documenten en creëert een kennisbank die uw professionele identiteit vertegenwoordigt',
    'landing.step3.title': 'Delen & Verbinden',
    'landing.step3.description': 'Deel uw openbare profiellink. Recruiters kunnen chatten met uw AI en direct functie-match analyseren',
    'landing.cta.title': 'Klaar om Op te Vallen?',
    'landing.cta.description': 'Sluit je aan bij de toekomst van professionele profielen. Creëer vandaag nog uw AI-persona.',
    'landing.cta.button': 'Gratis Beginnen',
    'landing.cta.noCreditCard': 'Geen creditcard vereist',
    'landing.cta.quickSetup': '5 minuten setup',
    'landing.cta.privacyFirst': 'Privacy-first',
    'landing.footer.copyright': '© 2026 Profiley. Uw AI-aangedreven professionele identiteit.',
    'landing.nav.signIn': 'Inloggen',
    'landing.nav.getStarted': 'Aan de Slag',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Welkom terug, {name}. Dit is wat er gebeurt met uw AI-profiel.',
    'dashboard.viewPublicProfile': 'Bekijk Openbaar Profiel',
    'dashboard.completeProfile': 'Voltooi Uw Profiel',
    'dashboard.profileProgress': 'Uw profiel is {percent}% compleet. Upload documenten om uw AI-persona te verbeteren.',
    'dashboard.uploadDocuments': 'Upload Documenten',
    'dashboard.stats.profileViews': 'Profielweergaven',
    'dashboard.stats.conversations': 'AI Gesprekken',
    'dashboard.stats.jobFitAnalyses': 'Functie-Match Analyses',
    'dashboard.stats.engagementRate': 'Betrokkenheidsgraad',
    'dashboard.stats.fromLastMonth': 'van vorige maand',
    'dashboard.recentActivity': 'Recente Recruiter Activiteit',
    'dashboard.activitySubtitle': 'Laatste interacties met uw AI-profiel',
    'dashboard.quickActions': 'Snelle Acties',
    'dashboard.quickActionsSubtitle': 'Beheer en optimaliseer uw profiel',
    'dashboard.action.editProfile': 'Bewerk Profielinformatie',
    'dashboard.action.uploadDocs': 'Upload Nieuwe Documenten',
    'dashboard.action.testPersona': 'Test AI-Persona',
    'dashboard.action.testJobFit': 'Test Functie-Match Analysator',
    'dashboard.action.configureAI': 'Configureer AI-Instellingen',
    'dashboard.knowledgeBase': 'Kennisbank',
    'dashboard.knowledgeBaseSubtitle': 'Uw AI-trainingsgegevens in één oogopslag',
    'dashboard.kb.documents': 'Documenten',
    'dashboard.kb.chunks': 'Kennisfragmenten',
    'dashboard.kb.processing': 'Verwerken',
    'dashboard.kb.complete': 'Compleet',
    'dashboard.activity.viewed': 'Bekeken',
    'dashboard.activity.chatted': 'Gechat',
    'dashboard.activity.jobFit': 'Functie Match',

    // Common
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
    'common.delete': 'Verwijderen',
    'common.edit': 'Bewerken',
    'common.upload': 'Uploaden',
    'common.loading': 'Laden...',
    'common.search': 'Zoeken',
    'common.filter': 'Filter',
    'common.actions': 'Acties',
    'common.status': 'Status',
    'common.active': 'Actief',
    'common.inactive': 'Inactief',
    'common.english': 'Engels',
    'common.dutch': 'Nederlands',
    'common.arabic': 'Arabisch',
  },
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.profile': 'الملف الشخصي',
    'nav.uploads': 'التحميلات',
    'nav.knowledge': 'المعرفة',
    'nav.chatPreview': 'معاينة المحادثة',
    'nav.jobFit': 'مطابقة الوظيفة',
    'nav.settings': 'الإعدادات',
    'nav.viewPublicProfile': 'عرض الملف العام',
    'nav.signOut': 'تسجيل الخروج',
    'nav.language': 'اللغة',

    // Landing Page
    'landing.hero.badge': 'هويتك المهنية المدعومة بالذكاء الاصطناعي',
    'landing.hero.title': 'استبدل سيرتك الذاتية بـ',
    'landing.hero.titleHighlight': 'ذكاء اصطناعي تفاعلي',
    'landing.hero.description': 'دع المجندين يجرون محادثات حقيقية مع شخصيتك الذكية. احصل على تحليلات فورية لمطابقة الوظيفة. تميز بملف مهني حي ومتنفس.',
    'landing.hero.cta': 'أنشئ ملفك الذكي',
    'landing.hero.viewExample': 'شاهد ملف تجريبي',
    'landing.features.title': 'لماذا Profiley؟',
    'landing.features.subtitle': 'تجاوز السير الذاتية الثابتة. دع الذكاء الاصطناعي يروي قصتك المهنية.',
    'landing.feature.aiChat.title': 'محادثات ذكية',
    'landing.feature.aiChat.description': 'يتحدث المجندون مع شخصيتك الذكية لمعرفة المزيد عن خبرتك ومهاراتك وأسلوب عملك',
    'landing.feature.jobFit.title': 'تحليل فوري لمطابقة الوظيفة',
    'landing.feature.jobFit.description': 'يحلل الذكاء الاصطناعي الوصف الوظيفي مقابل ملفك الشخصي ويقدم درجات مطابقة منظمة ونقاط القوة والفجوات',
    'landing.feature.evidence.title': 'إجابات مبنية على الأدلة',
    'landing.feature.evidence.description': 'يجيب الذكاء الاصطناعي فقط من المستندات والبيانات المحملة. لا هلوسة، لا ادعاءات كاذبة.',
    'landing.feature.multilingual.title': 'دعم متعدد اللغات',
    'landing.feature.multilingual.description': 'يستجيب الذكاء الاصطناعي بلغة المجند. مثالي للبحث عن وظائف عالمية والفرق الدولية.',
    'landing.feature.privacy.title': 'الخصوصية أولاً',
    'landing.feature.privacy.description': 'بياناتك ملكك. تحكم في ما هو عام وما هو خاص ومن يمكنه الوصول إلى ملفك الذكي.',
    'landing.feature.avatar.title': 'المستقبل: أفاتار ذكي مباشر',
    'landing.feature.avatar.description': 'قريباً: دع أفاتارك الذكي ينضم إلى مكالمات الفيديو ويمثلك في محادثات الوقت الفعلي مع المجندين.',
    'landing.howItWorks.title': 'كيف يعمل',
    'landing.howItWorks.subtitle': 'ثلاث خطوات بسيطة لإنشاء هويتك المهنية الذكية',
    'landing.step1.title': 'حمّل موادك',
    'landing.step1.description': 'أضف سيرتك الذاتية، ومجموعة أعمالك، ووصف مشاريعك، وأي مستندات مهنية أخرى',
    'landing.step2.title': 'يتعلم الذكاء الاصطناعي ملفك',
    'landing.step2.description': 'يعالج ذكاؤنا الاصطناعي مستنداتك وينشئ قاعدة معرفية تمثل هويتك المهنية',
    'landing.step3.title': 'شارك وتواصل',
    'landing.step3.description': 'شارك رابط ملفك العام. يمكن للمجندين الدردشة مع ذكائك الاصطناعي وتحليل مطابقة الوظيفة فوراً',
    'landing.cta.title': 'هل أنت مستعد للتميز؟',
    'landing.cta.description': 'انضم إلى مستقبل الملفات المهنية. أنشئ شخصيتك الذكية اليوم.',
    'landing.cta.button': 'ابدأ مجاناً',
    'landing.cta.noCreditCard': 'لا حاجة لبطاقة ائتمان',
    'landing.cta.quickSetup': 'إعداد في 5 دقائق',
    'landing.cta.privacyFirst': 'الخصوصية أولاً',
    'landing.footer.copyright': '© 2026 Profiley. هويتك المهنية المدعومة بالذكاء الاصطناعي.',
    'landing.nav.signIn': 'تسجيل الدخول',
    'landing.nav.getStarted': 'ابدأ الآن',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.subtitle': 'مرحباً بعودتك، {name}. إليك ما يحدث مع ملفك الذكي.',
    'dashboard.viewPublicProfile': 'عرض الملف العام',
    'dashboard.completeProfile': 'أكمل ملفك الشخصي',
    'dashboard.profileProgress': 'ملفك الشخصي مكتمل بنسبة {percent}%. قم بتحميل المستندات لتحسين شخصيتك الذكية.',
    'dashboard.uploadDocuments': 'تحميل المستندات',
    'dashboard.stats.profileViews': 'مشاهدات الملف',
    'dashboard.stats.conversations': 'محادثات ذكية',
    'dashboard.stats.jobFitAnalyses': 'تحليلات مطابقة الوظيفة',
    'dashboard.stats.engagementRate': 'معدل التفاعل',
    'dashboard.stats.fromLastMonth': 'من الشهر الماضي',
    'dashboard.recentActivity': 'نشاط المجندين الأخير',
    'dashboard.activitySubtitle': 'آخر التفاعلات مع ملفك الذكي',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.quickActionsSubtitle': 'إدارة وتحسين ملفك الشخصي',
    'dashboard.action.editProfile': 'تعديل معلومات الملف',
    'dashboard.action.uploadDocs': 'تحميل مستندات جديدة',
    'dashboard.action.testPersona': 'اختبار الشخصية الذكية',
    'dashboard.action.testJobFit': 'اختبار محلل مطابقة الوظيفة',
    'dashboard.action.configureAI': 'تكوين إعدادات الذكاء الاصطناعي',
    'dashboard.knowledgeBase': 'قاعدة المعرفة',
    'dashboard.knowledgeBaseSubtitle': 'بيانات تدريب الذكاء الاصطناعي لمحة واحدة',
    'dashboard.kb.documents': 'المستندات',
    'dashboard.kb.chunks': 'أجزاء المعرفة',
    'dashboard.kb.processing': 'المعالجة',
    'dashboard.kb.complete': 'مكتمل',
    'dashboard.activity.viewed': 'تمت المشاهدة',
    'dashboard.activity.chatted': 'تمت المحادثة',
    'dashboard.activity.jobFit': 'مطابقة الوظيفة',

    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.upload': 'تحميل',
    'common.loading': 'جاري التحميل...',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.english': 'الإنجليزية',
    'common.dutch': 'الهولندية',
    'common.arabic': 'العربية',
  },
};
