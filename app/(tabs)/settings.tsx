import { View, Text, Pressable, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState } from "react";
import {
  ArrowLeft, Moon, Sun, Globe, Headphones, Palette, Type, Layout,
  Clock, Bell, Volume2, Play, Zap, Circle, Database, RotateCcw,
  Info, Phone, Camera,
} from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext"; // Import useTheme

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme, theme } = useTheme(); // Ganti state lokal dengan context
  
  const [adhanNotification, setAdhanNotification] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [backgroundPlay, setBackgroundPlay] = useState(true);

  // Hapus definisi `theme` lokal, karena sudah dari context

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
        {/* THEME SECTION */}
        <View className="px-6 pt-6 pb-2">
          <Text className={`text-base font-bold mb-3 ${theme.text}`}>Theme</Text>
          
          <View className={`border-b ${theme.border} pb-3`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                {isDarkMode ? <Moon size={20} color={theme.iconColor} /> : <Sun size={20} color={theme.iconColor} />}
                <Text className={`text-sm ${theme.text}`}>Light/Dark:</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme} // Panggil toggleTheme dari context
                trackColor={{ false: "#dccb9c", true: "#059669" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View className={`border-b ${theme.border} py-3`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Globe size={20} color={theme.iconColor} />
                <Text className={`text-sm ${theme.text}`}>Language:</Text>
              </View>
              <Text className={`text-sm ${theme.textMuted}`}>English</Text>
            </View>
          </View>
        </View>

        {/* ... (sisanya sama seperti sebelumnya, cukup ganti warna dengan `theme.xxx`) ... */}
      </ScrollView>

      {/* FOOTER */}
      <View className={`absolute bottom-0 left-0 right-0 ${theme.footerBg} px-6 py-5`}>
        <Text className="text-white text-center text-sm font-bold mb-3 tracking-wider">ABOUT US</Text>
        <View className="flex-row items-center justify-center gap-8">
          <Pressable className="items-center">
            <View className="bg-white/20 p-3 rounded-full"><Phone size={24} color="#fff" /></View>
          </Pressable>
          <Pressable className="items-center">
            <View className="bg-white/20 p-3 rounded-full"><Camera size={24} color="#fff" /></View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}