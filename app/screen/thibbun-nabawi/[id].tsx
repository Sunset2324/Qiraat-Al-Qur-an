import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, BookOpen } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import MedisDisclaimer from "../../../src/components/MedisDisclaimer";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { getTemaById, JUDUL_BUKU } from "../../../src/data/thibbunNabawi";
import { useAyatTema } from "../../../src/hooks/useAyatTema";

export default function ThibbunNabawiDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = getTemaById(String(id));
  const hasil = useAyatTema(tema?.surah ?? null, tema?.ayat ?? null);

  const accent = isDarkMode ? "#34d399" : "#047857";

  const Header = (
    <View className={`flex-row items-center px-4 py-4 border-b ${theme.border}`}>
      <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
        <ArrowLeft size={24} color={theme.iconColor} />
      </Pressable>
      <View className="items-center flex-1">
        <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>
          {tema ? tema.kategoriNama.toUpperCase() : "THIBBUN NABAWI"}
        </Text>
      </View>
      <View className="w-11" />
    </View>
  );

  if (!tema) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
        {Header}
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-center mb-4 ${theme.textMuted}`}>Tema tidak ditemukan.</Text>
          <Pressable onPress={() => router.back()} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
            <Text className="text-white font-semibold">Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const namaSurah = hasil.status === "ready" ? hasil.surah.namaLatin : `Surah ${tema.surah}`;

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {Header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <Text className={`text-2xl font-bold leading-8 mb-2 ${theme.text}`}>{tema.tema}</Text>
        <Text className={`text-xs mb-6 ${theme.textMuted}`}>
          {JUDUL_BUKU}
          {tema.halaman ? ` • Hal. ${tema.halaman}` : ""}
        </Text>

        {/* Kutipan ayat */}
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-5`}>
          <Text className={`text-xs font-bold mb-4 ${theme.textSecondary}`}>
            QS. {namaSurah}: {tema.ayat}
          </Text>

          {hasil.status === "loading" && (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color={theme.iconColor} />
              <Text className={`text-xs mt-3 ${theme.textMuted}`}>Memuat ayat...</Text>
            </View>
          )}

          {hasil.status === "error" && (
            <View className="items-center py-6">
              <Text className={`text-center text-sm mb-4 ${theme.textMuted}`}>{hasil.message}</Text>
              <Pressable onPress={hasil.retry} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
                <Text className="text-white font-semibold">Coba lagi</Text>
              </Pressable>
            </View>
          )}

          {hasil.status === "ready" && (
            <View>
              <Text
                className={theme.text}
                style={{
                  fontFamily: ARABIC_FONT,
                  fontSize: 26,
                  lineHeight: 58,
                  textAlign: "right",
                  writingDirection: "rtl",
                  includeFontPadding: false,
                }}
              >
                {hasil.ayat.teksArab}
              </Text>
              {hasil.ayat.teksLatin ? (
                <Text className={`text-sm italic leading-6 mt-4 ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                  {hasil.ayat.teksLatin}
                </Text>
              ) : null}
              {hasil.ayat.teksIndonesia ? (
                <Text className={`text-sm leading-6 mt-3 ${theme.textMuted}`}>{hasil.ayat.teksIndonesia}</Text>
              ) : null}
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.push(`/screen/surah/${tema.surah}?ayat=${tema.ayat}`)}
          className={`flex-row items-center justify-center gap-2 p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6 active:opacity-80`}
        >
          <BookOpen size={18} color={accent} />
          <Text className={`text-sm font-semibold ${theme.text}`}>Baca surah lengkap</Text>
        </Pressable>

        <MedisDisclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}