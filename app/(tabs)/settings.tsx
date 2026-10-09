import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import {
  ArrowLeft, Moon, Sun, Globe, Headphones, Volume2, Play, 
  Clock, Bell, MapPin, Info, Phone, Camera, RotateCcw
} from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  
  const [adhanNotification, setAdhanNotification] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [backgroundPlay, setBackgroundPlay] = useState(true);
  const [lokasiShalat, setLokasiShalat] = useState("DKI Jakarta, Jakarta Selatan");

  const SettingItem = ({ icon: Icon, label, value, onPress, rightElement }: any) => (
    <Pressable 
      onPress={onPress} 
      className={`flex-row items-center justify-between py-4 border-b ${theme.border}`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Icon size={20} color={theme.iconColor} />
        <Text className={`text-sm flex-1 ${theme.text}`}>{label}</Text>
      </View>
      {rightElement || (value ? <Text className={`text-sm ${theme.textMuted}`}>{value}</Text> : null)}
    </Pressable>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header */}
      <View className={`flex-row items-center justify-center px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="absolute left-6 p-2">
          <ArrowLeft size={22} color={theme.iconColor} />
        </Pressable>
        <Text className={`text-lg font-bold tracking-[2px] ${theme.text}`}>SETTINGS</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        
        {/* THEME & UMUM */}
        <View className="px-6 pt-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>Umum</Text>
          <View className={`bg-opacity-50 rounded-xl px-4`}>
            <SettingItem 
              icon={isDarkMode ? Moon : Sun} 
              label="Tampilan Gelap (Dark Mode)" 
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
              label="Bahasa Aplikasi" 
              value="Indonesia" 
              onPress={() => Alert.alert("Info", "Fitur multi-bahasa akan segera hadir!")}
            />
          </View>
        </View>

        {/* AUDIO & PEMUTARAN */}
        <View className="px-6 pt-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>Audio & Pemutaran</Text>
          <View className={`bg-opacity-50 rounded-xl px-4`}>
            <SettingItem 
              icon={Play} 
              label="Auto-play Ayat Selanjutnya" 
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
              label="Putar di Latar Belakang" 
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
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>Notifikasi & Shalat</Text>
          <View className={`bg-opacity-50 rounded-xl px-4`}>
            <SettingItem 
              icon={Bell} 
              label="Notifikasi Adzan" 
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
              label="Lokasi Jadwal Shalat" 
              value={lokasiShalat}
              onPress={() => Alert.alert("Info", "Fitur pilih lokasi akan segera hadir!")}
            />
          </View>
        </View>

        {/* TENTANG APLIKASI */}
        <View className="px-6 pt-6 pb-6">
          <Text className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme.textMuted}`}>Tentang</Text>
          <View className={`bg-opacity-50 rounded-xl px-4`}>
            <SettingItem 
              icon={Info} 
              label="Versi Aplikasi" 
              value="v1.0.0" 
            />
            <SettingItem 
              icon={RotateCcw} 
              label="Reset Pengaturan" 
              onPress={() => {
                setAutoPlay(false);
                setBackgroundPlay(true);
                setAdhanNotification(true);
                Alert.alert("Berhasil", "Pengaturan telah direset ke default.");
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View className={`absolute bottom-0 left-0 right-0 ${theme.footerBg || 'bg-emerald-800'} px-6 py-5`}>
        <Text className="text-white text-center text-sm font-bold mb-3 tracking-wider">ABOUT US</Text>
        <View className="flex-row items-center justify-center gap-8">
          <Pressable className="items-center" onPress={() => Alert.alert("Hubungi Kami", "Email: support@qiraat.app")}>
            <View className="bg-white/20 p-3 rounded-full"><Phone size={24} color="#fff" /></View>
          </Pressable>
          <Pressable className="items-center" onPress={() => Alert.alert("Website", "https://qiraat.app")}>
            <View className="bg-white/20 p-3 rounded-full"><Globe size={24} color="#fff" /></View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}