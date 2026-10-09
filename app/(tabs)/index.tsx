import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BookOpen, Clock, MapPin, ChevronRight, Moon, Sun } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { getJadwalShalat } from "../../src/services/quranService";

export default function HomeScreen() {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const [jadwal, setJadwal] = useState<any>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJadwal = async () => {
    try {
      setLoadingJadwal(true);
      const now = new Date();
      // Default lokasi: DKI Jakarta, Jakarta Selatan
      const data = await getJadwalShalat('DKI Jakarta', 'Jakarta Selatan', now.getMonth() + 1, now.getFullYear());
      
      const today = now.getDate();
      const todaySchedule = data.find((item: any) => parseInt(item.tanggal.split('-')[2]) === today);
      setJadwal(todaySchedule);
    } catch (err) {
      console.error("Gagal memuat jadwal shalat:", err);
    } finally {
      setLoadingJadwal(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJadwal();
  };

  const waktuShalat = jadwal ? [
    { nama: 'Subuh', waktu: jadwal.subuh },
    { nama: 'Dzuhur', waktu: jadwal.dzuhur },
    { nama: 'Ashar', waktu: jadwal.ashar },
    { nama: 'Maghrib', waktu: jadwal.maghrib },
    { nama: 'Isya', waktu: jadwal.isya },
  ] : [];

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.iconColor} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <View className={`px-6 pt-4 pb-6 flex-row items-center justify-between`}>
          <View>
            <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>ASSALAMU'ALAIKUM</Text>
            <Text className={`text-2xl font-bold ${theme.text} mt-1`}>Qiraat Al-Qur'an</Text>
          </View>
          <Pressable onPress={toggleTheme} className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {isDarkMode ? <Moon size={20} color={theme.iconColor} /> : <Sun size={20} color={theme.iconColor} />}
          </Pressable>
        </View>

        {/* WIDGET JADWAL SHALAT */}
        <View className="px-6 mb-6">
          <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} shadow-sm`}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Clock size={20} color={isDarkMode ? '#34d399' : '#047857'} />
                <Text className={`text-base font-bold ${theme.text}`}>Jadwal Shalat Hari Ini</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={theme.textMuted} />
                <Text className={`text-xs ${theme.textMuted}`}>Jakarta Selatan</Text>
              </View>
            </View>

            {loadingJadwal ? (
              <View className="items-center py-4">
                <ActivityIndicator size="small" color={theme.iconColor} />
                <Text className={`mt-2 text-xs ${theme.textMuted}`}>Memuat jadwal...</Text>
              </View>
            ) : jadwal ? (
              <View className="space-y-3">
                {waktuShalat.map((shalat, index) => (
                  <View key={shalat.nama} className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <Text className={`text-sm font-medium ${theme.text}`}>{shalat.nama}</Text>
                    <Text className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {shalat.waktu}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className={`text-sm text-center py-4 ${theme.textMuted}`}>Gagal memuat jadwal shalat.</Text>
            )}
          </View>
        </View>

        {/* MENU CEPAT */}
        <View className="px-6">
          <Text className={`text-base font-bold mb-4 ${theme.text}`}>Menu Utama</Text>
          
          <Pressable 
            onPress={() => router.push('/screen/surah/1')} // Contoh: langsung ke Al-Fatihah atau daftar surah
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-4 active:opacity-80`}
          >
            <View className="flex-row items-center gap-4">
              <View className={`p-3 rounded-xl ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                <BookOpen size={24} color={isDarkMode ? '#34d399' : '#047857'} />
              </View>
              <View>
                <Text className={`text-base font-bold ${theme.text}`}>Mulai Membaca</Text>
                <Text className={`text-xs ${theme.textMuted} mt-1`}>Lanjutkan dari Al-Fatihah</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </Pressable>

          <Pressable 
            onPress={() => router.push('/screen/dzikir-doa')} 
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-80`}
          >
            <View className="flex-row items-center gap-4">
              <View className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <Clock size={24} color={isDarkMode ? '#60a5fa' : '#2563eb'} />
              </View>
              <View>
                <Text className={`text-base font-bold ${theme.text}`}>Doa & Dzikir</Text>
                <Text className={`text-xs ${theme.textMuted} mt-1`}>Kumpulan doa harian</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}