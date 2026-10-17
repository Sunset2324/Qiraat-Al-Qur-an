import { View, Text, Pressable, ScrollView, ActivityIndicator, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FileText, CloudSun, MapPin } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { useJadwalHariIni, formatCountdown } from "../../src/hooks/useJadwalHariIni";
import { formatClock, formatHijri } from "../../src/utils/dateFormat";

export default function DashboardScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, locale } = useLanguage();
  const { width } = useWindowDimensions();
  const { lokasi, ready, loading, error, next, now } = useJadwalHariIni();

  // Kartu fitur: 2 kolom di HP, 3 kolom di layar lebar (tablet)
  const cols = width >= 700 ? 3 : 2;
  const cardW = `${Math.floor(100 / cols) - 2}%` as const;

  const hijri = formatHijri(now, locale);
  const goPicker = () => router.push("/screen/jadwal-shalat/jadwal-shalat");

  const FEATURES = [
    { key: "qiraat", label: t("featQiraat"), icon: require("../../assets/icons/qiraat.png"), route: "/screen/qiraat/qiraat" },
    { key: "dzikir", label: t("featDzikir"), icon: require("../../assets/icons/dzikir&doa.png"), route: "/screen/dzikir-doa/dzikir-doa" },
    { key: "prayer", label: t("featPrayer"), icon: require("../../assets/icons/jadwal-shalat.png"), route: "/screen/jadwal-shalat/jadwal-shalat" },
    { key: "tajweed", label: t("featTajweed"), icon: require("../../assets/icons/tajweed.png"), route: "/screen/tajweed/tajweed" },
    { key: "thibbun", label: t("featThibbun"), icon: require("../../assets/icons/thibbun-nabawi.png"), route: "/screen/thibbun-nabawi/thibbun-nabawi" },
  ] as const;

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* 1. HEADER: Jam & Adzan */}
        <View className={`${theme.bgHeader} rounded-b-[40px] px-6 pt-6 pb-24 relative overflow-hidden`}>
          <View className={`absolute -right-10 -top-10 h-40 w-40 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-700"} rounded-full opacity-50`} />

          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3">
              <Pressable onPress={goPicker} className="flex-row items-center gap-1.5 active:opacity-70" hitSlop={8}>
                <MapPin size={14} color={isDarkMode ? "#6ee7b7" : "#d1fae5"} />
                <Text
                  numberOfLines={1}
                  className={`text-sm font-medium flex-shrink ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}
                >
                  {lokasi ? lokasi.kota : t("chooseLocation")}
                </Text>
              </Pressable>
              <Text className="text-4xl font-bold mt-1 tracking-tight text-white">{formatClock(now, locale)}</Text>
              {!!hijri && (
                <Text className={`text-xs mt-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>{hijri}</Text>
              )}
            </View>
            <View className={`${isDarkMode ? "bg-emerald-800" : "bg-emerald-700/50"} p-3 rounded-2xl`}>
              <CloudSun size={24} color="#fbbf24" />
            </View>
          </View>

          <Pressable
            onPress={goPicker}
            className={`${isDarkMode ? "bg-emerald-900/60" : "bg-emerald-700/40"} p-4 rounded-2xl border ${isDarkMode ? "border-emerald-700" : "border-emerald-600/50"} mt-2 active:opacity-90`}
          >
            <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
              {!ready || loading ? t("loadingSchedule") : t("nextAdhan")}
            </Text>

            {!ready || loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : next ? (
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold text-white">
                    {next.tomorrow ? t("p_subuhTomorrow") : t(next.labelKey)}
                  </Text>
                  <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
                    {formatCountdown(next.secondsLeft)}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-white">{next.time}</Text>
              </View>
            ) : (
              <Text className="text-sm text-white">
                {!lokasi ? t("chooseLocationHint") : error === "not_today" ? t("scheduleNotToday") : t("scheduleLoadFailed")}
              </Text>
            )}
          </Pressable>
        </View>

        {/* 2. MAIN CONTENT */}
        <View className="flex-1 px-6 -mt-16">
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
                  <Image source={f.icon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                </View>
                <Text numberOfLines={2} className={`font-bold text-sm text-center ${theme.text}`}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
