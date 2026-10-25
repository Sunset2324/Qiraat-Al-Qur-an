import { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, PanResponder, Dimensions,
  Modal, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { getMushafPage, getMushafPages, type MushafPageData } from "../../../src/services/quranService";
import { QURAN_FONT } from "../../../src/constants/fonts";

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
const startsWithBasmala = (txt: string) =>
  txt.replace(/[ً-ٰٟـ]/g, "").replace(/[ٱأإآ]/g, "ا").trim().startsWith("بسم");

/** Baca per halaman: halaman & isinya mengikuti mushaf (qiraat) yang dipilih. */
export default function PageReaderScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang, flip } = useLanguage();
  const { width } = useWindowDimensions();
  const { page: pageParam, mushafId: mushafParam } = useLocalSearchParams();

  const pageNo = Math.max(1, parseInt(String(pageParam ?? "1"), 10) || 1);

  const [mushafId, setMushafId] = useState<string>(mushafParam ? String(mushafParam) : "");
  const [data, setData] = useState<MushafPageData | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [jumpText, setJumpText] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Ukuran teks mengikuti lebar layar (HP kecil -> tablet)
  const fontSize = width >= 900 ? 34 : width >= 700 ? 30 : width < 360 ? 22 : 26;
  const lineHeight = Math.round(fontSize * 2.1);

  const scrollRef = useRef<ScrollView>(null);

  // Mushaf aktif: parameter rute, lalu pilihan tersimpan
  useEffect(() => {
    if (mushafParam) {
      setMushafId(String(mushafParam));
      return;
    }
    AsyncStorage.getItem("selected_mushaf_id")
      .then((v) => setMushafId(v || "1"))
      .catch(() => setMushafId("1"));
  }, [mushafParam]);

  // Muat halaman
  useEffect(() => {
    if (!mushafId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMushafPage(mushafId, pageNo)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setTotal(d.totalPages);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        AsyncStorage.setItem(`last_page_mushaf_${mushafId}`, String(d.page)).catch(() => {});
        // siapkan halaman berikutnya supaya geser terasa cepat
        if (d.page < d.totalPages) getMushafPage(mushafId, d.page + 1).catch(() => {});
      })
      .catch(() => !cancelled && setError(t("pageLoadFailed")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mushafId, pageNo, retryKey]);

  // Jumlah halaman untuk validasi lompat (kalau belum dari halaman)
  useEffect(() => {
    if (!mushafId || total != null) return;
    getMushafPages(mushafId).then((s) => setTotal(s.totalPages)).catch(() => {});
  }, [mushafId, total]);

  const pageRef = useRef(pageNo);
  pageRef.current = pageNo;
  const totalRef = useRef<number | null>(total);
  totalRef.current = total;
  const mushafRef = useRef(mushafId);
  mushafRef.current = mushafId;

  const goToPage = useCallback((n: number) => {
    const max = totalRef.current ?? 9999;
    if (!Number.isInteger(n) || n < 1 || n > max) return;
    router.replace({
      pathname: "/screen/halaman/[page]",
      params: { page: String(n), mushafId: mushafRef.current },
    });
  }, []);

  // Geser: ke kanan = halaman berikutnya (seperti membalik mushaf Arab), ke kiri = sebelumnya
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        const w = Dimensions.get("window").width;
        return Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 2 && g.x0 > 28 && g.x0 < w - 28;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        const jauh = Math.abs(g.dx) > 90;
        const cepat = Math.abs(g.dx) > 50 && Math.abs(g.vx) > 0.5;
        if (!jauh && !cepat) return;
        goToPage(pageRef.current + (g.dx > 0 ? 1 : -1));
      },
    })
  ).current;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/mushaf");
  };

  const submitJump = () => {
    const n = parseInt(jumpText, 10);
    if (!Number.isInteger(n) || n < 1 || (total != null && n > total)) return;
    setShowJump(false);
    setJumpText("");
    if (n !== pageNo) goToPage(n);
  };

  const accent = isDarkMode ? "#34d399" : "#047857";
  const hasData = !!data && data.page === pageNo;

  const header = (
    <>
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme.iconColor} style={flip} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>{t("viewByPage").toUpperCase()}</Text>
          <Text className={`text-base font-bold ${theme.text}`}>
            {hasData && data!.juz ? t("juzN", { n: data!.juz }) : t("pageTitle")}
          </Text>
        </View>
        <View className="w-11" />
      </View>

      {/* Bar pindah halaman */}
      <View className={`flex-row items-center px-3 py-2 border-b ${theme.border}`}>
        <Pressable
          onPress={() => goToPage(pageNo - 1)}
          disabled={pageNo <= 1}
          accessibilityRole="button"
          hitSlop={8}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${pageNo <= 1 ? "opacity-30" : ""}`}
        >
          <ChevronLeft size={22} color={theme.iconColor} style={flip} />
        </Pressable>
        <Pressable
          onPress={() => setShowJump(true)}
          accessibilityRole="button"
          accessibilityLabel={t("jumpToPage")}
          className={`flex-1 mx-2 flex-row items-center justify-center gap-2 py-2 rounded-full border ${theme.border} ${theme.bgCard} active:opacity-70`}
        >
          <Text className={`text-sm font-bold ${theme.text}`} numberOfLines={1}>
            {total != null ? t("pageOf", { n: pageNo, total }) : `${t("pageTitle")} ${pageNo}`}
          </Text>
          <ChevronDown size={16} color={theme.iconColor} />
        </Pressable>
        <Pressable
          onPress={() => goToPage(pageNo + 1)}
          disabled={total != null && pageNo >= total}
          accessibilityRole="button"
          hitSlop={8}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${total != null && pageNo >= total ? "opacity-30" : ""}`}
        >
          <ChevronRight size={22} color={theme.iconColor} style={flip} />
        </Pressable>
      </View>
    </>
  );

  const jumpModal = (
    <Modal visible={showJump} transparent animationType="fade" onRequestClose={() => setShowJump(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={() => setShowJump(false)}>
          <Pressable className={`rounded-2xl border p-5 ${theme.border} ${theme.bgCard}`} onPress={() => {}}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-base font-bold ${theme.text}`}>{t("jumpToPage")}</Text>
              <Pressable onPress={() => setShowJump(false)} hitSlop={10}>
                <X size={20} color={theme.mutedColor} />
              </Pressable>
            </View>
            <TextInput
              value={jumpText}
              onChangeText={(v) => setJumpText(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              autoFocus
              maxLength={4}
              placeholder={t("pageNumberHint", { total: total ?? "…" })}
              placeholderTextColor={theme.mutedColor}
              onSubmitEditing={submitJump}
              className={`px-4 py-3 rounded-xl border text-base ${theme.border} ${theme.text}`}
            />
            <Pressable
              onPress={submitJump}
              className="mt-4 py-3 rounded-xl bg-emerald-700 items-center active:opacity-90"
            >
              <Text className="text-white font-bold">{t("openBtn")}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (!hasData) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
        {header}
        <View className="flex-1 items-center justify-center p-6">
          {error && !loading ? (
            <>
              <Text className={`text-center font-semibold mb-4 ${theme.text}`}>{error}</Text>
              <Pressable
                onPress={() => setRetryKey((k) => k + 1)}
                className={`px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
              >
                <Text className="text-white font-bold">{t("retry")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={accent} />
              <Text className={`mt-4 ${theme.textMuted}`}>{t("loading")}</Text>
            </>
          )}
        </View>
        {jumpModal}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {header}
      <View className="flex-1" {...swipe.panHandlers}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          {data!.segments.map((seg, si) => {
            const first = seg.ayat[0]?.teksArab ?? "";
            const showBasmala =
              seg.startsSurah && seg.surah.nomor !== 9 && !!data!.bismillah && !startsWithBasmala(first);
            return (
              <View key={`${seg.surah.nomor}-${si}`} className="mb-6">
                {seg.startsSurah && (
                  <View
                    className={`mb-3 px-4 py-4 rounded-2xl border items-center ${
                      isDarkMode ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-600 bg-emerald-50"
                    }`}
                  >
                    <Text className={`text-2xl ${theme.text}`} style={{ fontFamily: QURAN_FONT }}>
                      {seg.surah.nama}
                    </Text>
                    <Text className={`text-sm font-bold mt-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-800"}`}>
                      {seg.surah.nomor}. {seg.surah.namaLatin}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${theme.textMuted}`}>
                      {seg.surah.arti} • {t("pageStartsHere", { n: seg.surah.jumlahAyat })} •{" "}
                      {seg.surah.tempatTurun === "Mekah" ? t("makkiyah") : t("madaniyah")}
                    </Text>
                  </View>
                )}

                {showBasmala && (
                  <Text
                    className={`text-center mb-3 ${theme.text}`}
                    style={{ fontFamily: QURAN_FONT, fontSize: fontSize - 2, lineHeight, includeFontPadding: false }}
                  >
                    {data!.bismillah}
                  </Text>
                )}

                {/* Teks mengalir seperti halaman mushaf, nomor ayat di ujung tiap ayat */}
                <View className={`px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
                  <Text
                    style={{
                      fontFamily: QURAN_FONT,
                      fontSize,
                      lineHeight,
                      writingDirection: "rtl",
                      textAlign: "justify",
                      includeFontPadding: false,
                    }}
                    className={theme.text}
                  >
                    {seg.ayat.map((a) => (
                      <Text key={a.nomor}>
                        {a.teksArab}{" "}
                        <Text style={{ color: accent, fontSize: fontSize * 0.8 }}>
                          {"۝"}
                          {toArabicDigits(a.nomor)}
                        </Text>{" "}
                      </Text>
                    ))}
                  </Text>
                </View>

                {showTranslation && (
                  <View className="mt-3">
                    {seg.ayat.map((a) => (
                      <View key={a.nomor} className="flex-row mb-2.5">
                        <View className={`h-6 w-6 rounded-full ${isDarkMode ? "bg-emerald-900/50" : "bg-[#f5f0e1]"} items-center justify-center mr-2.5 mt-0.5`}>
                          <Text className={`text-[10px] font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{a.nomor}</Text>
                        </View>
                        <Text
                          className={`flex-1 text-sm leading-6 ${theme.textMuted}`}
                          style={{ textAlign: lang === "ar" ? "right" : "left" }}
                        >
                          {a.teksIndonesia}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <Pressable
            onPress={() => setShowTranslation((v) => !v)}
            className={`py-3 rounded-2xl border items-center active:opacity-80 ${theme.border} ${theme.bgCard}`}
          >
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
              {showTranslation ? t("hideTranslation") : t("showTranslation")}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
      {jumpModal}
    </SafeAreaView>
  );
}
