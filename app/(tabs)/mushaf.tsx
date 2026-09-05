import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
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
      setError("Gagal memuat data surah. Periksa koneksi internet atau backend.");
    } finally {
      setLoading(false);
    }
  };

  const lastReadSurah = surahs[0];
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
        {/* 1. HEADER */}
        <View className="px-6 pt-4 pb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className={`text-[10px] font-bold tracking-[2px] ${theme.textSecondary}`}>
              ASSALAMU'ALAIKUM
            </Text>
            <Text className={`text-2xl font-bold mt-1 leading-tight ${theme.text}`}>
              Mushaf Belajar
            </Text>
          </View>
          <Pressable className={`${theme.bgCard} border ${theme.border} p-2.5 rounded-full active:opacity-80`}>
            <Bell size={20} color={theme.iconColor} />
          </Pressable>
        </View>

        {/* 2. CARD QIRA'AT TERPILIH */}
        <View className="px-6 mb-5">
          <Pressable className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center justify-between active:opacity-90`}>
            <View className="flex-row items-center gap-3 flex-1">
              <View className="bg-emerald-700 p-2 rounded-full">
                <Headphones size={18} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className={`text-[10px] font-medium ${theme.textSecondary}`}>Qira'at terpilih</Text>
                <Text className={`font-bold text-base ${theme.text}`}>Hafs 'an 'Asim</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.iconColor} />
          </Pressable>
        </View>

        {/* 3. CARD LANJUTKAN BELAJAR */}
        {lastReadSurah && (
          <View className="px-6 mb-6">
            <Pressable className={`${theme.bgHeader} rounded-3xl p-5 active:opacity-90`}>
              <Text className={`text-[10px] font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-200"} mb-2`}>
                LANJUTKAN BELAJAR
              </Text>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 pr-4">
                  <Text className="text-2xl font-bold leading-tight text-white">{lastReadSurah.namaLatin}</Text>
                  <Text className={`text-xs mt-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>
                    {lastReadSurah.arti} • {lastReadSurah.jumlahAyat} ayat
                  </Text>
                </View>
                <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-500" : "border-emerald-600"} items-center justify-center`}>
                  <Text className="font-bold text-lg text-white">{lastReadSurah.nomor}</Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>Progress Surah</Text>
                <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-200" : "text-emerald-100"}`}>0 dari {lastReadSurah.jumlahAyat} ayat</Text>
              </View>
              <View className={`h-1.5 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-900/50"} rounded-full overflow-hidden mb-4`}>
                <View className="h-full bg-emerald-400 rounded-full" style={{ width: "0%" }} />
              </View>
              <Pressable className={`${theme.bgCard} rounded-full py-3 flex-row items-center justify-center gap-2 active:opacity-90`}>
                <Text className={`font-bold text-sm ${isDarkMode ? "text-emerald-700" : "text-emerald-800"}`}>Buka Mushaf</Text>
                <ChevronRight size={18} color={isDarkMode ? "#059669" : "#065f46"} />
              </Pressable>
            </Pressable>
          </View>
        )}

        {/* 4. SECTION: 30 JUZ (RESPONSIF) */}
        <View className="mb-6">
          <View className="mb-3 px-6">
            <Text className={`text-[10px] font-bold tracking-[2px] ${theme.textSecondary}`}>PERJALANAN ANDA</Text>
            <Text className={`font-bold text-base mt-0.5 leading-tight ${theme.text}`}>30 Juz Al-Qur'an</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
            {juzList.map((juz) => (
              <Pressable key={juz} className={`w-[120px] ${theme.bgCard} border ${theme.border} rounded-2xl p-4 active:opacity-90`}>
                <View className={`h-7 w-7 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mb-3`}>
                  <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{juz}</Text>
                </View>
                <Text className={`font-bold text-sm ${theme.text} mb-2`}>Juz {juz}</Text>
                <View className={`h-1.5 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} rounded-full overflow-hidden mb-2`}>
                  <View className="h-full bg-emerald-600 rounded-full" style={{ width: "0%" }} />
                </View>
                <Text className={`text-[10px] ${theme.textSecondary}`}>0%</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 5. SECTION: SURAH UNTUK DIPELAJARI (PROFESIONAL & MENAMPILKAN SEMUA 114 SURAH) */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`font-bold text-base ${theme.text}`}>
              Surah untuk dipelajari
            </Text>
            <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
              {surahs.length} Surah
            </Text>
          </View>

          <View className="gap-3">
            {/* Tampilkan semua surah tanpa di-slice */}
            {surahs.map((surah) => (
              <Pressable 
                key={surah.nomor} 
                onPress={() => router.push(`/screen/surah/${surah.nomor}`)} // WAJIB pakai push
                className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center active:opacity-90`}
              >
                {/* 1. Nomor Surah dalam Kotak */}
                <View className={`h-12 w-12 rounded-xl ${isDarkMode ? "bg-emerald-900/50" : "bg-emerald-50"} items-center justify-center mr-4 border ${isDarkMode ? "border-emerald-800" : "border-emerald-200"}`}>
                  <Text className={`text-lg font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                    {surah.nomor}
                  </Text>
                </View>
                
                {/* 2. Informasi Surah */}
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className={`font-bold text-base ${theme.text}`}>
                      {surah.namaLatin}
                    </Text>
                    <Text 
                      className={`text-lg font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`} 
                      style={{ fontFamily: "System" }}
                    >
                      {surah.namaArab}
                    </Text>
                  </View>
                  <Text className={`text-xs ${theme.textSecondary}`}>
                    {surah.arti} • {surah.jumlahAyat} Ayat • {surah.tempatTurun === 'Mekah' ? 'Makkiyah' : 'Madaniyah'}
                  </Text>
                </View>

                {/* 3. Icon Panah */}
                <View className="items-center justify-center ml-2">
                  <ChevronRight size={20} color={isDarkMode ? "#34d399" : "#059669"} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}