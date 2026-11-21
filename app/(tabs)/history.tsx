import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Clock, Trash2 } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { getHistoryList, type ReadingProgress } from "../../src/utils/readingHistory";
import BatikPattern from "../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../src/hooks/useIsTablet";
import TabHeader from "../../src/components/ui/TabHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, locale } = useLanguage();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  const cols = isTablet ? 2 : 1;
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
      return t("todayAt", { time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` });
    }
    
    return date.toLocaleDateString(locale, { 
      day: "numeric", 
      month: "long", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Hapus semua riwayat; minta konfirmasi dulu karena tidak bisa dibatalkan
  const handleClearHistory = () => {
    Alert.alert(t("clearHistoryTitle"), t("clearHistoryMsg"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("clearHistoryConfirm"), style: "destructive", onPress: doClearHistory },
    ]);
  };

  const doClearHistory = async () => {
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

  const renderHistoryItem = ({ item }: { item: ReadingProgress }) => {
    const pct = item.totalAyat ? Math.min(100, Math.round((item.ayatNomor / item.totalAyat) * 100)) : 0;
    return (
      <View style={{ flex: 1 / cols, padding: cols > 1 ? 6 : 0, marginBottom: cols > 1 ? 0 : 12 }}>
        <Pressable
          onPress={() => handleOpenHistory(item)}
          accessibilityRole="button"
          accessibilityLabel={`${item.namaLatin}, ${t("ayahN", { n: item.ayatNomor })}`}
          className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
          style={{ minHeight: 104 }}
        >
          <View className="flex-row items-center">
            {/* nomor surah dalam belah ketupat, selaras motif batik */}
            <View
              style={{ width: 44, height: 44, borderRadius: 12, transform: [{ rotate: "45deg" }], marginHorizontal: 6, marginRight: 18 }}
              className={`items-center justify-center ${isDarkMode ? "bg-emerald-800" : "bg-emerald-700"}`}
            >
              <Text style={{ transform: [{ rotate: "-45deg" }] }} className="text-white text-base font-extrabold">
                {item.surahNomor}
              </Text>
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className={`text-lg font-extrabold ${theme.text}`}>{item.namaLatin}</Text>
              <Text className={`text-sm ${theme.textSecondary}`}>
                {t("ayahN", { n: item.ayatNomor })}{item.totalAyat ? ` / ${item.totalAyat}` : ""}
              </Text>
              <Text numberOfLines={1} className={`text-xs mt-0.5 ${theme.textMuted}`}>
                {item.mushafName || t("mushafN", { n: item.mushafId })}
              </Text>
            </View>
          </View>
          {!!item.totalAyat && (
            <View className={`h-2 rounded-full mt-3 ${isDarkMode ? "bg-gray-700" : "bg-[#e9dfc2]"}`}>
              <View className="h-2 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
            </View>
          )}
          <View className="flex-row items-center mt-2">
            <Clock size={12} color={theme.mutedColor} />
            <Text className={`text-xs ml-1.5 ${theme.textMuted}`}>{formatDate(item.timestamp)}</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header ringkas: batik + kaligrafi */}
      <TabHeader
        tag={t("activityHistory")}
        title={t("lastReadTitle")}
        arabic="السجل"
        right={
          historyList.length > 0 ? (
            <Pressable
              onPress={handleClearHistory}
              accessibilityRole="button"
              accessibilityLabel={t("clearHistoryTitle")}
              className="items-center justify-center rounded-full bg-white/90"
              style={{ width: 48, height: 48 }}
            >
              <Trash2 size={20} color="#dc2626" />
            </Pressable>
          ) : undefined
        }
      />

      {/* Konten */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
          <Text className={`mt-4 ${theme.textMuted}`}>{t("loadingHistory")}</Text>
        </View>
      ) : historyList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className={`h-28 w-28 rounded-full overflow-hidden ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"} items-center justify-center mb-4`}>
            <BatikPattern width={112} height={112} color={isDarkMode ? "#34d399" : "#047857"} cell={28} opacity={0.35} />
            <Clock size={36} color={isDarkMode ? "#34d399" : "#047857"} />
          </View>
          <Text className={`text-lg font-bold text-center ${theme.text}`}>{t("noHistory")}</Text>
          <Text className={`text-sm text-center mt-2 ${theme.textMuted}`}>
            {t("noHistoryDesc")}
          </Text>
        </View>
      ) : (
        <FlatList
          key={cols}
          numColumns={cols}
          data={historyList}
          keyExtractor={(item, index) => `${item.surahNomor}-${item.mushafId}-${index}`}
          renderItem={renderHistoryItem}
          contentContainerStyle={{ padding: pad - (cols > 1 ? 6 : 0), paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}