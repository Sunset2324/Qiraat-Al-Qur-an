import { View, Text, Pressable } from "react-native";
import { Star, DoorOpen, Globe } from "lucide-react-native";
import { router } from "expo-router";
import { useTheme } from "../src/context/ThemeContext";

export default function BismillahScreen() {
  const { isDarkMode, theme } = useTheme();

  return (
    <View className={`flex-1 ${theme.bg} px-7 pt-12`}>
      {/* Background Decoration */}
      <View className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        <View className={`absolute -top-20 -right-20 rounded-full border ${theme.border}/30`} style={{ width: 280, height: 280 }} />
        <View className={`absolute top-40 -right-10 rounded-full border ${theme.border}/20`} style={{ width: 180, height: 180 }} />
        <View className={`absolute -top-10 -left-10 rounded-full border ${theme.border}/30`} style={{ width: 200, height: 200 }} />
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className={`rounded-full border ${theme.border} px-4 py-1.5`}>
          <Text className={`text-[11px] font-medium tracking-widest ${isDarkMode ? "text-emerald-400" : "text-emerald-800"}`}>
            QIRA'AT AL-QUR'AN
          </Text>
        </View>
        <View className={`h-9 w-9 items-center justify-center rounded-full border ${isDarkMode ? "border-emerald-500" : "border-emerald-700"}`}>
          <Globe size={18} color={theme.iconColor} />
        </View>
      </View>
      <View className={`mt-4 h-px w-11 self-center ${isDarkMode ? "bg-emerald-600" : "bg-emerald-800"}`} />

      {/* Konten Tengah */}
      <View className="flex-1 items-center justify-center gap-5 px-2">
        <View className={`h-24 w-24 rotate-45 items-center justify-center rounded-[32px] border-2 border-dashed ${isDarkMode ? "border-emerald-500" : "border-emerald-700"} ${theme.bgCard}`}>
          <Star
            size={30}
            color={theme.iconColor}
            style={{ transform: [{ rotate: "-45deg" }] }}
          />
        </View>
        <Text className={`text-center text-xs font-medium tracking-[2px] ${theme.text}`}>
          MULAI DENGAN NAMA ALLAH
        </Text>
        <Text className={`text-center text-3xl leading-[52px] ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <Text className={`max-w-[280px] text-center text-sm leading-6 ${theme.textMuted}`}>
          Temukan ketenangan dalam setiap ayat, pelajari tajwid dengan penuh perhatian.
        </Text>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className={`mt-6 items-center justify-center rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"} p-4 shadow-lg active:opacity-80`}
        >
          <DoorOpen size={36} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}