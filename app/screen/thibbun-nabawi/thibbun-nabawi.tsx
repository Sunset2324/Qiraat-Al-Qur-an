import { useState, useMemo, useEffect, useDeferredValue, useCallback } from "react";
import { View, Text, FlatList, Pressable, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, X, ChevronRight, Heart, Activity, Sparkles, Moon, BookOpen } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import MedisDisclaimer from "../../../src/components/MedisDisclaimer";
import { KATEGORI_LIST, TEMA_LIST, JUDUL_BUKU, cariTema, TemaMedis } from "../../../src/data/thibbunNabawi";
import { getDaftarSurah } from "../../../src/services/quranService";

const IKON_KATEGORI: Record<string, any> = {
  RUHANI: Heart,
  RAGAWI: Activity,
  HIKMAH_IBADAH: Sparkles,
  ALA_NABI: Moon,
};

export default function ThibbunNabawiScreen() {
  const { isDarkMode, theme } = useTheme();
  const [query, setQuery] = useState("");
  const [kategoriId, setKategoriId] = useState<string | null>(null);
  const [namaSurah, setNamaSurah] = useState<Record<number, string>>({});

  const mutedColor = isDarkMode ? "#9ca3af" : "#6b6558";
  const accent = isDarkMode ? "#34d399" : "#047857";

  // Nama surah hanya pemanis tampilan; kalau gagal dimuat, cukup tampil nomor.
  useEffect(() => {
    getDaftarSurah()
      .then((list: any[]) => {
        const map: Record<number, string> = {};
        list.forEach((s) => (map[s.nomor] = s.namaLatin));
        setNamaSurah(map);
      })
      .catch(() => {});
  }, []);

  const deferredQuery = useDeferredValue(query);
  const hasil = useMemo(() => cariTema(deferredQuery, kategoriId), [deferredQuery, kategoriId]);

  const renderItem = useCallback(
    ({ item }: { item: TemaMedis }) => {
      const Ikon = IKON_KATEGORI[item.kategoriId] ?? BookOpen;
      return (
        <Pressable
          onPress={() => router.push(`/screen/thibbun-nabawi/${item.id}`)}
          className={`mb-3 p-4 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
        >
          <View className="flex-row items-center gap-3">
            <View className={`p-2.5 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
              <Ikon size={20} color={accent} />
            </View>
            <View className="flex-1">
              <Text className={`text-base font-semibold leading-6 ${theme.text}`}>{item.tema}</Text>
              <Text className={`text-xs mt-1 ${theme.textMuted}`}>
                QS. {namaSurah[item.surah] ?? item.surah}: {item.ayat}
                {item.halaman ? `  •  Hal. ${item.halaman}` : ""}
              </Text>
            </View>
            <ChevronRight size={18} color={mutedColor} />
          </View>
        </Pressable>
      );
    },
    [theme, isDarkMode, accent, mutedColor, namaSurah]
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {/* HEADER */}
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>KESEHATAN</Text>
          <Text className={`text-base font-bold ${theme.text}`}>Thibbun Nabawi</Text>
        </View>
        <View className="w-11" />
      </View>

      {/* SEARCH + FILTER (di luar list supaya keyboard tidak tertutup saat mengetik) */}
      <View className="px-6 pt-4">
        <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <Search size={20} color={mutedColor} />
          <TextInput
            placeholder="Cari tema, atau ketik 2:255"
            placeholderTextColor={mutedColor}
            className={`flex-1 ml-3 ${theme.text}`}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <X size={18} color={mutedColor} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 mb-1" keyboardShouldPersistTaps="handled">
          {[null, ...KATEGORI_LIST.map((k) => k.id)].map((id) => {
            const aktif = kategoriId === id;
            const label = id === null ? "Semua" : KATEGORI_LIST.find((k) => k.id === id)!.nama.replace(/^[IVX]+\.\s*/, "");
            return (
              <Pressable
                key={id ?? "all"}
                onPress={() => setKategoriId(id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  aktif ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <Text className={`text-xs font-medium ${aktif ? "text-white" : theme.text}`}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={hasil}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={9}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 60 }}
        ListHeaderComponent={
          <View className="mb-4">
            <MedisDisclaimer />
            <Text className={`text-xs mt-4 ${theme.textMuted}`}>
              Sumber: {JUDUL_BUKU} • {hasil.length} dari {TEMA_LIST.length} tema
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Search size={48} color={mutedColor} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>Tidak ada tema yang cocok</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}