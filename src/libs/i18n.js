/* eslint-disable import/no-named-as-default-member */
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform } from "react-native";
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

if (Platform.OS !== "web" || typeof window !== "undefined") {
  AsyncStorage.getItem(LANGUAGE_KEY)
    .then((saved) => {
      if (saved && supported.includes(saved)) i18n.changeLanguage(saved);
    })
    .catch((error) => console.warn("Language restore failed:", error));
}

export async function setLanguage(code) {
  await i18n.changeLanguage(code);
  await AsyncStorage.setItem(LANGUAGE_KEY, code);
}

export default i18n;
