import { View, Text, Pressable, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, BookOpen, AlertCircle } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDaftarDoa } from "../../../src/services/quranService";

interface DoaItem {
  id: number;
  judul: string;
  doa: string;
  latin?: string;
  arti: string;
  grup?: string;
  tags?: string[];
}

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "pagi", label: "Pagi" },
  { key: "petang", label: "Petang" },
  { key: "sholat", label: "Sholat" },
  { key: "doa", label: "Harian" },
];

const getIconForDoa = (item: DoaItem) => {
  const text = `${item.judul} ${item.grup} ${(item.tags || []).join(" ")}`.toLowerCase();
  if (text.includes("pagi")) return "☀️";
  if (text.includes("petang") || text.includes("sore")) return "🌙";
  if (text.includes("sholat") || text.includes("rukuk") || text.includes("sujud")) return "🤲";
  if (text.includes("masjid")) return "🕌";
  if (text.includes("tidur")) return "🛏️";
  if (text.includes("makan")) return "🍽️";
  return "";
};

export default function DzikirDoaScreen() {
  const { isDarkMode, theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [doaList, setDoaList] = useState<DoaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDaftarDoa();
      setDoaList(data);
    } catch (err) {
      setError("Gagal memuat data. Periksa koneksi internet.");
    } finally {
      setLoading(false);
    }
  };

  // Filter berdasarkan Kategori DAN Search Query
  const filteredData = doaList.filter((item) => {
    const matchFilter = activeFilter === "all" || (item.grup?.toLowerCase().includes(activeFilter));
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      item.judul.toLowerCase().includes(query) || 
      item.arti.toLowerCase().includes(query) ||
      (item.latin && item.latin.toLowerCase().includes(query));
    
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat Dzikir & Doa...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center p-6 ${theme.bg}`}>
        <AlertCircle size={48} color={isDarkMode ? "#f87171" : "#ef4444"} />
        <Text className={`mt-4 text-center font-semibold ${theme.text}`}>{error}</Text>
        <Pressable onPress={fetchData} className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}>
          <Text className="text-white font-bold">Coba Lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      
      {/* ============================================ */}
      {/* BAGIAN ATAS - FIXED (TIDAK BISA DI-SCROLL)   */}
      {/* ============================================ */}
      <View>
        {/* 1. HEADER: Back Button + Judul di Tengah */}
        <View className={`flex-row items-center justify-between px-6 py-4 border-b ${theme.border}`}>
          <Pressable onPress={() => router.back()} className="p-1 active:opacity-70">
            <ArrowLeft size={24} color={theme.iconColor} />
          </Pressable>
          
          <Text className={`text-base font-bold tracking-[3px] ${theme.text}`}>
            DZIKIR & DOA
          </Text>
          
          <View className="w-8" />
        </View>

        {/* 2. SEARCH BAR */}
        <View className="px-6 pt-4 pb-3">
          <View className={`flex-row items-center px-5 py-3.5 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
            <Search size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              className={`flex-1 ml-3 text-base ${theme.text}`}
              placeholder="Cari judul, arti, atau latin..."
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

        {/* 3. FILTER TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-3" contentContainerStyle={{ gap: 10 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`px-6 py-2.5 rounded-full border ${
                activeFilter === filter.key 
                  ? "bg-emerald-800 border-emerald-800"
                  : `${theme.bgCard} ${theme.border}`
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeFilter === filter.key ? "text-white" : theme.text
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ============================================ */}
      {/* BAGIAN GRID - SCROLLABLE (HANYA INI YANG SCROLL) */}
      {/* ============================================ */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        <View className="flex-row flex-wrap justify-between">
          {filteredData.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/screen/dzikir-doa/detail/${item.id}`)}
              className={`w-[48%] ${theme.bgCard} border ${theme.border} rounded-2xl p-4 mb-4 active:opacity-90 justify-center`}
            >
              {/* Ikon */}
              <View className={`h-12 w-12 ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"} rounded-xl items-center justify-center mb-3 self-center`}>
                <Text className="text-2xl">{getIconForDoa(item)}</Text>
              </View>
              
              {/* Judul */}
              <Text className={`font-bold text-sm ${theme.text} text-center tracking-wide`} numberOfLines={2}>
                {item.judul}
              </Text>
              
              {/* Label Grup Kecil */}
              {item.grup && (
                <Text className={`text-[10px] ${theme.textMuted} text-center mt-1 uppercase tracking-wider`}>
                  {item.grup}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* EMPTY STATE */}
        {filteredData.length === 0 && (
          <View className="py-12 items-center">
            <BookOpen size={48} color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>
              {searchQuery ? "Tidak ada hasil untuk pencarian ini" : "Tidak ada doa yang ditemukan"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}