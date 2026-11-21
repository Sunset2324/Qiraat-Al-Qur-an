import { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Leaf } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import MedisDisclaimer from "../../../src/components/MedisDisclaimer";
import AdCard from "../../../src/components/AdCard";
import { getIklan, Iklan } from "../../../src/services/adsService";

export default function JurnalKesehatanScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const [iklan, setIklan] = useState<Iklan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const muat = useCallback(async (force = false) => {
    try {
      setError(false);
      setIklan(await getIklan(force));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  const accent = isDarkMode ? "#34d399" : "#047857";

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className="flex-row items-center gap-3 px-6 pt-4 pb-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          hitSlop={10}
          className={`p-2 rounded-full ${theme.bgCard} border ${theme.border}`}
        >
          <ArrowLeft size={20} color={theme.iconColor} style={flip} />
        </Pressable>
        <Text className={`flex-1 text-xl font-bold ${theme.text}`}>{t("healthJournal")}</Text>
        <Leaf size={22} color={accent} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={accent} />
        </View>
      ) : (
        <FlatList
          data={iklan}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => <AdCard ad={item} />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, maxWidth: 720, width: "100%", alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                muat(true);
              }}
              tintColor={accent}
            />
          }
          ListHeaderComponent={<Text className={`text-sm leading-6 mb-4 ${theme.textMuted}`}>{t("journalIntro")}</Text>}
          ListEmptyComponent={
            <View className="items-center py-12 px-4">
              <Text className={`text-center text-sm leading-6 ${theme.textMuted}`}>
                {error ? t("adLoadFailed") : t("adEmpty")}
              </Text>
              {error && (
                <Pressable
                  onPress={() => {
                    setLoading(true);
                    muat(true);
                  }}
                  accessibilityRole="button"
                  className="mt-4 px-5 py-3 rounded-2xl bg-emerald-700 active:opacity-90"
                >
                  <Text className="text-white font-bold">{t("retry")}</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={
            <View className="mt-2">
              <MedisDisclaimer />
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
