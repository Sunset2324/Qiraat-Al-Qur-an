import { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, BookOpen, Volume2, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { TAJWEED_DATA, KATEGORI_TAJWEED } from "../../../src/data/tajweed";

export default function TajweedScreen() {
  const { isDarkMode, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const mutedColor = isDarkMode ? "#9ca3af" : "#6b6558";
  const accent = isDarkMode ? "#34d399" : "#047857";

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TAJWEED_DATA.filter((item) => {
      const matchesCategory = selectedCategory ? item.kategori === selectedCategory : true;
      const matchesSearch =
        !q ||
        item.judul.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.arab.includes(searchQuery.trim()) ||
        item.ringkas.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
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

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      >
        {/* Search Bar */}
        <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <Search size={20} color={mutedColor} />
          <TextInput
            placeholder="Cari hukum tajweed..."
            placeholderTextColor={mutedColor}
            className={`flex-1 ml-3 ${theme.text}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <X size={18} color={mutedColor} />
            </Pressable>
          )}
        </View>

        {/* Info Card */}
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={accent} />
            <Text className={`text-sm font-bold ${theme.text}`}>Tentang Tajweed</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>
            Tajweed adalah ilmu tentang cara mengucapkan huruf-huruf Al-Qur'an dengan benar sesuai makhraj dan sifatnya.
            Ketuk salah satu hukum untuk melihat huruf, cara baca, dan contoh ayatnya.
          </Text>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {[null, ...KATEGORI_TAJWEED].map((cat) => {
            const aktif = selectedCategory === cat;
            return (
              <Pressable
                key={cat ?? "all"}
                onPress={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  aktif ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <Text className={`text-xs font-medium ${aktif ? "text-white" : theme.text}`}>
                  {cat ?? "Semua"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>
          Hukum Bacaan <Text className={`text-sm font-normal ${theme.textMuted}`}>({filteredData.length})</Text>
        </Text>

        {/* List */}
        {filteredData.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/screen/tajweed/${item.id}`)}
            className={`mb-4 p-5 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
          >
            <View className="flex-row items-start gap-4">
              <View className={`p-3 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
                {item.kategori === "Mad" ? (
                  <BookOpen size={24} color={accent} />
                ) : (
                  <Volume2 size={24} color={accent} />
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  {item.kategori}
                </Text>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-base font-bold flex-1 ${theme.text}`}>{item.judul}</Text>
                  <Text className={`text-base ${theme.text}`} style={{ fontFamily: "System" }}>
                    {item.arab}
                  </Text>
                </View>
                {item.huruf ? (
                  <Text className={`text-xs mb-2 ${theme.textSecondary}`}>
                    Huruf: <Text style={{ fontFamily: "System" }}>{item.huruf}</Text>
                  </Text>
                ) : null}
                <Text className={`text-xs leading-5 ${theme.textMuted}`}>{item.ringkas}</Text>
              </View>
              <View className="self-center">
                <ChevronRight size={18} color={mutedColor} />
              </View>
            </View>
          </Pressable>
        ))}

        {filteredData.length === 0 && (
          <View className="items-center justify-center py-12">
            <Search size={48} color={mutedColor} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>Tidak ada hasil pencarian</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
