import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { getDaftarSurah } from "../services/quranService";
import { QURAN_FONT } from "../constants/fonts";

interface SurahRow {
  nomor: number;
  namaLatin: string;
  namaArab: string;
  arti: string;
  jumlahAyat: number;
}

interface Props {
  currentNomor: number;
  playingNomor?: number | null;
  onSelect: (nomor: number) => void;
  width?: number;
}

const ROW_H = 68;

/** Daftar surah permanen di sisi kiri (tablet), pengganti bottom sheet pemilih surah. */
export default function SurahSidePanel({ currentNomor, playingNomor, onSelect, width = 300 }: Props) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [list, setList] = useState<SurahRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const listRef = useRef<FlatList<SurahRow>>(null);

  useEffect(() => {
    let cancelled = false;
    getDaftarSurah()
      .then((d: SurahRow[]) => !cancelled && setList(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Jaga surah aktif tetap terlihat saat berpindah surah
  useEffect(() => {
    if (query || list.length === 0) return;
    const idx = Math.max(0, Math.min(currentNomor - 3, list.length - 1));
    listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, [currentNomor, list.length, query]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        String(s.nomor) === q ||
        s.namaLatin.toLowerCase().includes(q) ||
        (s.arti || "").toLowerCase().includes(q)
    );
  }, [list, query]);

  return (
    <View style={{ width }} className={`border-r ${theme.border} ${theme.bgCard}`}>
      <Text className={`px-5 pt-5 pb-3 text-xl font-extrabold ${theme.text}`}>{t("surahList")}</Text>
      <View
        className={`mx-4 mb-2 px-4 flex-row items-center gap-2 rounded-full border ${theme.border} ${theme.bg}`}
        style={{ height: 48 }}
      >
        <Search size={18} color={theme.iconColor} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchSurah")}
          placeholderTextColor={isDarkMode ? "#6B7280" : "#9a9486"}
          className={`flex-1 text-base ${theme.text}`}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDarkMode ? "#34d399" : "#047857"} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(s) => String(s.nomor)}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_d, i) => ({ length: ROW_H, offset: ROW_H * i, index: i })}
          initialScrollIndex={!query && currentNomor > 3 && list.length > 0 ? Math.min(currentNomor - 3, list.length - 1) : 0}
          onScrollToIndexFailed={() => {}}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const active = item.nomor === currentNomor;
            const playing = item.nomor === playingNomor;
            return (
              <Pressable
                onPress={() => onSelect(item.nomor)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={{ height: ROW_H - 4, marginBottom: 4, borderRadius: 18 }}
                className={`flex-row items-center px-3 active:opacity-70 ${active ? (isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100") : ""}`}
              >
                {/* nomor dalam bentuk belah ketupat, selaras dengan motif batik */}
                <View
                  style={{ width: 38, height: 38, borderRadius: 10, transform: [{ rotate: "45deg" }], marginRight: 16, marginLeft: 4 }}
                  className={`items-center justify-center ${active ? "bg-emerald-700" : isDarkMode ? "bg-gray-700" : "bg-[#e9dfc2]"}`}
                >
                  <Text style={{ transform: [{ rotate: "-45deg" }] }} className={`text-sm font-extrabold ${active ? "text-white" : theme.text}`}>
                    {item.nomor}
                  </Text>
                </View>
                <View className="flex-1 pr-2">
                  <Text numberOfLines={1} className={`text-base font-bold ${theme.text}`}>
                    {item.namaLatin}{playing ? "  ♪" : ""}
                  </Text>
                  <Text numberOfLines={1} className={`text-xs ${theme.textMuted}`}>
                    {item.arti} • {item.jumlahAyat} {t("versesWord")}
                  </Text>
                </View>
                <Text className={`text-xl ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`} style={{ fontFamily: QURAN_FONT }}>
                  {item.namaArab}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
