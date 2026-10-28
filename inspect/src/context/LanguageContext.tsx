import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { I18nManager, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DICT, LANG_INDEX, type Language } from "../i18n/translations";

export type { Language };

type Params = Record<string, string | number>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** t("key") atau t("key", { n: 5 }) */
  t: (key: string, params?: Params) => string;
  /** true bila layout benar-benar RTL (setelah app dibuka ulang di bahasa Arab) */
  isRTL: boolean;
  /** locale untuk tanggal/angka: id-ID | en-US | ar */
  locale: string;
  /** style untuk membalik ikon panah arah (back/next) di layout RTL */
  flip: { transform: { scaleX: number }[] } | undefined;
}

const LOCALES: Record<Language, string> = { id: "id-ID", en: "en-US", ar: "ar" };
const STORAGE_KEY = "app_language";

// Izinkan RTL sejak awal; forceRTL baru berlaku di peluncuran berikutnya.
try {
  I18nManager.allowRTL(true);
} catch {}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("id");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "id" || saved === "en" || saved === "ar") {
          setLanguageState(saved);
          // jaga arah layout sesuai bahasa tersimpan (berlaku di peluncuran berikutnya)
          const wantRTL = saved === "ar";
          if (I18nManager.isRTL !== wantRTL) I18nManager.forceRTL(wantRTL);
        }
      } catch (e) {
        console.error("Gagal memuat bahasa:", e);
      }
    })();
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const row = DICT[key];
      let s = row ? row[LANG_INDEX[language]] || row[1] || row[0] : key;
      if (params) for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(String(params[k]));
      return s;
    },
    [language]
  );

  const setLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error("Gagal menyimpan bahasa:", e);
      }
      const wantRTL = lang === "ar";
      if (I18nManager.isRTL !== wantRTL) {
        I18nManager.forceRTL(wantRTL);
        const row = (k: string) => DICT[k][LANG_INDEX[lang]];
        Alert.alert(row("rtlRestartTitle"), row("rtlRestartMsg"));
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRTL: I18nManager.isRTL,
      locale: LOCALES[language],
      flip: I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
