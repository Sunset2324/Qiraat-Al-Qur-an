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
import { GuardBlockedError, guardReasons } from "../../../src/security/guard";
import { useSecurity } from "../../../src/context/SecurityContext";

export default function JurnalKesehatanScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const [iklan, setIklan] = useState<Iklan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // null = tidak ada error; "net"/"restricted" = diblokir keamanan; "load" = gangguan jaringan/server
  const [error, setError] = useState<null | "load" | "net" | "restricted">(null);
  const { restricted, apiBlocked, recheck, status } = useSecurity();

  const muat = useCallback(async (force = false) => {
    try {
      setError(null);
      setIklan(await getIklan(force));
    } catch (e) {
      if (e instanceof GuardBlockedError) setError(e.code === "GUARD_NETWORK" ? "net" : "restricted");
      else setError("load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  // Kalau blokir keamanan baru saja hilang (VPN dimatikan, dll.), muat ulang otomatis.
  useEffect(() => {
    if (error === "net" || error === "restricted") muat(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restricted, apiBlocked]);

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
              {error === "net" || error === "restricted" ? (
                <>
                  <Text className={`text-center text-sm font-bold mb-1 ${theme.text}`}>
                    {t(error === "net" ? "guardNetTitle" : "guardRestrictedTitle")}
                  </Text>
                  <Text className={`text-center text-sm leading-6 ${theme.textMuted}`}>
                    {t(error === "net" ? "guardNetMsg" : "guardRestrictedMsg")}
                  </Text>
                  {guardReasons(status).length > 0 && (
                    <Text className={`text-center text-xs mt-2 ${theme.textMuted}`}>
                      {`[preview] ${guardReasons(status).join(", ")}`}
                    </Text>
                  )}
                </>
              ) : (
                <Text className={`text-center text-sm leading-6 ${theme.textMuted}`}>
                  {error ? t("adLoadFailed") : t("adEmpty")}
                </Text>
              )}
              {error && (
                <Pressable
                  onPress={async () => {
                    setLoading(true);
                    if (error === "net" || error === "restricted") await recheck(); // periksa ulang kondisi perangkat dulu
                    muat(true);
                  }}
                  accessibilityRole="button"
                  className="mt-4 px-5 py-3 rounded-2xl bg-emerald-700 active:opacity-90"
                >
                  <Text className="text-white font-bold">{t(error === "load" ? "retry" : "guardRecheck")}</Text>
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
