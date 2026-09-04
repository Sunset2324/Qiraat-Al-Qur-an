import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Headphones, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { getDaftarSurah } from "../../src/services/quranService";

export default function MushafScreen() {
  const { isDarkMode, theme } = useTheme();
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSurahs();
  }, []);

  const loadSurahs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDaftarSurah();
      setSurahs(data);
    } catch (err) {
      setError("Gagal memuat data surah. Pastikan backend berjalan.");
    } finally {
      setLoading(false);
    }
  };

  // Ambil surah pertama sebagai "Lanjutkan Belajar" (default: Al-Fatihah)
  const lastReadSurah = surahs[0];

  // Array statis 30 Juz (API EQuran.id tidak menyediakan endpoint juz)
  const juzList = Array.from({ length: 30 }, (_, i) => i + 1);

  // Loading State
  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={['top']}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat data mushaf...</Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={['top']}>
        <Text className={`text-center font-semibold mb-4 ${theme.text}`}>{error}</Text>
        <Pressable 
          onPress={loadSurahs} 
          className={`px-6 py-3 rounded-full ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-700'}`}
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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

        {/* Card Lanjutkan Belajar - Data dari Backend */}
        {lastReadSurah && (
          <View className="px-6 mb-6">
            <Pressable className={`${theme.bgHeader} rounded-3xl p-5 active:opacity-90`}>
              <Text className={`text-[10px] font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-200"} mb-2`}>
                LANJUTKAN BELAJAR
              </Text>

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 pr-4">
                  <Text className={`text-2xl font-bold leading-tight text-white`}>
                    {lastReadSurah.namaLatin}
                  </Text>
                  <Text className={`text-xs mt-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>
                    {lastReadSurah.arti} • {lastReadSurah.jumlahAyat} ayat
                  </Text>
                </View>
                <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-500" : "border-emerald-600"} items-center justify-center`}>
                  <Text className={`font-bold text-lg text-white`}>{lastReadSurah.nomor}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>Progress Surah</Text>
                <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-200" : "text-emerald-100"}`}>
                  0 dari {lastReadSurah.jumlahAyat} ayat
                </Text>
              </View>
              <View className={`h-1.5 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-900/50"} rounded-full overflow-hidden mb-4`}>
                <View className="h-full bg-emerald-400 rounded-full" style={{ width: "0%" }} />
              </View>

              <Pressable className={`${theme.bgCard} rounded-full py-3 flex-row items-center justify-center gap-2 active:opacity-90`}>
                <Text className={`font-bold text-sm ${isDarkMode ? "text-emerald-700" : "text-emerald-800"}`}>
                  Buka Mushaf
                </Text>
                <ChevronRight size={18} color={isDarkMode ? "#059669" : "#065f46"} />
              </Pressable>
            </Pressable>
          </View>
        )}

        {/* Section: Perjalanan Anda - 30 Juz */}
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
            {juzList.map((juz) => (
              <Pressable key={juz} className={`w-[110px] ${theme.bgCard} border ${theme.border} rounded-2xl p-3 active:opacity-90`}>
                <View className={`h-6 w-6 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mb-2`}>
                  <Text className={`text-[10px] font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{juz}</Text>
                </View>
                <Text className={`font-bold text-sm ${theme.text}`}>Juz {juz}</Text>
                <View className={`h-1 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} rounded-full mt-2 overflow-hidden`}>
                  <View className="h-full bg-emerald-600 rounded-full" style={{ width: "0%" }} />
                </View>
                <Text className={`text-[10px] mt-1 ${theme.textSecondary}`}>0%</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Section: Surah untuk dipelajari - Data dari Backend */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`font-bold text-base ${theme.text}`}>
              Surah untuk dipelajari
            </Text>
            <Pressable>
              <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>Urutkan</Text>
            </Pressable>
          </View>

          {surahs.slice(0, 10).map((surah) => (
            <Pressable key={surah.nomor} className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center mb-3 active:opacity-90`}>
              <View className={`h-10 w-10 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mr-3`}>
                <Text className={`font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{surah.nomor}</Text>
              </View>
              <View className="flex-1 pr-2">
                <Text className={`font-bold leading-tight ${theme.text}`}>{surah.namaLatin}</Text>
                <Text className={`text-xs mt-0.5 ${theme.textSecondary}`}>{surah.jumlahAyat} ayat • {surah.tempatTurun}</Text>
              </View>
              <View className="items-end">
                <Text className={`font-bold text-sm ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>0%</Text>
                <ChevronRight size={18} color={isDarkMode ? "#34d399" : "#059669"} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}