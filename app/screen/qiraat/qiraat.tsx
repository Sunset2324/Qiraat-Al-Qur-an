import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, BookOpen } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getMushafList } from "../../../src/services/quranService";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { useLanguage } from "../../../src/context/LanguageContext";
import { mushafDescription, mushafTitle } from "../../../src/i18n/qiraatI18n";

interface MushafItem {
  id: string;
  name: string;
  arabic: string;
  rawi?: string | null;
  description: string;
}

export default function QiraatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang, flip } = useLanguage();
  const [mushafList, setMushafList] = useState<MushafItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMushafId, setSelectedMushafId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMushafList();
      setMushafList(data);

      const saved = await AsyncStorage.getItem("selected_mushaf_id");
      if (saved && data.some((m: MushafItem) => m.id === saved)) {
        setSelectedMushafId(saved);
      } else {
        const hafs = data.find((m: MushafItem) => m.name.toLowerCase().includes("hafs"));
        setSelectedMushafId(hafs ? hafs.id : data[0]?.id);
      }
    } catch (e: any) {
      console.error("Gagal memuat data Mushaf:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectMushaf = async (id: string) => {
    setSelectedMushafId(id);
    try {
      const selectedName = mushafList.find((m) => m.id === id)?.name || "Mushaf";
      await AsyncStorage.setItem("selected_mushaf_id", id);
      await AsyncStorage.setItem("selected_mushaf_name", selectedName);

      Alert.alert(t("mushafSelected"), t("mushafSelectedBody", { name: selectedName }), [
        {
          text: t("backToMushaf"),
          onPress: () => {
            router.replace({
              pathname: "/(tabs)/mushaf",
              params: {
                selectedMushafId: id,
                selectedMushafName: selectedName,
                refresh: Date.now().toString(),
              },
            });
          },
        },
      ]);
    } catch (e) {
      console.error("Gagal menyimpan preferensi Mushaf", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={["top"]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>{t("loadingMushaf")}</Text>
      </SafeAreaView>
    );
  }

  if (mushafList.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={["top"]}>
        <BookOpen size={48} color={theme.mutedColor} />
        <Text className={`mt-4 text-center font-bold ${theme.text}`}>{t("loadFailed")}</Text>
        <Pressable
          onPress={loadData}
          className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
          <Text className="text-white font-bold">{t("retryLoad")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <ArrowLeft size={24} color={theme.iconColor} style={flip} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>{t("qiraatTag")}</Text>
          <Text className={`text-base font-bold ${theme.text}`}>{t("qiraatTitle")}</Text>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      >
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-sm font-bold ${theme.text}`}>{t("aboutMushaf")}</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>{t("aboutMushafBody")}</Text>
        </View>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>{t("mushafListTitle")}</Text>

        {mushafList.map((mushaf) => {
          const isActive = selectedMushafId === mushaf.id;
          const lower = mushaf.name.toLowerCase();
          const isStandar = mushaf.id === "1" || lower.includes("standar") || lower.includes("madinah");

          return (
            <Pressable
              key={mushaf.id}
              onPress={() => handleSelectMushaf(mushaf.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={`mb-3 p-4 rounded-2xl border-2 active:opacity-90 ${
                isActive
                  ? isDarkMode
                    ? "border-emerald-600 bg-emerald-900/20"
                    : "border-emerald-600 bg-emerald-50"
                  : `${theme.border} ${theme.bgCard}`
              }`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text
                  className={`flex-1 text-base font-bold ${
                    isActive ? (isDarkMode ? "text-emerald-400" : "text-emerald-800") : theme.text
                  }`}
                >
                  {mushafTitle(mushaf, lang)}
                </Text>
                {mushaf.arabic ? (
                  <Text
                    className={`text-lg ${theme.text}`}
                    style={{ fontFamily: ARABIC_FONT, writingDirection: "rtl", textAlign: "right", maxWidth: "50%" }}
                    numberOfLines={1}
                  >
                    {mushaf.arabic}
                  </Text>
                ) : null}
              </View>

              <View className="flex-row items-start gap-2 mt-2">
                {isStandar && (
                  <View className="px-1.5 py-0.5 rounded bg-emerald-600 mt-0.5">
                    <Text className="text-[10px] font-bold text-white">{t("popular")}</Text>
                  </View>
                )}
                <Text className={`flex-1 text-xs leading-5 ${theme.textMuted}`}>
                  {mushafDescription(mushaf, lang)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}