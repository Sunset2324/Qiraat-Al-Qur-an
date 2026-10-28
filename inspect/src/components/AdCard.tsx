import { View, Text, Pressable, Image, ActivityIndicator, Linking, Alert } from "react-native";
import { ExternalLink } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { ARABIC_FONT } from "../constants/fonts";
import { useAyatTema } from "../hooks/useAyatTema";
import type { Iklan } from "../services/adsService";

/** Kartu iklan: gambar 16:9, lalu kutipan ayat Thibbun Nabawi, lalu tombol ke produk. */
export default function AdCard({ ad }: { ad: Iklan }) {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const hasil = useAyatTema(ad.surah, ad.ayat);
  const accent = isDarkMode ? "#34d399" : "#047857";

  const buka = async () => {
    try {
      await Linking.openURL(ad.productUrl);
    } catch {
      Alert.alert(t("adOpenFailed"));
    }
  };

  return (
    <View className={`mb-5 rounded-3xl border overflow-hidden ${theme.border} ${theme.bgCard}`}>
      <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: isDarkMode ? "#16231f" : "#efe6c8" }}>
        <Image
          source={{ uri: ad.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
          accessibilityLabel={ad.title}
        />
        <View
          style={{ position: "absolute", top: 10, start: 10, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}
        >
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{t("adLabel")}</Text>
        </View>
      </View>

      <View className="p-4">
        {ad.tema ? (
          <Text className={`text-xs font-semibold mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`} numberOfLines={2}>
            {ad.tema}
          </Text>
        ) : null}
        <Text className={`text-lg font-bold leading-6 ${theme.text}`}>{ad.title}</Text>
        {ad.description ? <Text className={`text-sm leading-5 mt-1 ${theme.textMuted}`}>{ad.description}</Text> : null}

        <View className={`mt-4 p-3 rounded-2xl border ${theme.border} ${isDarkMode ? "bg-emerald-900/20" : "bg-emerald-50"}`}>
          {hasil.status === "loading" && <ActivityIndicator color={accent} />}
          {hasil.status === "error" && (
            <Pressable onPress={hasil.retry} accessibilityRole="button">
              <Text className={`text-xs ${theme.textMuted}`}>{t("adQuoteFailed")}</Text>
            </Pressable>
          )}
          {hasil.status === "ready" && (
            <View>
              <Text
                className={theme.text}
                style={{
                  fontFamily: ARABIC_FONT,
                  fontSize: 22,
                  lineHeight: 46,
                  textAlign: "right",
                  writingDirection: "rtl",
                  includeFontPadding: false,
                }}
              >
                {hasil.ayat.teksArab}
              </Text>
              {hasil.ayat.teksIndonesia ? (
                <Text className={`text-xs leading-5 mt-2 ${theme.textMuted}`}>{hasil.ayat.teksIndonesia}</Text>
              ) : null}
              <Text className={`text-xs font-semibold mt-2 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                {`QS ${hasil.surah.namaLatin ?? ad.surah}: ${ad.ayat}`}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={buka}
          accessibilityRole="link"
          accessibilityLabel={`${ad.ctaLabel || t("adOpenProduct")}: ${ad.title}`}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl py-3.5 bg-emerald-700 active:opacity-90"
          style={{ minHeight: 48 }}
        >
          <Text className="text-white font-bold text-base">{ad.ctaLabel || t("adOpenProduct")}</Text>
          <ExternalLink size={18} color="#fff" style={flip} />
        </Pressable>
      </View>
    </View>
  );
}
