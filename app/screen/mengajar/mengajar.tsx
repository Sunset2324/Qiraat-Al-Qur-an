import { useState } from "react";
import { View, Text, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import CompareRiwayat from "../../../src/components/teach/CompareRiwayat";

type Rule = { nama: string; judul: string; contoh: { ar: string; arti: string }[]; catatan: string };

// Materi papan: contoh bacaan per hukum tajwid dasar (konten pengajar)
const RULES: Rule[] = [
  {
    nama: "Idgham",
    judul: "IDGHAM BIGHUNNAH",
    catatan: "Nun sukun/tanwin bertemu ya’, nun, mim, wawu: dilebur disertai dengung ± 2 harakat.",
    contoh: [
      { ar: "مَن يَقُولُ", arti: "Nun sukun bertemu ya’" },
      { ar: "مِن نُّورٍ", arti: "Nun sukun bertemu nun" },
    ],
  },
  {
    nama: "Ikhfa’",
    judul: "IKHFA’ HAQIQI",
    catatan: "Nun sukun/tanwin bertemu 15 huruf ikhfa’: dibaca samar dengan dengung.",
    contoh: [
      { ar: "مِن قَبْلُ", arti: "Nun sukun bertemu qaf" },
      { ar: "أَنفُسَهُمْ", arti: "Nun sukun bertemu fa’" },
    ],
  },
  {
    nama: "Iqlab",
    judul: "IQLAB",
    catatan: "Nun sukun/tanwin bertemu ba’: ditukar menjadi mim, bibir dirapatkan ringan, dengung 2 harakat.",
    contoh: [
      { ar: "مِنۢ بَعْدِ", arti: "Nun sukun bertemu ba’" },
      { ar: "سَمِيعٌۢ بَصِيرٌ", arti: "Tanwin bertemu ba’" },
    ],
  },
  {
    nama: "Mad",
    judul: "MAD THABI’I",
    catatan: "Panjang dua harakat pada huruf mad asli (alif, wawu, ya’ sukun): tidak lebih, tidak kurang.",
    contoh: [
      { ar: "قَالَ", arti: "Mad dengan alif" },
      { ar: "يَقُولُ", arti: "Mad dengan wawu" },
    ],
  },
];

const SIZES = [
  { label: "A", px: 64, fs: 16 },
  { label: "A", px: 92, fs: 22 },
  { label: "A", px: 124, fs: 28 },
];

export default function MengajarScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState(0);
  const [ex, setEx] = useState(0);
  const [size, setSize] = useState(1);
  const [showNote, setShowNote] = useState(true);
  // Bandingkan Riwayat butuh layar lebar: hanya ditawarkan di tablet
  const isTablet = useIsTablet();
  const [mode, setMode] = useState<"board" | "compare">("board");
  const showCompare = isTablet && mode === "compare";

  const rule = RULES[tab];
  const item = rule.contoh[ex % rule.contoh.length];
  const wide = width >= 900;
  const green = "#065f46";
  const sand = isDarkMode ? "#374151" : "#dccb9c";
  const cardBg = isDarkMode ? "#242424" : "#fffcf5";
  const pill = (on: boolean) => ({
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: on ? green : sand,
    backgroundColor: on ? green : cardBg,
    justifyContent: "center" as const,
  });

  const step = (d: number) => setEx((e) => (e + d + rule.contoh.length) % rule.contoh.length);

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

      {isTablet && (
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 24, paddingTop: 16 }}>
          {(["board", "compare"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              style={pill(mode === m)}
            >
              <Text style={{ fontSize: 17, fontWeight: "800", color: mode === m ? "#fff" : isDarkMode ? "#d1fae5" : green }}>
                {m === "board" ? t("teachTabBoard") : t("teachTabCompare")}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {showCompare ? (
        <CompareRiwayat />
      ) : (
      <ScrollView contentContainerStyle={{ padding: wide ? 32 : 20, paddingBottom: 60 }}>
        <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
          {/* Papan */}
          <View style={{ flex: 1 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
              {RULES.map((r, i) => (
                <Pressable
                  key={r.nama}
                  onPress={() => {
                    setTab(i);
                    setEx(0);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: i === tab }}
                  style={pill(i === tab)}
                >
                  <Text style={{ fontSize: 17, fontWeight: "800", color: i === tab ? "#fff" : isDarkMode ? "#d1fae5" : green }}>{r.nama}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View
              style={{ borderRadius: 32, borderWidth: 1.5, borderColor: sand, backgroundColor: cardBg, minHeight: wide ? 420 : 320, alignItems: "center", justifyContent: "center", padding: 24, overflow: "hidden" }}
            >
              <BatikPattern color={isDarkMode ? "#34d399" : "#047857"} cell={56} opacity={0.07} strokeWidth={1.4} />
              <Text style={{ fontSize: 15, fontWeight: "800", color: isDarkMode ? "#fbbf24" : "#b45309", letterSpacing: 1, marginBottom: 6 }}>{rule.judul}</Text>
              <Text
                style={{ fontFamily: ARABIC_FONT, fontSize: SIZES[size].px, lineHeight: SIZES[size].px * 1.9, textAlign: "center", color: isDarkMode ? "#f3f4f6" : "#022c22", writingDirection: "rtl" }}
                adjustsFontSizeToFit
                numberOfLines={2}
              >
                {item.ar}
              </Text>
              <Text className={`text-lg text-center mt-1 ${theme.textSecondary}`}>{item.arti}</Text>
              {showNote && (
                <View style={{ marginTop: 18, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 20, backgroundColor: isDarkMode ? "#064e3b" : "#d1fae5", maxWidth: 640 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", textAlign: "center", color: isDarkMode ? "#d1fae5" : "#064e3b" }}>{rule.catatan}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Pressable onPress={() => step(-1)} accessibilityRole="button" accessibilityLabel={t("prevExample")}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: sand, backgroundColor: cardBg, alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={30} color={isDarkMode ? "#d1fae5" : green} style={flip} />
              </Pressable>
              <View style={{ flex: 1, height: 72, borderRadius: 36, backgroundColor: green, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>{(ex % rule.contoh.length) + 1} / {rule.contoh.length}</Text>
              </View>
              <Pressable onPress={() => step(1)} accessibilityRole="button" accessibilityLabel={t("nextExample")}
                style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: sand, backgroundColor: cardBg, alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={30} color={isDarkMode ? "#d1fae5" : green} style={flip} />
              </Pressable>
            </View>
          </View>

          {/* Panel pengajar */}
          <View style={{ width: wide ? 300 : "100%", gap: 20 }}>
            <View>
              <Text className={`text-sm font-extrabold mb-2 ${theme.textSecondary}`}>{t("teachBoardSize")}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {SIZES.map((s, i) => (
                  <Pressable key={i} onPress={() => setSize(i)} accessibilityRole="button" accessibilityState={{ selected: i === size }}
                    accessibilityLabel={`${t("teachBoardSize")} ${i + 1}`}
                    style={{ flex: 1, height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: i === size ? green : sand, backgroundColor: i === size ? green : cardBg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: s.fs, fontWeight: "800", color: i === size ? "#fff" : isDarkMode ? "#d1fae5" : green }}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable onPress={() => setShowNote((v) => !v)} accessibilityRole="switch" accessibilityState={{ checked: showNote }}
              style={{ height: 60, borderRadius: 20, borderWidth: 1.5, borderColor: sand, backgroundColor: showNote ? green : cardBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: showNote ? "#fff" : isDarkMode ? "#d1fae5" : green }}>{t("teachNotes")}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: showNote ? "#d1fae5" : isDarkMode ? "#9ca3af" : "#6b6558" }}>{showNote ? t("teachShow") : t("teachHide")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
