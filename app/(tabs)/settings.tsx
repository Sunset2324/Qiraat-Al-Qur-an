import { View, Text, Pressable, ScrollView, Switch, Alert, Modal, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useCallback } from "react";
import {
  ArrowLeft, Moon, Sun, Globe, Headphones, Play, 
  Bell, MapPin, Info, Mail, RotateCcw, X, Check
} from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { clearApiCache } from "../../src/utils/apiCache";
import BatikPattern from "../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../src/hooks/useIsTablet";
import { ARABIC_FONT } from "../../src/constants/fonts";
import { WEBSITE_URL, CONTACT_EMAIL } from "../../src/config";

// Buka tautan (https / mailto) di aplikasi luar; kalau gagal, tampilkan alamatnya
const openLink = async (url: string, title: string, fallbackText: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(title, fallbackText);
  }
};

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { language, setLanguage, t, flip } = useLanguage();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  
  const [adhanNotification, setAdhanNotification] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [backgroundPlay, setBackgroundPlay] = useState(true);
  const [lokasiShalat, setLokasiShalat] = useState<string>("");

  // Lokasi dibaca dari pilihan di layar Jadwal Shalat (satu sumber kebenaran)
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("user_shalat_location")
        .then((s) => {
          const p = s ? JSON.parse(s) : null;
          const kota = p?.kota || p?.kabkota;
          setLokasiShalat(kota && p?.provinsi ? `${kota}, ${p.provinsi}` : "");
        })
        .catch(() => setLokasiShalat(""));
    }, [])
  );
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const SettingItem = ({ icon: Icon, label, value, onPress, rightElement }: any) => (
    <Pressable 
      onPress={onPress} 
      className={`flex-row items-center justify-between border-b ${theme.border} active:opacity-70`}
      style={{ minHeight: isTablet ? 72 : 60 }}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className={`h-10 w-10 rounded-full items-center justify-center ${isDarkMode ? "bg-emerald-900/40" : "bg-emerald-100"}`}>
          <Icon size={20} color={isDarkMode ? "#34d399" : "#047857"} />
        </View>
        <Text 
          className={`${isTablet ? "text-base" : "text-sm"} font-semibold flex-1 ${theme.text}`}
          style={{ writingDirection: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          {label}
        </Text>
      </View>
      {rightElement || (value ? <Text className={`${isTablet ? "text-base" : "text-sm"} ${theme.textMuted}`}>{value}</Text> : null)}
    </Pressable>
  );

  const getLanguageLabel = () => {
    if (language === 'id') return t('indonesian');
    if (language === 'en') return t('english');
    if (language === 'ar') return t('arabic');
    return t('indonesian');
  };

  const languages = [
    { code: 'id', label: t('indonesian'), flag: '🇮🇩' },
    { code: 'en', label: t('english'), flag: '🇬🇧' },
    { code: 'ar', label: t('arabic'), flag: '🇦🇪' },
  ];

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header: batik + kaligrafi */}
      <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 18 }}>
        <BatikPattern width={1200} height={120} cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            className="items-center justify-center rounded-full"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <ArrowLeft size={22} color="#fff" style={flip} />
          </Pressable>
          <View className="flex-1 ml-4">
            <Text className="text-white text-xl font-extrabold">{t('settings')}</Text>
          </View>
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 32, lineHeight: 52, color: "#fde68a" }}>الإعدادات</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={isTablet ? { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", paddingHorizontal: pad - 12 } : undefined}>
        
        {/* THEME & UMUM */}
        <View className={isTablet ? "pt-6" : "px-6 pt-6"} style={isTablet ? { width: "50%", paddingHorizontal: 12 } : undefined}>
          <Text className={`text-xs font-extrabold uppercase tracking-wider mb-3 ml-2 ${theme.textMuted}`}>{t('general')}</Text>
          <View className={`rounded-3xl border ${theme.border} ${theme.bgCard} px-5`}>
            <SettingItem 
              icon={isDarkMode ? Moon : Sun} 
              label={t('darkMode')} 
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#d1d5db", true: "#059669" }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem 
              icon={Globe} 
              label={t('language')} 
              value={getLanguageLabel()} 
              onPress={() => setShowLanguageModal(true)}
            />
          </View>
        </View>

        {/* AUDIO & PEMUTARAN */}
        <View className={isTablet ? "pt-6" : "px-6 pt-6"} style={isTablet ? { width: "50%", paddingHorizontal: 12 } : undefined}>
          <Text className={`text-xs font-extrabold uppercase tracking-wider mb-3 ml-2 ${theme.textMuted}`}>{t('audioPlayback')}</Text>
          <View className={`rounded-3xl border ${theme.border} ${theme.bgCard} px-5`}>
            <SettingItem 
              icon={Play} 
              label={t('autoPlayNext')} 
              rightElement={
                <Switch
                  value={autoPlay}
                  onValueChange={setAutoPlay}
                  trackColor={{ false: "#d1d5db", true: "#059669" }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem 
              icon={Headphones} 
              label={t('playInBackground')} 
              rightElement={
                <Switch
                  value={backgroundPlay}
                  onValueChange={setBackgroundPlay}
                  trackColor={{ false: "#d1d5db", true: "#059669" }}
                  thumbColor="#ffffff"
                />
              }
            />
          </View>
        </View>

        {/* NOTIFIKASI & JADWAL SHALAT */}
        <View className={isTablet ? "pt-6" : "px-6 pt-6"} style={isTablet ? { width: "50%", paddingHorizontal: 12 } : undefined}>
          <Text className={`text-xs font-extrabold uppercase tracking-wider mb-3 ml-2 ${theme.textMuted}`}>{t('notificationPrayer')}</Text>
          <View className={`rounded-3xl border ${theme.border} ${theme.bgCard} px-5`}>
            <SettingItem 
              icon={Bell} 
              label={t('adhanNotification')} 
              rightElement={
                <Switch
                  value={adhanNotification}
                  onValueChange={setAdhanNotification}
                  trackColor={{ false: "#d1d5db", true: "#059669" }}
                  thumbColor="#ffffff"
                />
              }
            />
            <SettingItem 
              icon={MapPin} 
              label={t('prayerLocation')} 
              value={lokasiShalat || t('locationNotSet')}
              onPress={() => router.push('/screen/jadwal-shalat/jadwal-shalat')}
            />
          </View>
        </View>

        {/* TENTANG APLIKASI */}
        <View className={isTablet ? "pt-6 pb-6" : "px-6 pt-6 pb-6"} style={isTablet ? { width: "50%", paddingHorizontal: 12 } : undefined}>
          <Text className={`text-xs font-extrabold uppercase tracking-wider mb-3 ml-2 ${theme.textMuted}`}>{t('about')}</Text>
          <View className={`rounded-3xl border ${theme.border} ${theme.bgCard} px-5`}>
            <SettingItem 
              icon={Info} 
              label={t('appVersion')} 
              value="v1.0.0" 
            />
            <SettingItem 
              icon={RotateCcw} 
              label={t('resetSettings')} 
              onPress={() => {
                setAutoPlay(false);
                setBackgroundPlay(true);
                setAdhanNotification(true);
                clearApiCache();
                Alert.alert(t('success'), t('resetMsg'));
              }}
            />
          </View>
        </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className={`absolute bottom-0 left-0 right-0 ${theme.footerBg || 'bg-emerald-800'} px-6 py-5 overflow-hidden`}>
        <BatikPattern width={1200} height={140} cell={42} opacity={0.12} />
        <Text className="text-white text-center text-sm font-bold mb-3 tracking-wider">{t('aboutUs')}</Text>
        <View className="flex-row items-center justify-center gap-8">
          <Pressable
            className="items-center active:opacity-70"
            accessibilityRole="link"
            accessibilityLabel={t('contactUs')}
            onPress={() => openLink(`mailto:${CONTACT_EMAIL}`, t('contactUs'), `Email: ${CONTACT_EMAIL}`)}
          >
            <View className="bg-white/20 p-3 rounded-full"><Mail size={24} color="#fff" /></View>
          </Pressable>
          <Pressable
            className="items-center active:opacity-70"
            accessibilityRole="link"
            accessibilityLabel={t('website')}
            onPress={() => openLink(WEBSITE_URL, t('https://alqiraat.app/'), WEBSITE_URL)}
          >
            <View className="bg-white/20 p-3 rounded-full"><Globe size={24} color="#fff" /></View>
          </Pressable>
        </View>
      </View>

      {/* MODAL PEMILIHAN BAHASA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className={`w-full rounded-3xl p-6 ${theme.bgCard} border ${theme.border} shadow-lg`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-lg font-bold ${theme.text}`}>{t('selectLanguage')}</Text>
              <Pressable onPress={() => setShowLanguageModal(false)}>
                <X size={24} color={theme.mutedColor} />
              </Pressable>
            </View>
            
            <View className="gap-3">
              {languages.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    setLanguage(lang.code as any);
                    setShowLanguageModal(false);
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-xl border ${
                    language === lang.code ? "border-emerald-500 bg-emerald-500/10" : theme.border
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">{lang.flag}</Text>
                    <Text className={`text-base font-medium ${language === lang.code ? "text-emerald-600 font-bold" : theme.text}`}>
                      {lang.label}
                    </Text>
                  </View>
                  {language === lang.code && (
                    <Check size={20} color="#059669" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}