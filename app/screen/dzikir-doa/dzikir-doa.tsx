import { View, Text, Pressable, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { 
  ArrowLeft, Search, BookOpen, AlertCircle, Sun, Moon, Hand, 
  Home, Utensils, Bed, Mosque, Book, Tag 
} from "lucide-react-native";
import { useState, useEffect, useMemo, ReactNode } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { getDaftarDoa } from "../../../src/services/quranService";
import { isBakdaShalat, isShalatSunnahDoa } from "../../../src/data/bakdaShalat";
import { DOA_OFFLINE, DOA_OFFLINE_READY } from "../../../src/data/doaOffline";
import { DZIKIR_SUNNAH, pick } from "../../../src/data/dzikirSunnah";

interface DoaItem {
  id: number | string; // number = EQuran.id, "dd-..." = data sunnah bawaan (offline)
  kat?: "pagi" | "petang" | "bakda" | "doa"; // hanya data bawaan
  order?: number;
  judul: string;
  doa: string;
  latin?: string;
  arti: string;
  grup?: string;
  tags?: string[];
}

// key dipakai untuk menyaring data (Indonesia), labelKey untuk tampilan
const FILTERS = [
  { key: "all", labelKey: "fAll" },
  { key: "pagi", labelKey: "fMorning" },
  { key: "petang", labelKey: "fEvening" },
  { key: "bakda", labelKey: "fBakda" },
  { key: "sholat", labelKey: "fPrayer" },
  { key: "doa", labelKey: "fDaily" },
];

export default function DzikirDoaScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip, language } = useLanguage();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const isTablet = useIsTablet();
  const { width: winW } = useWindowDimensions();
  const pad = isTablet ? 40 : 24;
  const cols = winW >= 900 ? 3 : 2;
  const cardW = `${Math.floor(100 / cols) - 2}%` as const;
  const [activeFilter, setActiveFilter] = useState(tab === "bakda" ? "bakda" : "all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data EQuran.id dibundel di app (offline). Hanya kalau file datanya belum diisi, pakai API sebagai cadangan.
  const [doaList, setDoaList] = useState<DoaItem[]>(DOA_OFFLINE_READY ? (DOA_OFFLINE as DoaItem[]) : []);
  const [loading, setLoading] = useState(!DOA_OFFLINE_READY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === "bakda") setActiveFilter("bakda");
  }, [tab]);

  const fetchData = async () => {
    if (DOA_OFFLINE_READY) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDaftarDoa();
      setDoaList(data);
    } catch (err) {
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mendapatkan ikon React yang sesuai berdasarkan tags/grup
  const getIconForDoa = (item: DoaItem): ReactNode => {
    const text = `${item.judul} ${item.grup} ${(item.tags || []).join(" ")}`.toLowerCase();
    
    if (text.includes("pagi") || text.includes("subuh")) return <Sun size={24} color={isDarkMode ? "#fbbf24" : "#d97706"} />;
    if (text.includes("petang") || text.includes("sore") || text.includes("maghrib")) return <Moon size={24} color={isDarkMode ? "#a78bfa" : "#7c3aed"} />;
    if (text.includes("sholat") || text.includes("rukuk") || text.includes("sujud") || text.includes("bakda")) return <Hand size={24} color={isDarkMode ? "#34d399" : "#059669"} />;
    if (text.includes("masjid") || text.includes("jumat")) return <Mosque size={24} color={isDarkMode ? "#60a5fa" : "#2563eb"} />;
    if (text.includes("tidur") || text.includes("bangun")) return <Bed size={24} color={isDarkMode ? "#94a3b8" : "#475569"} />;
    if (text.includes("makan") || text.includes("minum")) return <Utensils size={24} color={isDarkMode ? "#fb923c" : "#ea580c"} />;
    if (text.includes("rumah") || text.includes("keluar")) return <Home size={24} color={isDarkMode ? "#f472b6" : "#db2777"} />;
    
    return <Book size={24} color={isDarkMode ? "#34d399" : "#047857"} />;
  };

  // Data sunnah bawaan (offline) digabung di belakang data EQuran.id
  const localItems: DoaItem[] = useMemo(
    () =>
      DZIKIR_SUNNAH.map((d, i) => ({
        id: d.id,
        kat: d.kat,
        order: 1_000_000 + i,
        judul: pick(d.judul, language),
        doa: d.arab,
        latin: d.latin,
        arti: pick(d.arti, language),
        grup: pick(d.grup, language),
        tags: [],
      })),
    [language]
  );
  const allItems = useMemo(() => [...doaList.map((x) => ({ ...x, order: Number(x.id) })), ...localItems], [doaList, localItems]);

  const filteredData = allItems
    .filter((item) => {
      const bakda = item.kat ? item.kat === "bakda" : isBakdaShalat(item);
      const sunnahShalat = !item.kat && isShalatSunnahDoa(item); // istikharah / dhuha -> tab Sholat
      const itemTags = (item.tags || []).map(t => t.toLowerCase());
      
      const matchFilter =
        activeFilter === "bakda"
          ? bakda || (!item.kat && !sunnahShalat && itemTags.some(t => t.includes("bakda") || t.includes("sholat")))
          : !bakda && (
              activeFilter === "all" ||
              (item.kat
                ? item.kat === activeFilter
                : (activeFilter === "sholat" && sunnahShalat) ||
                  !!item.grup?.toLowerCase().includes(activeFilter) ||
                  itemTags.some(t => t.includes(activeFilter)))
            );
            
      const query = searchQuery.toLowerCase();
      const matchSearch =
        item.judul.toLowerCase().includes(query) ||
        item.arti.toLowerCase().includes(query) ||
        (!!item.latin && item.latin.toLowerCase().includes(query)) ||
        itemTags.some(t => t.includes(query));
        
      return matchFilter && matchSearch;
    })
    .sort((a, b) => (activeFilter === "bakda" ? (a.order ?? 0) - (b.order ?? 0) : 0));

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>{t("loadingDzikir")}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center p-6 ${theme.bg}`}>
        <AlertCircle size={48} color={isDarkMode ? "#f87171" : "#ef4444"} />
        <Text className={`mt-4 text-center font-semibold ${theme.text}`}>{t("dzikirLoadFailed")}</Text>
        <Pressable onPress={fetchData} className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}>
          <Text className="text-white font-bold">{t("retry")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View>
        <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 18 }}>
          <BatikPattern width={1200} height={100} cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t("back")}
              className="items-center justify-center rounded-full active:opacity-70"
              style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
            >
              <ArrowLeft size={22} color="#fff" style={flip} />
            </Pressable>
            <Text className="text-xl font-extrabold flex-1 ml-4 text-white">{t("dzikirTitle")}</Text>
            <Text style={{ fontFamily: ARABIC_FONT, fontSize: 30, lineHeight: 50, color: "#fde68a" }}>الأذكار والأدعية</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: pad }} className="pt-4 pb-3">
          <View className={`flex-row items-center px-5 rounded-full border ${theme.border} ${theme.bgCard}`} style={{ height: 52 }}>
            <Search size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              className={`flex-1 ml-3 text-base ${theme.text}`}
              placeholder={t("searchDoa")}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} className="ml-2 p-1">
                <Text className={`text-sm font-bold ${theme.textMuted}`}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingHorizontal: pad, paddingBottom: 12 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter.key }}
              style={{ height: 48, justifyContent: "center" }}
              className={`px-6 rounded-full border ${
                activeFilter === filter.key 
                  ? "bg-emerald-800 border-emerald-800"
                  : `${theme.bgCard} ${theme.border}`
              }`}
            >
              <Text className={`text-sm font-semibold ${activeFilter === filter.key ? "text-white" : theme.text}`}>
                {t(filter.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pad, paddingBottom: 40 }}>
        {activeFilter === "bakda" && (
          <View className={`mb-4 p-4 rounded-2xl border ${isDarkMode ? "bg-emerald-900/30 border-emerald-800" : "bg-emerald-50 border-emerald-200"}`}>
            <Text className={`text-sm font-bold mb-1 ${theme.text}`}>{t("bakdaInfoTitle")}</Text>
            <Text className={`text-xs leading-5 ${theme.textMuted}`}>
              {t("bakdaInfoBody")}
            </Text>
          </View>
        )}

        <View className="flex-row flex-wrap justify-between">
          {filteredData.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/screen/dzikir-doa/detail/${item.id}`)}
              accessibilityRole="button"
              style={{ width: cardW, minHeight: isTablet ? 168 : 148 }}
              className={`${theme.bgCard} border ${theme.border} rounded-3xl p-4 mb-4 active:opacity-90 justify-center`}
            >
              <View className={`h-14 w-14 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} rounded-full items-center justify-center mb-3 self-center`}>
                {getIconForDoa(item)}
              </View>
              
              <Text className={`font-extrabold ${isTablet ? "text-base" : "text-sm"} ${theme.text} text-center`} numberOfLines={2}>
                {item.judul}
              </Text>
              
              {!!item.grup && (
                <Text className={`text-[11px] ${theme.textMuted} text-center mt-1 uppercase tracking-wider`} numberOfLines={1}>
                  {item.grup}
                </Text>
              )}
              
              {/* Tampilkan 1 tagar pertama jika ada, sebagai preview */}
              {item.tags && item.tags.length > 0 && (
                <View className="flex-row items-center justify-center gap-1 mt-2">
                  <Tag size={10} color={theme.mutedColor} />
                  <Text className={`text-[10px] ${theme.textMuted}`}>#{item.tags[0]}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Text className={`text-[10px] text-center mt-2 mb-4 ${theme.textMuted}`}>{t("dzikirDataCredit")}</Text>

        {filteredData.length === 0 && (
          <View className="py-12 items-center">
            <BookOpen size={48} color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>
              {searchQuery ? t("noSearchResult") : t("noDoa")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}