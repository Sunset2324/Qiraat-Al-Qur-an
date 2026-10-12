import { View, Text, Pressable, ScrollView, Switch, Alert, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import {
  ArrowLeft, Moon, Sun, Globe, Headphones, Volume2, Play, 
  Clock, Bell, MapPin, Info, Phone, Camera, RotateCcw, X, Check
} from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { clearApiCache } from "../../src/utils/apiCache";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [adhanNotification, setAdhanNotification] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [backgroundPlay, setBackgroundPlay] = useState(true);
  const [lokasiShalat, setLokasiShalat] = useState("DKI Jakarta, Jakarta Selatan");
  
  // State untuk Modal Bahasa
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const SettingItem = ({ icon: Icon, label, value, onPress, rightElement }: any) => (
    <Pressable 
      onPress={onPress} 
      className={`flex-row items-center justify-between py-4 border-b ${theme.border} active:opacity-70`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Icon size={20} color={theme.iconColor} />
        <Text className={`text-sm flex-1 ${theme.text}`}>{label}</Text>
      </View>
      {rightElement || (value ? <Text className={`text-sm ${theme.textMuted}`}>{value}</Text> : null)}
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
      {/* Header */}
      <View className={`flex-row items-center justify-center px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="absolute left-6 p-2">
          <ArrowLeft size={22} color={theme.iconColor} />
        </Pressable>
        <Text className={`text-lg font-bold tracking-[2px] ${theme.text}`}>{t('settings').toUpperCase()}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        
        {/* THEME & UMUM */}
        <View className="px-6 pt-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>{t('general')}</Text>
          <View className={`rounded-xl border ${theme.border} ${theme.bgCard} px-4`}>
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
        <View className="px-6 pt-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>{t('audioPlayback')}</Text>
          <View className={`rounded-xl border ${theme.border} ${theme.bgCard} px-4`}>
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
        <View className="px-6 pt-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>{t('notificationPrayer')}</Text>
          <View className={`rounded-xl border ${theme.border} ${theme.bgCard} px-4`}>
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
              value={lokasiShalat}
              onPress={() => Alert.alert("Info", "Fitur pilih lokasi akan segera hadir!")}
            />
          </View>
        </View>

        {/* TENTANG APLIKASI */}
        <View className="px-6 pt-6 pb-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>{t('about')}</Text>
          <View className={`rounded-xl border ${theme.border} ${theme.bgCard} px-4`}>
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
      </ScrollView>

      {/* FOOTER */}
      <View className={`absolute bottom-0 left-0 right-0 ${theme.footerBg || 'bg-emerald-800'} px-6 py-5`}>
        <Text className="text-white text-center text-sm font-bold mb-3 tracking-wider">{t('aboutUs')}</Text>
        <View className="flex-row items-center justify-center gap-8">
          <Pressable className="items-center" onPress={() => Alert.alert(t('contactUs'), "Email: support@qiraat.app")}>
            <View className="bg-white/20 p-3 rounded-full"><Phone size={24} color="#fff" /></View>
          </Pressable>
          <Pressable className="items-center" onPress={() => Alert.alert(t('website'), "https://qiraat.app")}>
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
                <X size={24} color={theme.textMuted} />
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