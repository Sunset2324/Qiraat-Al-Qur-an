import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BookMarked } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import BatikHeader from "../../../src/components/ui/BatikHeader";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { ARABIC_FONT } from "../../../src/constants/fonts";

/**
 * Pustaka eBook. Konten belum ada: layar ini sementara berisi keadaan "segera hadir"
 * yang ramah, supaya kartu di Beranda tidak membuka layar kosong.
 */
export default function EbookScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  const accent = isDarkMode ? "#34d399" : "#047857";

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <BatikHeader tag={t("ebookTag")} title={t("featEbook")} arabic="المكتبة" />

      <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}>
        <View
          className={`w-full rounded-3xl border ${theme.border} ${theme.bgCard} items-center overflow-hidden`}
          style={{ maxWidth: 560, paddingVertical: 36, paddingHorizontal: 24 }}
        >
          <BatikPattern color={accent} cell={56} opacity={0.07} strokeWidth={1.4} />

          <View className="bg-emerald-500/20 rounded-full items-center justify-center mb-5" style={{ width: 88, height: 88 }}>
            <BookMarked size={40} color={accent} />
          </View>

          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 26, lineHeight: 46, color: accent }}>اقْرَأْ</Text>

          <Text className={`text-xl font-extrabold text-center mt-2 ${theme.text}`}>{t("ebookSoonTitle")}</Text>
          <Text className={`text-base leading-7 text-center mt-3 ${theme.textMuted}`}>{t("ebookSoonMsg")}</Text>

          <Pressable
            onPress={() => router.push("/(tabs)/mushaf" as any)}
            accessibilityRole="button"
            className="mt-7 rounded-full bg-emerald-700 items-center justify-center active:opacity-90"
            style={{ minHeight: 48, paddingHorizontal: 24 }}
          >
            <Text className="text-white font-bold text-base">{t("ebookGoRead")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
