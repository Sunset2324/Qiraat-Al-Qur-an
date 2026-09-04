import { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Pressable } from 'react-native';
import { BookOpen, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { getDaftarSurah } from '../../src/services/quranService';

export default function MainScreen() {
  const { isDarkMode, theme } = useTheme();
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDaftarSurah();
      setSurahs(data);
    } catch (err) {
      setError('Gagal terhubung ke backend. Pastikan server Node.js sedang berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Tampilan Loading
  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? '#34d399' : '#047857'} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat data dari backend...</Text>
      </View>
    );
  }

  // 2. Tampilan Error
  if (error) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${theme.bg}`}>
        <AlertCircle size={48} color={isDarkMode ? '#f87171' : '#ef4444'} />
        <Text className={`mt-4 text-center font-semibold ${theme.text}`}>{error}</Text>
        <Pressable 
          onPress={loadData} 
          className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-700'}`}
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }

  // 3. Tampilan Utama (FlatList)
  return (
    <View className={`flex-1 ${theme.bg}`}>
      {/* Header Sederhana */}
      <View className={`px-5 pt-12 pb-4 border-b ${theme.border}`}>
        <Text className={`text-2xl font-bold ${theme.text}`}>Daftar Surah</Text>
        <Text className={`text-sm mt-1 ${theme.textMuted}`}>{surahs.length} Surah tersedia</Text>
      </View>

      <FlatList
        data={surahs}
        keyExtractor={(item) => item.nomor.toString()}
        contentContainerClassName="p-4 pb-20"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => router.push(`/surah/${item.nomor}`)} // Nanti arahkan ke detail
            className={`flex-row items-center p-4 mb-3 rounded-2xl border ${theme.border} ${theme.bgCard} shadow-sm active:opacity-80`}
          >
            {/* Nomor */}
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 border ${theme.border} bg-opacity-10`} 
                  style={{ backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(4, 120, 87, 0.1)' }}>
              <Text className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {item.nomor}
              </Text>
            </View>

            {/* Info Latin & Arti */}
            <View className="flex-1">
              <Text className={`text-base font-semibold ${theme.text}`}>{item.namaLatin}</Text>
              <Text className={`text-xs mt-1 ${theme.textMuted}`}>
                {item.arti} • {item.jumlahAyat} Ayat
              </Text>
            </View>

            {/* Nama Arab */}
            <Text className={`text-xl ${isDarkMode ? 'text-emerald-300' : 'text-emerald-800'}`} style={{ fontFamily: 'System' }}>
              {item.nama}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}