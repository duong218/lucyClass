import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import vi from './i18n/vi.json';
import zh from './i18n/zh.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
    zh: { translation: zh }
  },
  lng: 'vi',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

const setDocumentLang = (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng || 'vi';
  }
};

setDocumentLang(i18n.language);
i18n.on('languageChanged', setDocumentLang);

export default i18n;
