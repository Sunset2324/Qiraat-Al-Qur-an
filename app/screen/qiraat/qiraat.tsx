import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, BookOpen, Check } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getMushafList } from "../../../src/services/quranService";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
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
  const isTablet = useIsTablet();
  const { width: winW } = useWindowDimensions();
  const pad = isTablet ? 40 : 24;
  const cols = winW >= 800 ? 2 : 1;
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
          accessibilityRole="button"
          style={{ height: 52 }}
          className="mt-6 px-8 rounded-full bg-emerald-800 items-center justify-center active:opacity-90"
        >
          <Text className="text-white font-bold">{t("retryLoad")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 18 }}>
        <BatikPattern width={1400} height={100} cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
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
            <Text className="text-xs font-bold tracking-[2px] text-emerald-100">{t("qiraatTag")}</Text>
            <Text className="text-xl font-extrabold text-white" numberOfLines={1}>{t("qiraatTitle")}</Text>
          </View>
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 30, lineHeight: 50, color: "#fde68a" }}>القراءات</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: 1000 }}>
        <View className={`p-5 rounded-3xl overflow-hidden border ${theme.border} ${theme.bgCard} mb-6`}>
          <BatikPattern width={1000} height={300} color={isDarkMode ? "#34d399" : "#047857"} cell={56} opacity={0.07} strokeWidth={1.4} />
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-sm font-extrabold ${theme.text}`}>{t("aboutMushaf")}</Text>
          </View>
          <Text className={`text-sm leading-6 ${theme.textSecondary}`}>{t("aboutMushafBody")}</Text>
        </View>

        <Text className={`text-lg font-extrabold ${theme.text} mb-4`}>{t("mushafListTitle")}</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
        {mushafList.map((mushaf) => {
          const isActive = selectedMushafId === mushaf.id;
          const lower = mushaf.name.toLowerCase();
          const isStandar = mushaf.id === "1" || lower.includes("standar") || lower.includes("madinah");

          return (
            <View key={mushaf.id} style={{ width: cols === 2 ? "50%" : "100%", paddingHorizontal: 6 }}>
            <Pressable
              onPress={() => handleSelectMushaf(mushaf.id)}
              accessibilityRole="radio"
              accessibilityLabel={mushafTitle(mushaf, lang)}
              accessibilityState={{ selected: isActive, checked: isActive }}
              style={{ minHeight: 112 }}
              className={`mb-3 p-5 rounded-3xl border-2 active:opacity-90 ${
                isActive
                  ? isDarkMode
                    ? "border-emerald-500 bg-emerald-900/40"
                    : "border-emerald-700 bg-emerald-50"
                  : `${theme.border} ${theme.bgCard}`
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={`h-8 w-8 rounded-full items-center justify-center border-2 ${
                    isActive
                      ? isDarkMode ? "bg-emerald-500 border-emerald-500" : "bg-emerald-700 border-emerald-700"
                      : theme.border
                  }`}
                >
                  {isActive ? <Check size={18} color={isDarkMode ? "#022c22" : "#fff"} /> : null}
                </View>
                <Text
                  className={`flex-1 text-base font-extrabold ${
                    isActive ? (isDarkMode ? "text-emerald-300" : "text-emerald-900") : theme.text
                  }`}
                >
                  {mushafTitle(mushaf, lang)}
                </Text>
                {mushaf.arabic ? (
                  <Text
                    className={`${isTablet ? "text-2xl" : "text-xl"} ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}
                    style={{ fontFamily: ARABIC_FONT, writingDirection: "rtl", textAlign: "right", maxWidth: "45%" }}
                    numberOfLines={1}
                  >
                    {mushaf.arabic}
                  </Text>
                ) : null}
              </View>

              <View className="flex-row items-start gap-2 mt-3">
                {isStandar && (
                  <View className="px-2.5 py-1 rounded-full bg-amber-400">
                    <Text className="text-xs font-bold text-emerald-950">{t("popular")}</Text>
                  </View>
                )}
                <Text className={`flex-1 text-sm leading-6 ${theme.textSecondary}`}>
                  {mushafDescription(mushaf, lang)}
                </Text>
              </View>
            </Pressable>
            </View>
          );
        })}
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}