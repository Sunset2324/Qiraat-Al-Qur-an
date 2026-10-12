import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'id' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    settings: 'Pengaturan', general: 'Umum', darkMode: 'Tampilan Gelap (Dark Mode)',
    language: 'Bahasa Aplikasi', audioPlayback: 'Audio & Pemutaran', autoPlayNext: 'Auto-play Ayat Selanjutnya',
    playInBackground: 'Putar di Latar Belakang', notificationPrayer: 'Notifikasi & Shalat', adhanNotification: 'Notifikasi Adzan',
    prayerLocation: 'Lokasi Jadwal Shalat', about: 'Tentang', appVersion: 'Versi Aplikasi', resetSettings: 'Reset Pengaturan',
    aboutUs: 'ABOUT US', contactUs: 'Hubungi Kami', website: 'Website', success: 'Berhasil', resetMsg: 'Pengaturan dan data tersimpan telah direset.',
    selectLanguage: 'Pilih Bahasa', indonesian: 'Bahasa Indonesia', english: 'English', arabic: 'العربية',
  },
  en: {
    settings: 'Settings', general: 'General', darkMode: 'Dark Mode',
    language: 'App Language', audioPlayback: 'Audio & Playback', autoPlayNext: 'Auto-play Next Ayah',
    playInBackground: 'Play in Background', notificationPrayer: 'Notification & Prayer', adhanNotification: 'Adhan Notification',
    prayerLocation: 'Prayer Location', about: 'About', appVersion: 'App Version', resetSettings: 'Reset Settings',
    aboutUs: 'ABOUT US', contactUs: 'Contact Us', website: 'Website', success: 'Success', resetMsg: 'Settings and saved data have been reset.',
    selectLanguage: 'Select Language', indonesian: 'Bahasa Indonesia', english: 'English', arabic: 'العربية',
  },
  ar: {
    settings: 'الإعدادات', general: 'عام', darkMode: 'الوضع الداكن',
    language: 'لغة التطبيق', audioPlayback: 'الصوت والتشغيل', autoPlayNext: 'تشغيل الآية التالية تلقائيًا',
    playInBackground: 'التشغيل في الخلفية', notificationPrayer: 'الإشعارات والصلاة', adhanNotification: 'إشعار الأذان',
    prayerLocation: 'موقع الصلاة', about: 'حول', appVersion: 'إصدار التطبيق', resetSettings: 'إعادة تعيين الإعدادات',
    aboutUs: 'معلومات عنا', contactUs: 'اتصل بنا', website: 'موقع إلكتروني', success: 'نجاح', resetMsg: 'تم إعادة تعيين الإعدادات والبيانات المحفوظة.',
    selectLanguage: 'اختر اللغة', indonesian: 'Bahasa Indonesia', english: 'English', arabic: 'العربية',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem('app_language');
        if (savedLang && ['id', 'en', 'ar'].includes(savedLang)) {
          setLanguageState(savedLang as Language);
        }
      } catch (e) {
        console.error('Gagal memuat bahasa:', e);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('app_language', lang);
    } catch (e) {
      console.error('Gagal menyimpan bahasa:', e);
    }
  };

  const t = (key: string) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};