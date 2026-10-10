import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Timer, Type } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { TAJWEED_DATA, getTajweedById } from "../../../src/data/tajweed";

export default function TajweedDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rule = getTajweedById(String(id));

  const accent = isDarkMode ? "#34d399" : "#047857";
  const idx = rule ? TAJWEED_DATA.findIndex((r) => r.id === rule.id) : -1;
  const prev = idx > 0 ? TAJWEED_DATA[idx - 1] : null;
  const next = idx >= 0 && idx < TAJWEED_DATA.length - 1 ? TAJWEED_DATA[idx + 1] : null;

  const Header = (
    <View className={`flex-row items-center px-4 py-4 border-b ${theme.border}`}>
      <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
        <ArrowLeft size={24} color={theme.iconColor} />
      </Pressable>
      <View className="items-center flex-1">
        <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>
          {rule ? rule.kategori.toUpperCase() : "TAJWEED"}
        </Text>
        <Text className={`text-base font-bold ${theme.text}`}>{rule ? rule.judul : "Tidak ditemukan"}</Text>
      </View>
      <View className="w-11" />
    </View>
  );

  if (!rule) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
        {Header}
        <View className="flex-1 items-center justify-center px-6">
          <Text className={`text-center mb-4 ${theme.textMuted}`}>Hukum tajweed tidak ditemukan.</Text>
          <Pressable onPress={() => router.back()} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
            <Text className="text-white font-semibold">Kembali</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {Header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Judul Arab */}
        <View className={`items-center p-6 rounded-2xl border ${theme.border} ${theme.bgCard} mb-5`}>
          <Text className={`text-3xl mb-2 ${theme.text}`} style={{ fontFamily: "System", textAlign: "center" }}>
            {rule.arab}
          </Text>
          <Text className={`text-sm ${theme.textMuted} text-center`}>{rule.ringkas}</Text>
        </View>

        {/* Huruf & durasi */}
        {(rule.huruf || rule.durasi) && (
          <View className="flex-row gap-3 mb-5">
            {rule.huruf ? (
              <View className={`flex-1 p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <Type size={16} color={accent} />
                  <Text className={`text-xs font-bold ${theme.textSecondary}`}>HURUF</Text>
                </View>
                <Text className={`text-lg ${theme.text}`} style={{ fontFamily: "System" }}>
                  {rule.huruf}
                </Text>
              </View>
            ) : null}
            {rule.durasi ? (
              <View className={`flex-1 p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
                <View className="flex-row items-center gap-2 mb-2">
                  <Timer size={16} color={accent} />
                  <Text className={`text-xs font-bold ${theme.textSecondary}`}>DURASI</Text>
                </View>
                <Text className={`text-base font-semibold ${theme.text}`}>{rule.durasi}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Cara baca */}
        <Text className={`text-sm font-bold mb-2 ${theme.text}`}>Cara Membaca</Text>
        <Text className={`text-sm leading-6 mb-6 ${theme.textMuted}`}>{rule.cara}</Text>

        {/* Contoh */}
        <Text className={`text-sm font-bold mb-3 ${theme.text}`}>Contoh</Text>
        {rule.contoh.map((c, i) => (
          <View key={i} className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-3`}>
            <Text className={`text-2xl ${theme.text}`} style={{ fontFamily: "System", textAlign: "right", lineHeight: 44 }}>
              {c.arab}
            </Text>
            {c.ket ? <Text className={`text-xs mt-1 ${theme.textMuted}`}>{c.ket}</Text> : null}
          </View>
        ))}

        {/* Catatan */}
        {rule.catatan ? (
          <View className={`mt-3 p-4 rounded-2xl ${isDarkMode ? "bg-amber-900/20" : "bg-amber-50"} border ${isDarkMode ? "border-amber-800/40" : "border-amber-200"}`}>
            <Text className={`text-xs font-bold mb-1 ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>Catatan</Text>
            <Text className={`text-xs leading-5 ${isDarkMode ? "text-amber-200" : "text-amber-900"}`}>{rule.catatan}</Text>
          </View>
        ) : null}

        {/* Prev / Next */}
        <View className="flex-row gap-3 mt-8">
          <Pressable
            disabled={!prev}
            onPress={() => prev && router.replace(`/screen/tajweed/${prev.id}`)}
            className={`flex-1 flex-row items-center p-3 rounded-2xl border ${theme.border} ${theme.bgCard} ${prev ? "active:opacity-80" : "opacity-30"}`}
          >
            <ChevronLeft size={18} color={theme.iconColor} />
            <Text numberOfLines={1} className={`flex-1 ml-1 text-xs font-semibold ${theme.text}`}>
              {prev ? prev.judul : "—"}
            </Text>
          </Pressable>
          <Pressable
            disabled={!next}
            onPress={() => next && router.replace(`/screen/tajweed/${next.id}`)}
            className={`flex-1 flex-row items-center p-3 rounded-2xl border ${theme.border} ${theme.bgCard} ${next ? "active:opacity-80" : "opacity-30"}`}
          >
            <Text numberOfLines={1} className={`flex-1 mr-1 text-xs font-semibold text-right ${theme.text}`}>
              {next ? next.judul : "—"}
            </Text>
            <ChevronRight size={18} color={theme.iconColor} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}