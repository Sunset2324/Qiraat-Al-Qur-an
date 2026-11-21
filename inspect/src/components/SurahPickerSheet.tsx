import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Search } from "lucide-react-native";
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
  visible: boolean;
  currentNomor: number;
  /** nomor surah yang sedang diputar di pemutar (opsional, diberi penanda) */
  playingNomor?: number | null;
  onClose: () => void;
  onSelect: (nomor: number) => void;
}

const ROW_H = 64;

/** Bottom sheet daftar 114 surah untuk pindah surah langsung dari layar surah. */
export default function SurahPickerSheet({ visible, currentNomor, playingNomor, onClose, onSelect }: Props) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [list, setList] = useState<SurahRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const listRef = useRef<FlatList<SurahRow>>(null);

  useEffect(() => {
    if (!visible || list.length > 0) return;
    let cancelled = false;
    setLoading(true);
    getDaftarSurah()
      .then((d: SurahRow[]) => !cancelled && setList(d))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [visible, list.length]);

  useEffect(() => {
    if (visible) setQuery("");
  }, [visible]);

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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={t("back")} />
        <SafeAreaView
          edges={["bottom"]}
          className={`${theme.bg} rounded-t-3xl border-t ${theme.border}`}
          style={{ height: "75%" }}
        >
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text className={`text-base font-bold ${theme.text}`}>{t("pickSurah")}</Text>
            <Pressable onPress={onClose} hitSlop={10} className="h-9 w-9 items-center justify-center active:opacity-60">
              <X size={20} color={theme.iconColor} />
            </Pressable>
          </View>

          <View className={`mx-5 mb-2 px-3 flex-row items-center gap-2 rounded-xl border ${theme.border} ${theme.bgCard}`}>
            <Search size={16} color={theme.iconColor} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("searchSurah")}
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              className={`flex-1 py-2.5 text-sm ${theme.text}`}
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
              initialScrollIndex={
                !query && currentNomor > 3 && list.length > 0 ? Math.min(currentNomor - 3, list.length - 1) : 0
              }
              renderItem={({ item }) => {
                const active = item.nomor === currentNomor;
                const playing = item.nomor === playingNomor;
                return (
                  <Pressable
                    onPress={() => onSelect(item.nomor)}
                    style={{ height: ROW_H }}
                    className={`flex-row items-center px-5 active:opacity-70 ${active ? (isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50") : ""}`}
                  >
                    <View
                      className={`h-9 w-9 rounded-full items-center justify-center mr-3 border ${active ? "bg-emerald-600 border-emerald-600" : isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    >
                      <Text className={`text-xs font-bold ${active ? "text-white" : theme.text}`}>{item.nomor}</Text>
                    </View>
                    <View className="flex-1">
                      <Text numberOfLines={1} className={`text-sm font-bold ${theme.text}`}>
                        {item.namaLatin}{playing ? "  ♪" : ""}
                      </Text>
                      <Text numberOfLines={1} className={`text-[11px] ${theme.textMuted}`}>
                        {item.arti} • {item.jumlahAyat} {t("versesWord")}
                      </Text>
                    </View>
                    <Text className={`text-lg ${theme.text}`} style={{ fontFamily: QURAN_FONT }}>
                      {item.namaArab}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
