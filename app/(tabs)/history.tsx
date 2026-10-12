import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Clock, BookOpen, Trash2 } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { getHistoryList, type ReadingProgress } from "../../src/utils/readingHistory";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryScreen() {
  const { isDarkMode, theme } = useTheme();
  const [historyList, setHistoryList] = useState<ReadingProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk memuat riwayat dibungkus useCallback agar stabil di dalam useFocusEffect
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getHistoryList();
      setHistoryList(data);
    } catch (e) {
      console.error("Gagal memuat riwayat:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // PERBAIKAN: Gunakan useFocusEffect dengan useCallback, BUKAN useEffect
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Format tanggal yang ramah pengguna
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Hari ini, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return date.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "long", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Hapus riwayat spesifik (opsional, untuk UX yang lebih baik)
  const handleClearHistory = async () => {
    try {
      await AsyncStorage.removeItem("reading_history_list_v2");
      setHistoryList([]);
    } catch (e) {
      console.error("Gagal menghapus riwayat:", e);
    }
  };

  const handleOpenHistory = (item: ReadingProgress) => {
    router.push({
      pathname: '/screen/surah/[nomor]',
      params: { 
        nomor: String(item.surahNomor), 
        mushafId: item.mushafId, 
        ayat: String(item.ayatNomor) 
      }
    });
  };

  const renderHistoryItem = ({ item }: { item: ReadingProgress }) => (
    <Pressable
      onPress={() => handleOpenHistory(item)}
      className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-3 flex-row items-center active:opacity-90`}
    >
      <View className={`h-12 w-12 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"} items-center justify-center mr-4`}>
        <BookOpen size={24} color={isDarkMode ? "#34d399" : "#047857"} />
      </View>
      
      <View className="flex-1">
        <Text className={`text-base font-bold ${theme.text}`}>
          {item.namaLatin} <Text className={`text-sm font-normal ${theme.textMuted}`}>(Ayat {item.ayatNomor})</Text>
        </Text>
        <Text className={`text-xs ${theme.textMuted} mt-1`}>
           {item.mushafName || `Mushaf ${item.mushafId}`}
        </Text>
        <View className="flex-row items-center mt-1">
          <Clock size={10} color={theme.mutedColor} />
          <Text className={`text-[10px] ml-1 ${theme.textMuted}`}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header */}
      <View className={`px-6 pt-6 pb-4 border-b ${theme.border}`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>RIWAYAT AKTIVITAS</Text>
            <Text className={`text-2xl font-bold mt-1 ${theme.text}`}>Terakhir Dibaca</Text>
          </View>
          {historyList.length > 0 && (
            <Pressable onPress={handleClearHistory} className="p-2 rounded-full border border-red-500/30 bg-red-500/10">
              <Trash2 size={18} color="#ef4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Konten */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
          <Text className={`mt-4 ${theme.textMuted}`}>Memuat riwayat...</Text>
        </View>
      ) : historyList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className={`h-20 w-20 rounded-full ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"} items-center justify-center mb-4`}>
            <Clock size={32} color={isDarkMode ? "#34d399" : "#047857"} />
          </View>
          <Text className={`text-lg font-bold text-center ${theme.text}`}>Belum Ada Riwayat</Text>
          <Text className={`text-sm text-center mt-2 ${theme.textMuted}`}>
            Mulailah membaca Al-Qur'an dan tandai ayat terakhir Anda untuk melihatnya di sini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={historyList}
          keyExtractor={(item, index) => `${item.surahNomor}-${item.mushafId}-${index}`}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}