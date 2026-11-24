import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Tablet } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import CompareRiwayat from "../../../src/components/teach/CompareRiwayat";

/**
 * Mode Mengajar = Bandingkan Riwayat (tablet).
 * Papan Tajwid dihapus dari modul ini (24 Nov 2026); materi tajwid akan direvisi terpisah.
 */
export default function MengajarScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const isTablet = useIsTablet();

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`${theme.bgHeader} px-6 py-4 flex-row items-center overflow-hidden`}>
        <BatikPattern cell={42} opacity={0.14} />
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("back")}
          style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={26} color="#fff" style={flip} />
        </Pressable>
        <View className="flex-1 ml-4">
          <Text className="text-white text-xl font-extrabold">{t("teachTitle")}</Text>
          <Text className="text-emerald-100 text-sm font-semibold">{t("teachSubtitle")}</Text>
        </View>
        <Text style={{ fontFamily: ARABIC_FONT, fontSize: 30, color: "#fde68a", lineHeight: 48 }}>عَلِّمُوا وَيَسِّرُوا</Text>
      </View>

      {isTablet ? (
        <CompareRiwayat />
      ) : (
        // Dua panel butuh layar lebar; di HP hanya keterangan
        <View className="flex-1 items-center justify-center p-8">
          <View className={`items-center rounded-3xl border p-6 ${theme.border} ${theme.bgCard}`} style={{ maxWidth: 420 }}>
            <Tablet size={40} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-base font-extrabold text-center mt-3 ${theme.text}`}>{t("teachTabletOnly")}</Text>
            <Text className={`text-sm text-center leading-6 mt-1 ${theme.textSecondary}`}>{t("teachTabletOnlyDesc")}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
