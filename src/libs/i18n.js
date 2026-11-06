/* eslint-disable import/no-named-as-default-member */
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translations from "./translate.json";

export const LANGUAGE_KEY = "@app/language";
export const LANGUAGES = [
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

const supported = LANGUAGES.map((l) => l.code);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    pt: { translation: translations.pt },
    es: { translation: translations.es },
    fr: { translation: translations.fr },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

AsyncStorage.getItem(LANGUAGE_KEY)
  .then((saved) => {
    if (saved && supported.includes(saved)) i18n.changeLanguage(saved);
  })
  .catch(() => {});

export async function setLanguage(code) {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
  } catch {}
}

export default i18n;
