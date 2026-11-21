import { useState, useMemo } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, BookOpen, Volume2, ChevronRight, X } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { TAJWEED_CAT_KEY } from "../../../src/i18n/translations";
import { TAJWEED_DATA, KATEGORI_TAJWEED } from "../../../src/data/tajweed";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";

export default function TajweedScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const catLabel = (k: string) => (TAJWEED_CAT_KEY[k] ? t(TAJWEED_CAT_KEY[k]) : k);
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
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
          <View className="flex-1 ml-4">
            <Text className="text-xs font-bold tracking-[2px] text-emerald-100">{t("lessonTag")}</Text>
            <Text className="text-xl font-extrabold text-white">{t("featTajweed")}</Text>
          </View>
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 30, lineHeight: 50, color: "#fde68a" }}>أحكام التجويد</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: 860 }}>
        {/* Search Bar */}
        <View className={`flex-row items-center px-5 rounded-full border ${theme.border} ${theme.bgCard} mb-6`} style={{ height: 52 }}>
          <Search size={20} color={mutedColor} />
          <TextInput
            placeholder={t("searchTajweed")}
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
        <View className={`p-5 rounded-3xl overflow-hidden border ${theme.border} ${theme.bgCard} mb-6`}>
          <BatikPattern width={900} height={300} color={accent} cell={56} opacity={0.07} strokeWidth={1.4} />
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={accent} />
            <Text className={`text-sm font-bold ${theme.text}`}>{t("aboutTajweed")}</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>
            {t("aboutTajweedBody")}
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
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                style={{ height: 48, justifyContent: "center" }}
                className={`px-6 rounded-full mr-2 border ${
                  aktif ? "bg-emerald-800 border-emerald-800" : `${theme.bgCard} ${theme.border}`
                }`}
              >
                <Text className={`text-sm font-medium ${aktif ? "text-white" : theme.text}`}>
                  {cat ? catLabel(cat) : t("all")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>
          {t("rulesHeading")} <Text className={`text-sm font-normal ${theme.textMuted}`}>({filteredData.length})</Text>
        </Text>

        {/* List */}
        {filteredData.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/screen/tajweed/${item.id}`)}
            accessibilityRole="button"
            className={`mb-4 p-5 rounded-3xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
          >
            <View className="flex-row items-start gap-4">
              <View className={`h-14 w-14 items-center justify-center rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
                {item.kategori === "Mad" ? (
                  <BookOpen size={24} color={accent} />
                ) : (
                  <Volume2 size={24} color={accent} />
                )}
              </View>
              <View className="flex-1">
                <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  {catLabel(item.kategori)}
                </Text>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-base font-extrabold flex-1 ${theme.text}`}>{item.judul}</Text>
                  <Text className={`text-base ${theme.text}`} style={{ fontFamily: ARABIC_FONT }}>
                    {item.arab}
                  </Text>
                </View>
                {item.huruf ? (
                  <Text className={`text-xs mb-2 ${theme.textSecondary}`}>
                    {t("lettersLabel")} <Text style={{ fontFamily: ARABIC_FONT }}>{item.huruf}</Text>
                  </Text>
                ) : null}
                <Text className={`text-xs leading-5 ${theme.textMuted}`}>{item.ringkas}</Text>
              </View>
              <View className="self-center">
                <ChevronRight size={18} color={mutedColor} style={flip} />
              </View>
            </View>
          </Pressable>
        ))}

        {filteredData.length === 0 && (
          <View className="items-center justify-center py-12">
            <Search size={48} color={mutedColor} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>{t("noResults")}</Text>
          </View>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}