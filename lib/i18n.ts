export type Lang = 'en' | 'mr'

const KEY = 'campusscope-language'

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    explore: 'Explore',
    predictor: 'Predictor',
    simulator: 'Simulator',
    documents: 'Documents',
    spotRounds: 'Spot Rounds',
    shortlist: 'My Shortlist',
    counsellors: 'Counsellors',
    compare: 'Compare',
    guides: 'Guides',
    model: 'Model',
    alerts: 'Alerts',
    methodology: 'Methodology',
    about: 'About',
    ask: 'Ask the admissions desk',
    askButton: 'Ask',
    percentile: 'Your Percentile',
    exam: 'Entrance Exam',
    category: 'Category',
    branch: 'Preferred Branch',
    readout: 'Your Readout',
    findMatches: 'Find my colleges',
    heroTitle: 'Choose a college with your eyes open.',
    heroText: 'CampusScope turns official Maharashtra CAP cutoff PDFs into a cited shortlist, an explainable predictor, and a practice option form—one calm place to do your research.',
    browseDirectory: 'Browse the directory',
    startingPoint: 'See your starting point',
    predictorTitle: 'A useful first read, not a promise.',
    predictorText: 'Enter your percentile and preferences to see how your starting point lines up with the catalog. The result is directional—use it to begin research, never as an admissions guarantee.',
    language: 'भाषा',
  },
  mr: {
    explore: 'शोधा',
    predictor: 'भविष्यवाणी',
    simulator: 'सिम्युलेटर',
    documents: 'कागदपत्रे',
    spotRounds: 'स्पॉट राउंड',
    shortlist: 'माझी शॉर्टलिस्ट',
    counsellors: 'सल्लागार',
    compare: 'तुलना',
    guides: 'मार्गदर्शिका',
    model: 'मॉडेल',
    alerts: 'सूचना',
    methodology: 'डेटा पद्धत',
    about: 'आम्ही',
    ask: 'प्रवेशासंबंधी प्रश्न विचारा',
    askButton: 'विचारा',
    percentile: 'तुमचा परसेंटाइल',
    exam: 'प्रवेश परीक्षा',
    category: 'श्रेणी',
    branch: 'पसंतीची शाखा',
    readout: 'तुमचा अंदाज',
    findMatches: 'माझे कॉलेज शोधा',
    heroTitle: 'कॉलेज जाणीवपूर्वक निवडा.',
    heroText: 'कॅंपसस्कोप Maharashtra CAP च्या अधिकृत कटऑफ PDF ला स्रोतासह शॉर्टलिस्ट, समजण्यायोग्य भविष्यवाणी आणि सराव ऑप्शन फॉर्ममध्ये बदलते.',
    browseDirectory: 'डायरेक्टरी पहा',
    startingPoint: 'तुमची सुरुवात पहा',
    predictorTitle: 'उपयुक्त पहिला अंदाज, हमी नाही.',
    predictorText: 'तुमचा परसेंटाइल व पसंती टाका. हा अंदाज केवळ दिशादर्शक आहे—अंतिम निर्णय अधिकृत कागदपत्रांनुसार करा.',
    language: 'Language',
  },
}

export function translate(lang: Lang, key: string): string {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}

export function readLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(KEY)
  return stored === 'mr' ? 'mr' : 'en'
}

export function writeLang(lang: Lang): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, lang)
  document.documentElement.lang = lang === 'mr' ? 'mr' : 'en'
  window.dispatchEvent(new CustomEvent('campusscope:lang', { detail: lang }))
}
