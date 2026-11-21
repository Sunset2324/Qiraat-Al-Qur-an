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
import { QURAN_FONT, ARABIC_FONT } from "../../../src/constants/fonts";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import TajweedText from "../../../src/components/TajweedText";
import TajweedLegend from "../../../src/components/TajweedLegend";
import { TAJWEED_MUSHAF_ID } from "../../../src/utils/tajweedColor";

const PAGE_SIZE_KEY = "page_arab_size";
const SCALES = [0.85, 1, 1.2, 1.4, 1.65];
const SCALE_LABELS = ["XS", "S", "M", "L", "XL"];

const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
const startsWithBasmala = (txt: string) =>
  txt.replace(/[ً-ٰٟـ]/g, "").replace(/[ٱأإآ]/g, "ا").trim().startsWith("بسم");

/** Baca per halaman: halaman & isinya mengikuti mushaf (qiraat) yang dipilih. */
export default function PageReaderScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang, flip, isRTL } = useLanguage();
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
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  const [sizeIdx, setSizeIdx] = useState(1);
  useEffect(() => {
    AsyncStorage.getItem(PAGE_SIZE_KEY)
      .then((v) => {
        const n = v == null ? NaN : Number(v);
        if (Number.isInteger(n) && n >= 0 && n < SCALES.length) setSizeIdx(n);
      })
      .catch(() => {});
  }, []);
  const changeSize = (d: number) =>
    setSizeIdx((v) => {
      const n = Math.max(0, Math.min(SCALES.length - 1, v + d));
      if (n !== v) AsyncStorage.setItem(PAGE_SIZE_KEY, String(n)).catch(() => {});
      return n;
    });

  // Ukuran teks mengikuti lebar layar (HP kecil -> tablet)
  const baseSize = width >= 900 ? 38 : width >= 700 ? 32 : width < 360 ? 22 : 26;
  const fontSize = Math.round(baseSize * SCALES[sizeIdx]);
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

  // Mushaf dibaca dari kanan ke kiri: geser ke kanan = halaman berikutnya, ke kiri = sebelumnya.
  // Tombol: "sebelumnya" di sisi kanan, "berikutnya" di sisi kiri (posisi fisik, tidak ikut bahasa).
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

  const circleBtn = { width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" } as const;
  const atStart = pageNo <= 1;
  const atEnd = total != null && pageNo >= total;
  const sizeBtn = (disabled: boolean) =>
    `items-center justify-center active:opacity-60 ${disabled ? "opacity-30" : ""}`;
  const sizeText = `${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`;

  const header = (
    <>
      <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 14 }}>
        <BatikPattern width={1400} height={90} cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
        <View className="flex-row items-center">
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            className="items-center justify-center rounded-full active:opacity-70"
            style={circleBtn}
          >
            <ArrowLeft size={22} color="#fff" style={flip} />
          </Pressable>
          <View className="flex-1 ml-4">
            <Text className="text-xs font-bold tracking-[2px] text-emerald-100">{t("viewByPage").toUpperCase()}</Text>
            <Text className="text-lg font-extrabold text-white" numberOfLines={1}>
              {hasData && data!.juz ? t("juzN", { n: data!.juz }) : t("pageTitle")}
            </Text>
          </View>
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 28, lineHeight: 48, color: "#fde68a" }}>
            {toArabicDigits(pageNo)}
          </Text>
        </View>
      </View>

      {/* Bar pindah halaman + ukuran teks */}
      <View className={`border-b ${theme.border}`} style={{ paddingHorizontal: pad, paddingVertical: 10, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: 820, alignItems: "center", flexDirection: isRTL ? "row" : "row-reverse", gap: 8 }}>
          <Pressable
            onPress={() => goToPage(pageNo - 1)}
            disabled={atStart}
            accessibilityRole="button"
            accessibilityLabel={t("prevPage")}
            className={`items-center justify-center rounded-full border ${theme.border} ${theme.bgCard} active:opacity-60 ${atStart ? "opacity-30" : ""}`}
            style={{ width: 48, height: 48 }}
          >
            <ChevronRight size={22} color={theme.iconColor} />
          </Pressable>
          <Pressable
            onPress={() => setShowJump(true)}
            accessibilityRole="button"
            accessibilityLabel={t("jumpToPage")}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-full border ${theme.border} ${theme.bgCard} active:opacity-70`}
            style={{ height: 48 }}
          >
            <Text className={`text-sm font-extrabold ${theme.text}`} numberOfLines={1}>
              {total != null ? t("pageOf", { n: pageNo, total }) : `${t("pageTitle")} ${pageNo}`}
            </Text>
            <ChevronDown size={16} color={theme.iconColor} />
          </Pressable>
          <Pressable
            onPress={() => goToPage(pageNo + 1)}
            disabled={atEnd}
            accessibilityRole="button"
            accessibilityLabel={t("nextPage")}
            className={`items-center justify-center rounded-full border ${theme.border} ${theme.bgCard} active:opacity-60 ${atEnd ? "opacity-30" : ""}`}
            style={{ width: 48, height: 48 }}
          >
            <ChevronLeft size={22} color={theme.iconColor} />
          </Pressable>
          <View
            accessibilityRole="adjustable"
            accessibilityLabel={t("arabSizeLabel")}
            className={`items-center rounded-full border ${theme.border} ${theme.bgCard}`}
            style={{ height: 48, paddingHorizontal: 2, flexDirection: "row" }}
          >
            <Pressable
              onPress={() => changeSize(-1)}
              disabled={sizeIdx === 0}
              accessibilityRole="button"
              accessibilityLabel={t("arabSmaller")}
              className={sizeBtn(sizeIdx === 0)}
              style={{ width: 44, height: 44 }}
            >
              <Text className={`text-base font-extrabold ${sizeText}`}>A−</Text>
            </Pressable>
            {isTablet && (
              <Text className={`text-xs font-bold text-center ${theme.textSecondary}`} style={{ minWidth: 24 }}>
                {SCALE_LABELS[sizeIdx]}
              </Text>
            )}
            <Pressable
              onPress={() => changeSize(1)}
              disabled={sizeIdx === SCALES.length - 1}
              accessibilityRole="button"
              accessibilityLabel={t("arabLarger")}
              className={sizeBtn(sizeIdx === SCALES.length - 1)}
              style={{ width: 44, height: 44 }}
            >
              <Text className={`text-xl font-extrabold ${sizeText}`}>A+</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );

  const jumpModal = (
    <Modal visible={showJump} transparent animationType="fade" onRequestClose={() => setShowJump(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <Pressable className="flex-1 bg-black/50 justify-center px-6" onPress={() => setShowJump(false)}>
          <Pressable className={`self-center w-full rounded-3xl border p-6 ${theme.border} ${theme.bgCard}`} style={{ maxWidth: 440 }} onPress={() => {}}>
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
              className={`px-5 rounded-full border text-base ${theme.border} ${theme.text}`}
              style={{ height: 52 }}
            />
            <Pressable
              onPress={submitJump}
              className="mt-4 rounded-full bg-emerald-800 items-center justify-center active:opacity-90"
              style={{ height: 52 }}
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
          contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}
        >
          <View style={{ width: "100%", maxWidth: 820 }}>
          {String(mushafId) === TAJWEED_MUSHAF_ID && <TajweedLegend />}
          {data!.segments.map((seg, si) => {
            const first = seg.ayat[0]?.teksArab ?? "";
            const showBasmala =
              seg.startsSurah && seg.surah.nomor !== 9 && !!data!.bismillah && !startsWithBasmala(first);
            return (
              <View key={`${seg.surah.nomor}-${si}`} className="mb-6">
                {seg.startsSurah && (
                  <View
                    className={`mb-4 px-5 py-5 rounded-3xl overflow-hidden items-center ${isDarkMode ? "bg-emerald-900" : "bg-emerald-800"}`}
                  >
                    <BatikPattern width={1000} height={260} cell={42} opacity={0.14} />
                    <Text style={{ fontFamily: QURAN_FONT, fontSize: isTablet ? 40 : 32, lineHeight: isTablet ? 70 : 58, color: "#fde68a" }}>
                      {seg.surah.nama}
                    </Text>
                    <Text className="text-base font-extrabold mt-1 text-white">
                      {seg.surah.nomor}. {seg.surah.namaLatin}
                    </Text>
                    <Text className="text-xs mt-1 text-emerald-100 text-center">
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
                <View
                  className={`rounded-3xl border ${theme.border} ${isDarkMode ? "bg-[#242424]" : "bg-[#fffcf5]"}`}
                  style={{ padding: isTablet ? 8 : 5 }}
                >
                <View
                  className={`rounded-2xl border ${isDarkMode ? "border-emerald-900" : "border-[#e8dcb5]"}`}
                  style={{ paddingHorizontal: isTablet ? 32 : 16, paddingVertical: isTablet ? 24 : 12 }}
                >
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
                        {String(mushafId) === TAJWEED_MUSHAF_ID ? (
                          <TajweedText text={a.teksArab} isDark={isDarkMode} />
                        ) : (
                          a.teksArab
                        )}{" "}
                        <Text style={{ color: accent, fontSize: fontSize * 0.8 }}>
                          {"۝"}
                          {toArabicDigits(a.nomor)}
                        </Text>{" "}
                      </Text>
                    ))}
                  </Text>
                </View>
                </View>

                {showTranslation && (
                  <View className="mt-3">
                    {seg.ayat.map((a) => (
                      <View key={a.nomor} className="flex-row mb-2.5">
                        <View className={`h-6 w-6 rounded-full ${isDarkMode ? "bg-emerald-900/50" : "bg-[#f5f0e1]"} items-center justify-center mr-2.5 mt-0.5`}>
                          <Text className={`text-[10px] font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{a.nomor}</Text>
                        </View>
                        <Text
                          className={`flex-1 ${isTablet ? "text-base leading-7" : "text-sm leading-6"} ${theme.textSecondary}`}
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
            accessibilityRole="button"
            style={{ minHeight: 52 }}
            className={`rounded-full border items-center justify-center active:opacity-80 ${theme.border} ${theme.bgCard}`}
          >
            <Text className={`text-sm font-semibold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
              {showTranslation ? t("hideTranslation") : t("showTranslation")}
            </Text>
          </Pressable>
          </View>
        </ScrollView>
      </View>
      {jumpModal}
    </SafeAreaView>
  );
}
