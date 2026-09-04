import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FileText, Mic, Hand, BookOpen, Heart, CloudSun } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../../src/context/ThemeContext";

export default function DashboardScreen() {
  const { isDarkMode, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* HEADER */}
        <View className={`h-[30vh] min-h-[220px] ${theme.bgHeader} rounded-b-[40px] px-6 pt-6 relative overflow-hidden`}>
          <View className={`absolute -right-10 -top-10 h-40 w-40 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-700"} rounded-full opacity-50`} />
          
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className={`text-sm font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>Jakarta, ID</Text>
              <Text className={`text-4xl font-bold mt-1 tracking-tight ${isDarkMode ? "text-white" : "text-white"}`}>{currentTime}</Text>
            </View>
            <View className={`${isDarkMode ? "bg-emerald-800" : "bg-emerald-700/50"} p-3 rounded-2xl`}>
              <CloudSun size={24} color="#fbbf24" />
            </View>
          </View>

          <View className={`${isDarkMode ? "bg-emerald-900/60" : "bg-emerald-700/40"} p-4 rounded-2xl border ${isDarkMode ? "border-emerald-700" : "border-emerald-600/50"} mt-2`}>
            <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>Adzan Terdekat</Text>
            <View className="flex-row items-center justify-between">
              <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-white"}`}>Ashar</Text>
              <Text className={`text-sm ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>15:12 WIB</Text>
            </View>
          </View>
        </View>

        {/* MAIN CONTENT */}
        <View className="flex-1 px-6 -mt-16">
          {/* Tombol Jurnal */}
          <Pressable
            onPress={() => router.push("/journal")}
            className={`${theme.bgCard} rounded-3xl border ${theme.border} py-8 flex-row items-center justify-center gap-3 mb-8 shadow-sm active:opacity-90`}
          >
            <FileText size={28} color={theme.iconColor} />
            <Text className={`font-bold text-lg ${isDarkMode ? "text-gray-100" : "text-[#7a6132]"}`}>Jurnal Kesehatan</Text>
          </Pressable>

          {/* Grid 4 Fitur */}
          <Text className={`font-bold text-lg mb-4 ${theme.text}`}>Eksplorasi Fitur</Text>
          <View className="flex-row flex-wrap justify-between mb-8">
            <Pressable className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center mb-4 shadow-sm active:opacity-90`}>
              <View className={`bg-emerald-500/20 p-3 rounded-full mb-3`}>
                <Mic size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm ${theme.text}`}>Qiraat</Text>
            </Pressable>

            <Pressable className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center mb-4 shadow-sm active:opacity-90`}>
              <View className={`bg-emerald-500/20 p-3 rounded-full mb-3`}>
                <Hand size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm text-center ${theme.text}`}>Dzikir & Doa</Text>
            </Pressable>

            <Pressable className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center shadow-sm active:opacity-90`}>
              <View className={`bg-emerald-500/20 p-3 rounded-full mb-3`}>
                <BookOpen size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm ${theme.text}`}>Tajweed</Text>
            </Pressable>

            <Pressable className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center shadow-sm active:opacity-90`}>
              <View className={`bg-emerald-500/20 p-3 rounded-full mb-3`}>
                <Heart size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm text-center ${theme.text}`}>Thibbun Nabawi</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}