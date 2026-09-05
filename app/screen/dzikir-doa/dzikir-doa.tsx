import { View, Text, Pressable, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { 
  ArrowLeft, Check, Sun, Moon, HandHeart, Building2, 
  Bed, DoorOpen, Utensils, ArrowDown, ArrowUp, BookOpen, AlertCircle 
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDaftarDoa } from "../../../src/services/quranService"; // <-- IMPORT DARI SERVICE

// Type untuk data dari API
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
  { key: "pagi-petang", label: "Pagi & Sore" },
  { key: "sholat", label: "Sholat" },
  { key: "doa", label: "Doa Harian" },
];

// Fungsi pintar untuk menentukan ikon berdasarkan data API
const getIconForDoa = (item: DoaItem) => {
  const textToCheck = `${item.judul} ${item.grup} ${(item.tags || []).join(" ")}`.toLowerCase();
  
  if (textToCheck.includes("pagi")) return Sun;
  if (textToCheck.includes("petang") || textToCheck.includes("sore")) return Moon;
  if (textToCheck.includes("sholat") || textToCheck.includes("shalat") || textToCheck.includes("rukuk") || textToCheck.includes("sujud")) return HandHeart;
  if (textToCheck.includes("masjid") || textToCheck.includes("mosque")) return Building2;
  if (textToCheck.includes("tidur")) return Bed;
  if (textToCheck.includes("makan")) return Utensils;
  if (textToCheck.includes("rumah") || textToCheck.includes("keluar") || textToCheck.includes("masuk")) return DoorOpen;
  
  return BookOpen; // Default icon
};

export default function DzikirDoaScreen() {
  const { isDarkMode, theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeBacaan, setActiveBacaan] = useState<number | null>(null);

  // State untuk Data API
  const [doaList, setDoaList] = useState<DoaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Data dari Backend saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDaftarDoa(); // Memanggil service yang sudah kita buat
        setDoaList(data);
      } catch (err) {
        setError("Gagal memuat data doa. Pastikan backend berjalan.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeItem = doaList.find((item) => item.id === activeBacaan);

  // 2. Logika Filter yang disesuaikan dengan data API
  const filteredData = doaList.filter((item) => {
    if (activeFilter === "all") return true;
    
    const textToCheck = `${item.judul} ${item.grup}`.toLowerCase();

    if (activeFilter === "pagi-petang") {
      return textToCheck.includes("pagi") || textToCheck.includes("petang") || textToCheck.includes("sore");
    }
    if (activeFilter === "sholat") {
      return textToCheck.includes("sholat") || textToCheck.includes("shalat") || textToCheck.includes("rukuk") || textToCheck.includes("sujud") || textToCheck.includes("iftitah");
    }
    if (activeFilter === "doa") {
      // Tampilkan yang bukan sholat, pagi, atau petang (Doa umum)
      return !textToCheck.includes("sholat") && !textToCheck.includes("pagi") && !textToCheck.includes("petang");
    }
    return true;
  });

  // 3. Tampilan Loading
  if (loading) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat Dzikir & Doa...</Text>
      </SafeAreaView>
    );
  }

  // 4. Tampilan Error
  if (error) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center p-6 ${theme.bg}`}>
        <AlertCircle size={48} color={isDarkMode ? "#f87171" : "#ef4444"} />
        <Text className={`mt-4 text-center font-semibold ${theme.text}`}>{error}</Text>
        <Pressable 
          onPress={() => { setActiveFilter("all"); setLoading(true); }} 
          className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
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
        {/* HEADER */}
        <View className={`flex-row items-center justify-between px-6 py-4 border-b ${theme.border}`}>
          <Pressable onPress={() => router.back()} className="p-1">
            <ArrowLeft size={22} color={theme.iconColor} />
          </Pressable>
          
          <Text className={`text-base font-bold tracking-[2px] ${theme.text}`}>
            DZIKIR & DOA
          </Text>
          
          <View className="w-8" /> 
        </View>

        {/* TITLE & DESCRIPTION */}
        <View className="px-6 pt-4 pb-3">
          <Text className={`text-2xl font-bold ${theme.text} mb-1`}>
            Dzikir dan doa harian
          </Text>
          <Text className={`text-sm ${theme.textMuted} leading-5`}>
            Pilih riwayat yang ingin Anda dengarkan dan pelajari.
          </Text>
        </View>

        {/* BACAAN AKTIF CARD */}
        <View className="px-6 mb-3">
          <View className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 flex-row items-center justify-between`}>
            <View className="flex-1 pr-4">
              <Text className={`text-xs font-medium ${theme.textMuted} mb-1`}>
                Bacaan aktif
              </Text>
              
              {activeItem ? (
                <Text className={`text-base font-bold ${theme.text}`} numberOfLines={1}>
                  {activeItem.judul}
                </Text>
              ) : (
                <Text className={`text-base font-bold ${theme.textMuted}`}>
                  Anda belum memilih
                </Text>
              )}
            </View>
            
            {activeItem ? (
              <View className="bg-emerald-600 rounded-full p-2">
                <Check size={20} color="#fff" />
              </View>
            ) : (
              <View className={`rounded-full p-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}>
                <Check size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              </View>
            )}
          </View>
        </View>

        {/* FILTER TABS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-3"
          contentContainerStyle={{ gap: 10 }}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              className={`px-5 py-2 rounded-full border ${
                activeFilter === filter.key
                  ? "bg-emerald-700 border-emerald-700"
                  : `${theme.bgCard} ${theme.border}`
              }`}
            >
              <Text
                className={`text-sm font-medium ${
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
          {filteredData.map((item) => {
            const IconComponent = getIconForDoa(item);
            const isActive = activeBacaan === item.id;

            return (
              <Pressable
                key={item.id.toString()}
                onPress={() => setActiveBacaan(item.id)}
                className={`w-[48%] ${theme.bgCard} border ${theme.border} rounded-2xl p-4 mb-4 active:opacity-90 relative ${
                  isActive ? "border-emerald-600 border-2" : ""
                }`}
              >
                <View className={`h-10 w-10 ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"} rounded-xl items-center justify-center mb-3`}>
                  <IconComponent size={22} color={theme.iconColor} />
                </View>

                <Text className={`font-bold text-xs ${theme.text} mb-2 tracking-wide`} numberOfLines={2}>
                  {item.judul}
                </Text>

                <Text 
                  className={`text-sm ${theme.textMuted} text-right leading-6`} 
                  numberOfLines={2}
                >
                  {item.doa}
                </Text>

                {isActive && (
                  <View className="absolute top-3 right-3">
                    <View className="bg-emerald-600 rounded-full p-1">
                      <Check size={12} color="#fff" />
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* EMPTY STATE */}
        {filteredData.length === 0 && !loading && (
          <View className="py-12 items-center">
            <BookOpen size={48} color={isDarkMode ? "#4B5563" : "#9CA3AF"} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>
              Tidak ada dzikir atau doa untuk kategori ini
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}