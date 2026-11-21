import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useIsFocused } from "expo-router";
import { ArrowLeft, RefreshCw, Compass, Navigation } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { useQibla } from "../../../src/hooks/useQibla";
import QiblaCompass, { ALIGN_TOLERANCE } from "../../../src/components/QiblaCompass";
import { angleDiff } from "../../../src/utils/qibla";

export default function KiblatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip, locale } = useLanguage();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  const q = useQibla(focused);
  const size = Math.min(width - 48, 340);

  const diff = q.bearing !== null && q.heading !== null ? angleDiff(q.bearing, q.heading) : null;
  const aligned = diff !== null && Math.abs(diff) <= ALIGN_TOLERANCE;
  const num = (n: number, d = 0) => n.toLocaleString(locale, { maximumFractionDigits: d });

  const instruction =
    diff === null
      ? q.bearing !== null
        ? t("qiblaBearing", { d: num(q.bearing, 1) })
        : t("qiblaLocating")
      : aligned
      ? t("qiblaAligned")
      : diff > 0
      ? t("qiblaTurnRight", { d: Math.round(Math.abs(diff)) })
      : t("qiblaTurnLeft", { d: Math.round(Math.abs(diff)) });

  const accLabel =
    q.accuracy === "high" ? t("qiblaAccHigh") : q.accuracy === "mid" ? t("qiblaAccMid") : q.accuracy === "low" ? t("qiblaAccLow") : "—";
  const srcLabel = q.source === "aladhan" ? t("qiblaSrcAladhan") : q.source === "cached" ? t("qiblaSrcCached") : t("qiblaSrcLocal");

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View className={`flex-row items-center justify-between py-3 border-b ${theme.border}`}>
      <Text className={`text-sm ${theme.textMuted}`}>{label}</Text>
      <Text className={`text-sm font-semibold ${theme.text}`}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`flex-row items-center px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={24} color={theme.iconColor} style={flip} />
        </Pressable>
        <Text className={`text-xl font-bold flex-1 ${theme.text}`}>{t("qiblaTitle")}</Text>
        <Pressable onPress={q.refresh} hitSlop={10} accessibilityLabel={t("qiblaRefresh")} className="p-2">
          <RefreshCw size={20} color={theme.iconColor} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <View className="items-center mb-6">
          <Text
            className={`text-lg font-bold mb-5 text-center ${aligned ? (isDarkMode ? "text-emerald-400" : "text-emerald-700") : theme.text}`}
          >
            {instruction}
          </Text>
          <QiblaCompass size={size} bearing={q.bearing} heading={q.heading} />
        </View>

        {q.status === "no_location" && (
          <Notice text={t("qiblaNoLocation")} dark={isDarkMode} />
        )}
        {q.status === "gps_denied" && <Notice text={t("qiblaGpsDenied")} dark={isDarkMode} />}
        {q.sensorFailed && <Notice text={t("qiblaNoSensor")} dark={isDarkMode} />}
        {!q.sensorFailed && q.accuracy === "low" && <Notice text={t("qiblaCalibrate")} dark={isDarkMode} />}

        <View className={`rounded-2xl border px-4 ${theme.border} ${theme.bgCard}`}>
          <Row label={t("qiblaTitle")} value={q.bearing !== null ? t("qiblaBearing", { d: num(q.bearing, 2) }) : "—"} />
          <Row label={t("qiblaHeading")} value={q.heading !== null ? `${num(q.heading, 0)}°` : "—"} />
          <Row label={t("qiblaAccuracy")} value={accLabel} />
          <Row label={t("qiblaDistance")} value={q.distanceKm !== null ? `${num(q.distanceKm)} km` : "—"} />
          <Row
            label={t("qiblaMyLocation")}
            value={q.coords ? `${q.coords.lat.toFixed(4)}, ${q.coords.lng.toFixed(4)}` : "—"}
          />
          <View className="py-3 flex-row items-center gap-2">
            <Navigation size={14} color={theme.mutedColor} />
            <Text className={`text-xs flex-1 ${theme.textMuted}`}>{srcLabel}</Text>
          </View>
        </View>

        <View className="flex-row items-start gap-2 mt-4">
          <Compass size={14} color={theme.mutedColor} style={{ marginTop: 2 }} />
          <Text className={`text-xs flex-1 leading-5 ${theme.textMuted}`}>{t("qiblaFlatHint")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Notice({ text, dark }: { text: string; dark: boolean }) {
  return (
    <View className={`mb-4 p-4 rounded-2xl border ${dark ? "bg-amber-900/20 border-amber-800" : "bg-amber-50 border-amber-200"}`}>
      <Text className={`text-xs leading-5 ${dark ? "text-amber-200" : "text-amber-900"}`}>{text}</Text>
    </View>
  );
}
