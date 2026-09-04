import { View, Text, Pressable, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { 
  ArrowLeft, Check, Sun, Moon, HandHeart, Building2, 
  Bed, DoorOpen, Utensils, ArrowDown, ArrowUp, BookOpen 
} from "lucide-react-native";
import { useState } from "react";
import { useTheme } from "../../../src/context/ThemeContext";

// Type untuk Dzikir & Doa
interface DzikirDoaItem {
  id: string;
  title: string;
  arabic: string;
  category: "pagi" | "petang" | "sholat" | "doa";
  iconName: string;
}

// DATA DUMMY LENGKAP
const DZIKIR_DOA_DATA: DzikirDoaItem[] = [
  { id: "1", title: "DZIKIR PAGI", arabic: "أَذْكَارُ الصَّبَاحِ", category: "pagi", iconName: "sun" },
  { id: "2", title: "DZIKIR PETANG", arabic: "أَذْكَارُ الْمَسَاءِ", category: "petang", iconName: "moon" },
  { id: "3", title: "SETELAH SHOLAT", arabic: "بَعْدَ الصَّلاةِ", category: "sholat", iconName: "prayer" },
  { id: "4", title: "DOA RUKUK", arabic: "سُبْحَانَ رَبِّيَ الْعَظِيمِ", category: "sholat", iconName: "arrow-down" },
  { id: "5", title: "DOA SUJUD", arabic: "سُبْحَانَ رَبِّيَ الْأَعْلَى", category: "sholat", iconName: "arrow-down" },
  { id: "6", title: "DOA I'TIDAL", arabic: "سَمِعَ اللهُ لِمَنْ حَمِدَهُ", category: "sholat", iconName: "arrow-up" },
  { id: "7", title: "MASUK MASJID", arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", category: "doa", iconName: "mosque" },
  { id: "8", title: "DOA TIDUR", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", category: "doa", iconName: "bed" },
  { id: "9", title: "DOA MAKAN", arabic: "اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا", category: "doa", iconName: "utensils" },
  { id: "10", title: "KELUAR RUMAH", arabic: "بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ", category: "doa", iconName: "door-open" },
];

const FILTERS = [
  { key: "all", label: "semua" },
  { key: "pagi-petang", label: "Pagi & sore" },
  { key: "sholat", label: "Sholat" },
  { key: "doa", label: "Doa" },
];

const IconMap: { [key: string]: any } = {
  sun: Sun,
  moon: Moon,
  prayer: HandHeart,
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  mosque: Building2,
  bed: Bed,
  utensils: Utensils,
  "door-open": DoorOpen,
};

export default function DzikirDoaScreen() {
  const { isDarkMode, theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeBacaan, setActiveBacaan] = useState<string | null>(null);

  const activeItem = DZIKIR_DOA_DATA.find((item) => item.id === activeBacaan);

  const filteredData = DZIKIR_DOA_DATA.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pagi-petang") {
      return item.category === "pagi" || item.category === "petang";
    }
    return item.category === activeFilter;
  });

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
              <Text className={`text-xs font-medium ${theme.textSecondary} mb-1`}>
                Bacaan aktif
              </Text>
              
              {activeItem ? (
                <Text className={`text-base font-bold ${theme.text}`}>
                  {activeItem.title}
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
                  ? "bg-emerald-800 border-emerald-800"
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
            const IconComponent = IconMap[item.iconName] || BookOpen;
            const isActive = activeBacaan === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setActiveBacaan(item.id)}
                className={`w-[48%] ${theme.bgCard} border ${theme.border} rounded-2xl p-4 mb-4 active:opacity-90 relative ${
                  isActive ? "border-emerald-600 border-2" : ""
                }`}
              >
                <View className={`h-10 w-10 ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"} rounded-xl items-center justify-center mb-3`}>
                  <IconComponent size={22} color={theme.iconColor} />
                </View>

                <Text className={`font-bold text-xs ${theme.text} mb-2 tracking-wide`}>
                  {item.title}
                </Text>

                <Text 
                  className={`text-sm ${theme.textMuted} text-right leading-6`} 
                  numberOfLines={2}
                >
                  {item.arabic}
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
        {filteredData.length === 0 && (
          <View className="py-12 items-center">
            <Text className={`text-center ${theme.textMuted}`}>
              Tidak ada dzikir atau doa untuk kategori ini
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}