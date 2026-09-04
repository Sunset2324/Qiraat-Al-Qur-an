import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Headphones, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";

export default function MushafScreen() {
  const { isDarkMode, theme } = useTheme();

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className={`text-[10px] font-bold tracking-[2px] ${theme.textSecondary}`}>
              ASSALAMU'ALAIKUM
            </Text>
            <Text className={`text-2xl font-bold mt-1 leading-tight ${theme.text}`}>
              Mushaf Belajar
            </Text>
          </View>
          <Pressable className={`${theme.bgCard} border ${theme.border} p-2.5 rounded-full`}>
            <Bell size={20} color={theme.iconColor} />
          </Pressable>
        </View>

        {/* Card Qira'at Terpilih */}
        <View className="px-6 mb-5">
          <Pressable className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center justify-between active:opacity-90`}>
            <View className="flex-row items-center gap-3 flex-1">
              <View className="bg-emerald-700 p-2 rounded-full">
                <Headphones size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className={`text-[10px] font-medium ${theme.textSecondary}`}>
                  Qira'at terpilih
                </Text>
                <Text className={`font-bold text-base ${theme.text}`}>
                  Hafs 'an 'Asim
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.iconColor} />
          </Pressable>
        </View>

        {/* Card Lanjutkan Belajar */}
        <View className="px-6 mb-6">
          <Pressable className={`${theme.bgHeader} rounded-3xl p-5 active:opacity-90`}>
            <Text className={`text-[10px] font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-200"} mb-2`}>
              LANJUTKAN BELAJAR
            </Text>

            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 pr-4">
                <Text className={`text-2xl font-bold leading-tight ${isDarkMode ? "text-white" : "text-white"}`}>
                  Al-Fātihah
                </Text>
                <Text className={`text-xs mt-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>
                  Surah pembuka • 7 ayat
                </Text>
              </View>
              <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-500" : "border-emerald-600"} items-center justify-center`}>
                <Text className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-white"}`}>1</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>Progress Surah</Text>
              <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-200" : "text-emerald-100"}`}>
                4 dari 7 ayat
              </Text>
            </View>
            <View className={`h-1.5 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-900/50"} rounded-full overflow-hidden mb-4`}>
              <View className="h-full bg-emerald-400 rounded-full" style={{ width: "57%" }} />
            </View>

            <Pressable className={`${theme.bgCard} rounded-full py-3 flex-row items-center justify-center gap-2 active:opacity-90`}>
              <Text className={`font-bold text-sm ${isDarkMode ? "text-emerald-700" : "text-emerald-800"}`}>
                Buka Mushaf
              </Text>
              <ChevronRight size={18} color={isDarkMode ? "#059669" : "#065f46"} />
            </Pressable>
          </Pressable>
        </View>

        {/* Section: Perjalanan Anda */}
        <View className="mb-6">
          <View className="mb-3 px-6">
            <Text className={`text-[10px] font-bold tracking-[2px] ${theme.textSecondary}`}>
              PERJALANAN ANDA
            </Text>
            <Text className={`font-bold text-base mt-0.5 leading-tight ${theme.text}`}>
              30 Juz Al-Qur'an
            </Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="flex-row gap-3 px-6"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((juz) => (
              <Pressable key={juz} className={`w-[110px] ${theme.bgCard} border ${theme.border} rounded-2xl p-3 active:opacity-90`}>
                <View className={`h-6 w-6 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mb-2`}>
                  <Text className={`text-[10px] font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{juz}</Text>
                </View>
                <Text className={`font-bold text-sm ${theme.text}`}>Juz {juz}</Text>
                <View className={`h-1 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} rounded-full mt-2 overflow-hidden`}>
                  <View className="h-full bg-emerald-600 rounded-full" style={{ width: juz === 1 ? "30%" : juz === 5 ? "15%" : "0%" }} />
                </View>
                <Text className={`text-[10px] mt-1 ${theme.textSecondary}`}>{juz === 1 ? "30%" : juz === 5 ? "15%" : "0%"}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Section: Surah untuk dipelajari */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`font-bold text-base ${theme.text}`}>
              Surah untuk dipelajari
            </Text>
            <Pressable>
              <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>Urutkan</Text>
            </Pressable>
          </View>

          {[
            { no: 1, name: "Al-Fātihah", info: "7 ayat • Pembuka", progress: "80%" },
            { no: 2, name: "Al-Baqarah", info: "286 ayat • Madani", progress: "0%" },
          ].map((surah) => (
            <Pressable key={surah.no} className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center mb-3 active:opacity-90`}>
              <View className={`h-10 w-10 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mr-3`}>
                <Text className={`font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{surah.no}</Text>
              </View>
              <View className="flex-1 pr-2">
                <Text className={`font-bold leading-tight ${theme.text}`}>{surah.name}</Text>
                <Text className={`text-xs mt-0.5 ${theme.textSecondary}`}>{surah.info}</Text>
              </View>
              <View className="items-end">
                <Text className={`font-bold text-sm ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>{surah.progress}</Text>
                <ChevronRight size={18} color={isDarkMode ? "#34d399" : "#059669"} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}