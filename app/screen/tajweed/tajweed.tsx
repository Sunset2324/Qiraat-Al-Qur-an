import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, BookOpen, Volume2 } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

// Data dummy Tajweed (nanti bisa diganti dengan API)
const TAJWEED_DATA = [
  {
    id: 1,
    kategori: "Hukum Nun Mati & Tanwin",
    judul: "Izhar Halqi",
    contoh: "مِنْ + بَيْتٍ = مِنْ بَيْتٍ",
    penjelasan: "Membaca nun mati atau tanwin dengan jelas (tanpa dengung) ketika bertemu huruf halq (ء ه ع ح غ خ).",
    icon: Volume2,
  },
  {
    id: 2,
    kategori: "Hukum Nun Mati & Tanwin",
    judul: "Idgham Bighunnah",
    contoh: "مِنْ + وَرَاءِ = مِوَرَاءِ",
    penjelasan: "Memasukkan nun mati/tanwin ke huruf berikutnya dengan dengung (ي ن م و).",
    icon: Volume2,
  },
  {
    id: 3,
    kategori: "Hukum Nun Mati & Tanwin",
    judul: "Iqlab",
    contoh: "مِنْ + بَابٍ = مِمْبَابٍ",
    penjelasan: "Mengubah bunyi nun mati/tanwin menjadi mim ketika bertemu huruf ba (ب).",
    icon: Volume2,
  },
  {
    id: 4,
    kategori: "Hukum Mim Mati",
    judul: "Ikhfa Syafawi",
    contoh: "تَرْمِيْهِم بِحِجَارَةٍ",
    penjelasan: "Membaca mim mati dengan samar-samar (antara izhar dan idgham) ketika bertemu ba (ب).",
    icon: Volume2,
  },
  {
    id: 5,
    kategori: "Mad",
    judul: "Mad Thabi'i",
    contoh: "قَالَ = Qoola",
    penjelasan: "Mad asli sepanjang 2 harakat (1 alif) ketika ada fathah diikuti alif, kasrah diikuti ya, atau dhommah diikuti wawu.",
    icon: BookOpen,
  },
  {
    id: 6,
    kategori: "Mad",
    judul: "Mad Far'i",
    contoh: "الضَّآلِّيْنَ",
    penjelasan: "Mad cabang yang panjangnya bervariasi (2-6 harakat) tergantung jenisnya (Wajib Muttashil, Jaiz Munfashil, dll).",
    icon: BookOpen,
  },
];

export default function TajweedScreen() {
  const { isDarkMode, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(TAJWEED_DATA.map((item) => item.kategori))];

  const filteredData = TAJWEED_DATA.filter((item) => {
    const matchesSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? item.kategori === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* HEADER */}
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>PELAJARAN</Text>
          <Text className={`text-base font-bold ${theme.text}`}>Tajweed</Text>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Search Bar */}
        <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <Search size={20} color={theme.textMuted} />
          <TextInput
            placeholder="Cari hukum tajweed..."
            placeholderTextColor={theme.textMuted}
            className={`flex-1 ml-3 ${theme.text}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Info Card */}
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-sm font-bold ${theme.text}`}>Tentang Tajweed</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>
            Tajweed adalah ilmu untuk mengetahui cara mengucapkan huruf-huruf Al-Qur'an dengan benar dan sempurna. 
            Mempelajari tajweed adalah kewajiban untuk menjaga kemurnian bacaan Al-Qur'an.
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <Pressable
            onPress={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === null ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
          >
            <Text className={`text-xs font-medium ${selectedCategory === null ? "text-white" : theme.text}`}>
              Semua
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === cat ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              <Text className={`text-xs font-medium ${selectedCategory === cat ? "text-white" : theme.text}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>Hukum Bacaan</Text>

        {/* List Items */}
        {filteredData.map((item) => {
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/screen/tajweed/${item.id}`)}
              className={`mb-4 p-5 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
            >
              <View className="flex-row items-start gap-4">
                <View className={`p-3 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
                  <IconComponent size={24} color={isDarkMode ? "#34d399" : "#047857"} />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1`}>
                    {item.kategori}
                  </Text>
                  <Text className={`text-base font-bold ${theme.text} mb-2`}>
                    {item.judul}
                  </Text>
                  <View className={`p-3 rounded-lg ${isDarkMode ? "bg-black/20" : "bg-cream-100"} mb-2`}>
                    <Text className={`text-sm font-semibold text-center ${theme.text}`} style={{ fontFamily: "System" }}>
                      {item.contoh}
                    </Text>
                  </View>
                  <Text className={`text-xs leading-5 ${theme.textMuted}`}>
                    {item.penjelasan}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {filteredData.length === 0 && (
          <View className="items-center justify-center py-12">
            <Search size={48} color={theme.textMuted} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>
              Tidak ada hasil pencarian
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}