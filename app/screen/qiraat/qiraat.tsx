import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Check, BookOpen } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getMushafList } from "../../../src/services/quranService";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { useQiraatT, mushafDescription } from "../../../src/i18n/qiraatI18n";

interface MushafItem {
  id: string;
  name: string;
  arabic: string;
  description: string;
}

export default function QiraatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { lang, s } = useQiraatT();
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

      Alert.alert(s.selectedTitle, s.selectedBody(selectedName), [
        {
          text: s.backToMushaf,
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
        <Text className={`mt-4 ${theme.textMuted}`}>{s.loadingMushaf}</Text>
      </SafeAreaView>
    );
  }

  if (mushafList.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={["top"]}>
        <BookOpen size={48} color={theme.mutedColor} />
        <Text className={`mt-4 text-center font-bold ${theme.text}`}>{s.loadFailed}</Text>
        <Pressable
          onPress={loadData}
          className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
          <Text className="text-white font-bold">{s.retry}</Text>
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
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>{s.topTag}</Text>
          <Text className={`text-base font-bold ${theme.text}`}>{s.title}</Text>
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
            <Text className={`text-sm font-bold ${theme.text}`}>{s.aboutTitle}</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>{s.aboutBody}</Text>
        </View>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>{s.listTitle}</Text>

        {mushafList.map((mushaf) => {
          const isActive = selectedMushafId === mushaf.id;
          const lower = mushaf.name.toLowerCase();
          const isStandar = lower.includes("standar") || lower.includes("madinah");

          return (
            <Pressable
              key={mushaf.id}
              onPress={() => handleSelectMushaf(mushaf.id)}
              className={`mb-4 p-5 rounded-2xl border-2 ${
                isActive
                  ? isDarkMode
                    ? "border-emerald-600 bg-emerald-900/20"
                    : "border-emerald-600 bg-emerald-50"
                  : `${theme.border} ${theme.bgCard}`
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center gap-2 flex-wrap mb-1">
                    <Text
                      className={`text-base font-bold ${
                        isActive ? (isDarkMode ? "text-emerald-400" : "text-emerald-700") : theme.text
                      }`}
                    >
                      {mushaf.name}
                    </Text>
                    {isStandar && (
                      <View className="px-2 py-0.5 rounded bg-emerald-600">
                        <Text className="text-[10px] font-bold text-white">{s.popular}</Text>
                      </View>
                    )}
                  </View>
                  {mushaf.arabic ? (
                    <Text className={`text-sm ${theme.textMuted} text-right`} style={{ fontFamily: ARABIC_FONT }}>
                      {mushaf.arabic}
                    </Text>
                  ) : null}
                </View>

                <View
                  className={`h-8 w-8 rounded-full items-center justify-center ${
                    isActive ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <Check size={16} color={isActive ? "#fff" : theme.mutedColor} />
                </View>
              </View>

              <View className={`p-3 rounded-xl ${isDarkMode ? "bg-black/20" : "bg-cream-100"}`}>
                <Text className={`text-xs leading-5 ${theme.textMuted}`}>
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