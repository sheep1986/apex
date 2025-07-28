import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enUS from './locales/en-US/index';
import enGB from './locales/en-GB/index';
import de from './locales/de/index';
import it from './locales/it/index';
import fr from './locales/fr/index';
import es from './locales/es/index';
import ru from './locales/ru/index';
import sr from './locales/sr/index';
import mt from './locales/mt/index';

const resources = {
  'en-US': enUS,
  'en-GB': enGB,
  'de': de,
  'it': it,
  'fr': fr,
  'es': es,
  'ru': ru,
  'sr': sr,
  'mt': mt
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    // Default language
    fallbackLng: 'en-GB',
    
    // Debug mode (set to false in production)
    debug: import.meta.env.DEV,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'apex-language'
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Namespace configuration
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'campaigns', 'settings', 'components', 'navigation', 'crm', 'analytics']
  });

export default i18n;