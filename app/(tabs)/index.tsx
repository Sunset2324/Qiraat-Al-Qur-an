import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { FileText, MapPin, GraduationCap, BookMarked } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { useJadwalHariIni, formatCountdown, PRAYER_KEYS, toMinutes } from "../../src/hooks/useJadwalHariIni";
import { formatClock, formatHijri } from "../../src/utils/dateFormat";
import { getHistoryList, ReadingProgress } from "../../src/utils/readingHistory";
import BatikPattern from "../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../src/hooks/useIsTablet";
import { ARABIC_FONT } from "../../src/constants/fonts";

export default function DashboardScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, locale } = useLanguage();
  const { width } = useWindowDimensions();
  const { lokasi, ready, loading, error, next, now, schedule } = useJadwalHariIni();
  // 5 waktu shalat hari ini untuk strip di header
  const prayerTimes = PRAYER_KEYS.map((p) => {
    const min = toMinutes(schedule?.[p.key] ?? (p.key === "dzuhur" ? schedule?.dhuhur : undefined));
    return { key: p.key, labelKey: p.label as string, time: min === null ? "--:--" : `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}` };
  });

  const isTablet = useIsTablet();
  // Kartu fitur: 2 kolom di HP, 3 kolom di layar lebar (tablet)
  const cols = width >= 700 ? 3 : 2;
  const cardW = `${Math.floor(100 / cols) - 2}%` as const;

  // Bacaan terakhir untuk kartu "Lanjutkan membaca"
  const [last, setLast] = useState<ReadingProgress | null>(null);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistoryList().then((l) => alive && setLast(l[0] ?? null));
      return () => {
        alive = false;
      };
    }, [])
  );
  const hour = now.getHours();
  const greetKey = hour < 11 ? "greetMorning" : hour < 15 ? "greetDay" : hour < 18 ? "greetEvening" : "greetNight";
  const goLast = () =>
    last
      ? router.push({
          pathname: "/screen/surah/[nomor]",
          params: { nomor: String(last.surahNomor), mushafId: last.mushafId, ayat: String(last.ayatNomor) },
        } as any)
      : router.push("/(tabs)/mushaf" as any);
  const pct = last && last.totalAyat ? Math.min(100, Math.round((last.ayatNomor / last.totalAyat) * 100)) : 0;

  const hijri = formatHijri(now, locale);
  const goPicker = () => router.push("/screen/jadwal-shalat/jadwal-shalat");

  type Feature = { key: string; label: string; route: string; icon?: any; Icon?: typeof BookMarked };
  const FEATURES: Feature[] = [
    { key: "qiraat", label: t("featQiraat"), icon: require("../../assets/icons/qiraat.png"), route: "/screen/qiraat/qiraat" },
    { key: "dzikir", label: t("featDzikir"), icon: require("../../assets/icons/dzikir&doa.png"), route: "/screen/dzikir-doa/dzikir-doa" },
    { key: "prayer", label: t("featPrayer"), icon: require("../../assets/icons/jadwal-shalat.png"), route: "/screen/jadwal-shalat/jadwal-shalat" },
    { key: "tajweed", label: t("featTajweed"), icon: require("../../assets/icons/tajweed.png"), route: "/screen/tajweed/tajweed" },
    { key: "thibbun", label: t("featThibbun"), icon: require("../../assets/icons/thibbun-nabawi.png"), route: "/screen/thibbun-nabawi/thibbun-nabawi" },
    { key: "ebook", label: t("featEbook"), Icon: BookMarked, route: "/screen/ebook/ebook" },
  ];

  const pad = isTablet ? 40 : 24;

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 1. HEADER RINGKAS: salam, jam, adzan berikutnya, 5 waktu shalat */}
        <View
          className={`${theme.bgHeader} overflow-hidden`}
          style={{ paddingHorizontal: pad, paddingTop: 14, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <BatikPattern cell={42} opacity={isDarkMode ? 0.08 : 0.15} />

          {/* Baris 1: lokasi · Hijriah */}
          <Pressable onPress={goPicker} className="flex-row items-center gap-1.5 active:opacity-70 self-start" hitSlop={8}>
            <MapPin size={13} color={isDarkMode ? "#6ee7b7" : "#d1fae5"} />
            <Text numberOfLines={1} className={`text-xs font-medium flex-shrink ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
              {lokasi ? lokasi.kota : t("chooseLocation")}
              {hijri ? `  ·  ${hijri}` : ""}
            </Text>
          </Pressable>

          {/* Baris 2: salam + jam (kiri), adzan berikutnya (kanan) */}
          <View className="flex-row items-end justify-between mt-2" style={{ gap: 12 }}>
            <View className="flex-shrink">
              <View className="flex-row items-baseline flex-wrap" style={{ columnGap: 8 }}>
                <Text style={{ fontFamily: ARABIC_FONT, fontSize: 20, lineHeight: 34, color: "#fde68a" }}>السلام عليكم</Text>
                <Text className="text-sm font-semibold text-white">{t(greetKey)}</Text>
              </View>
              <Text className="font-bold tracking-tight text-white" style={{ fontSize: isTablet ? 40 : 32, lineHeight: isTablet ? 46 : 38 }}>
                {formatClock(now, locale)}
              </Text>
            </View>
            <Pressable onPress={goPicker} className="items-end active:opacity-80" accessibilityRole="button" accessibilityLabel={t("nextAdhan")}>
              <Text className={`text-[11px] font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>{t("nextAdhan")}</Text>
              {!ready || loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : next ? (
                <>
                  <Text className="text-base font-bold text-white">
                    {next.tomorrow ? t("p_subuhTomorrow") : t(next.labelKey)} · {next.time}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`} style={{ fontVariant: ["tabular-nums"] }}>
                    {formatCountdown(next.secondsLeft)}
                  </Text>
                </>
              ) : (
                <Text className="text-xs text-white">—</Text>
              )}
            </Pressable>
          </View>

          {/* Baris 3: strip 5 waktu shalat (waktu berikutnya disorot) */}
          {schedule ? (
            <View className="flex-row mt-3" style={{ gap: 6 }}>
              {prayerTimes.map((p) => {
                const active = !!next && p.labelKey === (next.tomorrow ? "p_subuh" : next.labelKey);
                return (
                  <View
                    key={p.key}
                    className="flex-1 items-center rounded-xl"
                    style={{
                      paddingVertical: 6,
                      backgroundColor: active ? "#fde68a" : "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Text numberOfLines={1} className={`text-[11px] font-semibold ${active ? "text-emerald-900" : "text-emerald-100"}`}>
                      {t(p.labelKey)}
                    </Text>
                    <Text numberOfLines={1} className={`text-sm font-bold ${active ? "text-emerald-900" : "text-white"}`} style={{ fontVariant: ["tabular-nums"] }}>
                      {p.time}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            !loading && (
              <Pressable onPress={goPicker} className="mt-3 rounded-xl px-3 py-2 active:opacity-80" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                <Text className="text-xs text-white">
                  {!lokasi ? t("chooseLocationHint") : error === "not_today" ? t("scheduleNotToday") : t("scheduleLoadFailed")}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* 2. MAIN CONTENT */}
        <View className="flex-1 mt-5" style={{ paddingHorizontal: pad }}>
          {/* Lanjutkan membaca */}
          <Pressable
            onPress={goLast}
            accessibilityRole="button"
            accessibilityLabel={t("continueReading")}
            className={`${theme.bgCard} rounded-3xl border ${theme.border} p-5 mb-4 shadow-sm active:opacity-90 overflow-hidden`}
            style={{ minHeight: 120 }}
          >
            <Text className={`text-sm font-bold mb-2 ${theme.textSecondary}`}>{t("continueReading")}</Text>
            {last ? (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className={`text-2xl font-extrabold ${theme.text}`} numberOfLines={1}>{last.namaLatin}</Text>
                    <Text className={`text-sm mt-0.5 ${theme.textSecondary}`}>
                      {t("verseOfTotal", { a: last.ayatNomor, n: last.totalAyat })}
                    </Text>
                  </View>
                </View>
                <View className={`h-2.5 rounded-full mt-4 ${isDarkMode ? "bg-gray-700" : "bg-[#e9dfc2]"}`}>
                  <View className="h-2.5 rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                </View>
              </>
            ) : (
              <Text className={`text-base ${theme.text}`}>{t("noReadingYet")}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push("/screen/jurnal-kesehatan/jurnal-kesehatan" as any)}
            className={`${theme.bgCard} rounded-3xl border ${theme.border} py-6 flex-row items-center justify-center gap-3 mb-8 shadow-sm active:opacity-90`}
          >
            <FileText size={28} color={theme.iconColor} />
            <Text className={`font-bold text-lg ${isDarkMode ? "text-gray-100" : "text-[#7a6132]"}`}>
              {t("healthJournal")}
            </Text>
          </Pressable>

          <Text className={`font-bold text-lg mb-4 ${theme.text}`}>{t("exploreFeatures")}</Text>
          <View className="flex-row flex-wrap justify-between mb-8">
            {FEATURES.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => router.push(f.route as any)}
                accessibilityRole="button"
                accessibilityLabel={f.label}
                style={{ width: cardW, minHeight: 112 }}
                className={`${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center justify-center mb-4 shadow-sm active:opacity-90`}
              >
                <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                  {f.Icon ? (
                    <f.Icon size={28} color={theme.iconColor} />
                  ) : (
                    <Image source={f.icon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                  )}
                </View>
                <Text numberOfLines={2} className={`font-bold text-sm text-center ${theme.text}`}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
            {isTablet && (
              <Pressable
                onPress={() => router.push("/screen/mengajar/mengajar" as any)}
                accessibilityRole="button"
                accessibilityLabel={t("teachTitle")}
                style={{ width: cardW, minHeight: 112 }}
                className={`${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center justify-center mb-4 shadow-sm active:opacity-90`}
              >
                <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                  <GraduationCap size={28} color={theme.iconColor} />
                </View>
                <Text numberOfLines={2} className={`font-bold text-sm text-center ${theme.text}`}>{t("teachTitle")}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
