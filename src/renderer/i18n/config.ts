import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from '../locales/zh-CN.json';
import enUS from '../locales/en-US.json';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
};

// 获取系统语言
const getSystemLanguage = (): string => {
  const systemLang = navigator.language;
  // 支持的语言列表
  const supportedLanguages = ['zh-CN', 'en-US'];
  
  // 精确匹配
  if (supportedLanguages.includes(systemLang)) {
    return systemLang;
  }
  
  // 模糊匹配（例如 zh-TW 匹配到 zh-CN）
  const langPrefix = systemLang.split('-')[0];
  const fuzzyMatch = supportedLanguages.find(lang => lang.startsWith(langPrefix));
  
  return fuzzyMatch || 'zh-CN'; // 默认中文
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('vt-language') || getSystemLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// 监听语言变化并保存到 localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('vt-language', lng);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;

