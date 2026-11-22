import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Timer, Type } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { TAJWEED_CAT_KEY } from "../../../src/i18n/translations";
import { TAJWEED_DATA, getTajweedById } from "../../../src/data/tajweed";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";

export default function TajweedDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  const rule = getTajweedById(String(id));

  const accent = isDarkMode ? "#34d399" : "#047857";
  const idx = rule ? TAJWEED_DATA.findIndex((r) => r.id === rule.id) : -1;
  const prev = idx > 0 ? TAJWEED_DATA[idx - 1] : null;
  const next = idx >= 0 && idx < TAJWEED_DATA.length - 1 ? TAJWEED_DATA[idx + 1] : null;

  const Header = (
    <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 14 }}>
      <BatikPattern cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
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
          <Text className="text-xs font-bold tracking-[2px] text-emerald-100">
            {rule ? (TAJWEED_CAT_KEY[rule.kategori] ? t(TAJWEED_CAT_KEY[rule.kategori]) : rule.kategori).toUpperCase() : t("featTajweed").toUpperCase()}
          </Text>
          <Text className="text-lg font-extrabold text-white" numberOfLines={1}>{rule ? rule.judul : t("notFound")}</Text>
        </View>
        {rule ? (
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 28, lineHeight: 48, color: "#fde68a" }}>{rule.arab}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!rule) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
        {Header}
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-center mb-4 ${theme.textMuted}`}>{t("ruleNotFound")}</Text>
          <Pressable onPress={() => router.back()} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
            <Text className="text-white font-semibold">{t("back")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {Header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 860 }}>
        {/* Judul Arab */}
        <View className={`items-center p-6 rounded-3xl overflow-hidden border ${theme.border} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fffcf5]"} mb-5`}>
          <BatikPattern color={accent} cell={56} opacity={0.07} strokeWidth={1.4} />
          <Text className={`text-4xl mb-2 ${theme.text}`} style={{ fontFamily: ARABIC_FONT, textAlign: "center" }}>
            {rule.arab}
          </Text>
          <Text className={`text-sm ${theme.textMuted} text-center`}>{rule.ringkas}</Text>
        </View>

        {/* Huruf & durasi */}
        {(rule.huruf || rule.durasi) && (
          <View className="flex-row gap-3 mb-5">
            {rule.huruf ? (
              <View className={`flex-1 p-4 rounded-3xl border ${theme.border} ${theme.bgCard}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <Type size={16} color={accent} />
                  <Text className={`text-xs font-bold ${theme.textSecondary}`}>{t("lettersCaps")}</Text>
                </View>
                <Text className={`text-lg ${theme.text}`} style={{ fontFamily: ARABIC_FONT }}>
                  {rule.huruf}
                </Text>
              </View>
            ) : null}
            {rule.durasi ? (
              <View className={`flex-1 p-4 rounded-3xl border ${theme.border} ${theme.bgCard}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <Timer size={16} color={accent} />
                  <Text className={`text-xs font-bold ${theme.textSecondary}`}>{t("durationCaps")}</Text>
                </View>
                <Text className={`text-base font-semibold ${theme.text}`}>{rule.durasi}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Cara baca */}
        <Text className={`text-sm font-bold mb-2 ${theme.text}`}>{t("howToRecite")}</Text>
        <Text className={`text-sm leading-6 mb-6 ${theme.textMuted}`}>{rule.cara}</Text>

        {/* Contoh */}
        <Text className={`text-sm font-bold mb-3 ${theme.text}`}>{t("examples")}</Text>
        {rule.contoh.map((c, i) => (
          <View key={i} className={`p-4 rounded-3xl border ${theme.border} ${theme.bgCard} mb-3`}>
            <Text className={`text-2xl ${theme.text}`} style={{ fontFamily: ARABIC_FONT, textAlign: "right", lineHeight: 44 }}>
              {c.arab}
            </Text>
            {c.ket ? <Text className={`text-xs mt-1 ${theme.textMuted}`}>{c.ket}</Text> : null}
          </View>
        ))}

        {/* Catatan */}
        {rule.catatan ? (
          <View className={`mt-3 p-4 rounded-2xl ${isDarkMode ? "bg-amber-900/20" : "bg-amber-50"} border ${isDarkMode ? "border-amber-800/40" : "border-amber-200"}`}>
            <Text className={`text-xs font-bold mb-1 ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>{t("noteLabel")}</Text>
            <Text className={`text-xs leading-5 ${isDarkMode ? "text-amber-200" : "text-amber-900"}`}>{rule.catatan}</Text>
          </View>
        ) : null}

        {/* Prev / Next */}
        <View className="flex-row gap-3 mt-8">
          <Pressable
            disabled={!prev}
            onPress={() => prev && router.replace(`/screen/tajweed/${prev.id}`)}
            style={{ minHeight: 52 }}
            className={`flex-1 flex-row items-center px-4 py-3 rounded-3xl border ${theme.border} ${theme.bgCard} ${prev ? "active:opacity-80" : "opacity-30"}`}
          >
            <ChevronLeft size={18} color={theme.iconColor} style={flip} />
            <Text numberOfLines={1} className={`flex-1 ml-1 text-xs font-semibold ${theme.text}`}>
              {prev ? prev.judul : "—"}
            </Text>
          </Pressable>
          <Pressable
            disabled={!next}
            onPress={() => next && router.replace(`/screen/tajweed/${next.id}`)}
            style={{ minHeight: 52 }}
            className={`flex-1 flex-row items-center px-4 py-3 rounded-3xl border ${theme.border} ${theme.bgCard} ${next ? "active:opacity-80" : "opacity-30"}`}
          >
            <Text numberOfLines={1} className={`flex-1 mr-1 text-xs font-semibold text-right ${theme.text}`}>
              {next ? next.judul : "—"}
            </Text>
            <ChevronRight size={18} color={theme.iconColor} style={flip} />
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}