import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, PanResponder, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, ArrowRight, Bookmark, Headphones, Volume2, Play, Pause, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDetailSurahMerged, getReciters, type Reciter } from "../../../src/services/quranService";
import { usePlayer, type PlayerSession } from "../../../src/context/PlayerContext";
import SurahPickerSheet from "../../../src/components/SurahPickerSheet";
import AudioPlayer from "../../../src/components/AudioPlayer";
import { useLanguage } from "../../../src/context/LanguageContext";
import { reciterName, reciterDetail } from "../../../src/i18n/qiraatI18n";
import { saveLastRead, getLastReadAyah } from "../../../src/utils/readingHistory";
import { QURAN_FONT } from "../../../src/constants/fonts";

interface AyatItem {
  nomor: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio: string;
}

interface SuratDetail {
  info: {
    nomor: number;
    nama: string;
    namaLatin: string;
    arti: string;
    jumlahAyat: number;
    tempatTurun: string;
    mushafAktif: string;
    // Backend ngirim null kalau reciterId yang diminta nggak ketemu,
    // atau string/object kalau ketemu (object = reciter dari Quranpedia).
    reciterAktif?: { id: number; nama: string; perAyah: boolean } | string | null;
  };
  audioFull?: string;
  ayat: AyatItem[];
}

const RECITER_STORAGE_KEY = "selected_reciter_id";

type ReciterFilter = "all" | "ayah" | "surah";

export default function SurahDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang, flip } = useLanguage();
  const { nomor, mushafId: routeMushafId, ayat: routeAyat } = useLocalSearchParams();

  const [surahData, setSurahData] = useState<SuratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // 🎙️ DAFTAR RECITER (dinamis dari Quranpedia lewat backend)
  // ─────────────────────────────────────────────────────────
  const [reciters, setReciters] = useState<Reciter[]>([]);
  // Daftar qari di atas sudah difilter untuk surah nomor berapa. Pemuat surah
  // nunggu ini cocok dengan surah yang dibuka, supaya nggak sempat minta audio
  // ke qari yang nggak punya surah tersebut.
  const [recitersSurah, setRecitersSurah] = useState<number | null>(null);
  // null dulu (belum ada pilihan) -> effect pemuat surah SENGAJA nunggu
  // sampai ini terisi, supaya request pertama udah pakai reciterId yang valid
  // (bukan nebak angka default yang mungkin nggak ada di katalog Quranpedia).
  const [selectedReciterId, setSelectedReciterId] = useState<string | null>(null);
  const [showQiraatOptions, setShowQiraatOptions] = useState(false);
  const [reciterFilter, setReciterFilter] = useState<ReciterFilter>("all");

  // Naikkan angka ini buat memicu fetch ulang (dipakai tombol "Coba Lagi")
  const [retryKey, setRetryKey] = useState(0);

  const [activeMushafId, setActiveMushafId] = useState<string>("1");

  const activeReciter = reciters.find((r) => String(r.id) === selectedReciterId);
  const activeReciterLabel = activeReciter
    ? reciterName(activeReciter.reciter || activeReciter.name, lang)
    : reciters.length === 0
    ? t("loading")
    : t("pickReciterShort");

  // Ambil daftar reciter (hanya yang punya surah ini), lalu pilih qari:
  // 1) pilihan sekarang kalau masih valid, 2) pilihan terakhir yang tersimpan,
  // 3) qari pertama yang support per-ayat.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const surahNumber = Number(nomor);
        const [list, savedId] = await Promise.all([
          getReciters(null, Number.isFinite(surahNumber) ? surahNumber : null),
          AsyncStorage.getItem(RECITER_STORAGE_KEY),
        ]);
        if (cancelled) return;

        if (list.length === 0) {
          setReciters([]);
          setError(t("noReciterSurah"));
          setLoading(false);
          return;
        }

        setReciters(list);
        setSelectedReciterId((prev) => {
          const valid = (id: string | null) => !!id && list.some((r) => String(r.id) === id);
          if (valid(prev)) return prev;
          if (valid(savedId)) return savedId;
          const fallback = list.find((r) => r.perAyah) || list[0];
          return String(fallback.id);
        });
        setRecitersSurah(surahNumber);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Gagal memuat daftar reciter:", err?.message);
        setError(t("reciterLoadFailed"));
        setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomor, retryKey]);

  const handleSelectReciter = (id: number) => {
    const idStr = String(id);
    setSelectedReciterId(idStr);
    setShowQiraatOptions(false);
    AsyncStorage.setItem(RECITER_STORAGE_KEY, idStr).catch(() => {});
  };

  const filteredReciters = useMemo(
    () =>
      reciters.filter((r) =>
        reciterFilter === "all" ? true : reciterFilter === "ayah" ? r.perAyah : !r.perAyah
      ),
    [reciters, reciterFilter]
  );

  // ▶ Mode "Ikuti Bacaan": playlist audio per-ayat yang otomatis lanjut
  // ke ayat berikutnya, dipakai juga untuk tombol play per-ayat.
  const ayahAudioUrls = useMemo(() => surahData?.ayat.map((a) => a.audio) ?? [], [surahData]);
  // Data notifikasi media: nama surah + nama qari yang sedang aktif.
  const lockMeta = useMemo(() => {
    const ra = surahData?.info.reciterAktif;
    const nama = ra && typeof ra === "object" ? ra.nama : typeof ra === "string" ? ra : undefined;
    return { title: surahData?.info.namaLatin, artist: nama };
  }, [surahData]);

  // Pemutar global (lanjut jalan walau layar ini ditutup; kontrol ada di mini player)
  const player = usePlayer();
  const isMine =
    !!surahData && player.session?.surah === surahData.info.nomor && player.session.kind === "ayah";
  const buildSession = (): PlayerSession => ({
    kind: "ayah",
    surah: surahData!.info.nomor,
    surahName: surahData!.info.namaLatin,
    reciterId: selectedReciterId ? Number(selectedReciterId) : null,
    reciterName: lockMeta.artist,
    mushafId: activeMushafId,
    urls: ayahAudioUrls,
  });
  const ayahPlaylist = {
    currentIndex: isMine ? player.currentIndex : 0,
    isPlaying: isMine && player.isPlaying,
    trackCount: ayahAudioUrls.filter(Boolean).length,
    playFrom: (i: number) => {
      if (surahData) player.start(buildSession(), i);
    },
    pause: () => player.pause(),
  };
  const [showPicker, setShowPicker] = useState(false);

  // ↔ Geser layar untuk pindah surah: geser ke kanan = surah berikutnya,
  // geser ke kiri = surah sebelumnya (seperti membalik halaman mushaf).
  const nomorRef = useRef(Number(nomor));
  nomorRef.current = Number(nomor);
  const mushafParamRef = useRef(routeMushafId);
  mushafParamRef.current = routeMushafId;

  const playerRef = useRef(player);
  playerRef.current = player;

  const goToSurah = useCallback((n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > 114) return;
    // Kalau surah ini sedang diputar, audio ikut pindah ke surah tujuan (seperti tombol next di pemutar musik)
    const pl = playerRef.current;
    if (pl.isPlaying && pl.session?.surah === nomorRef.current) pl.playSurah(n);
    const mid = mushafParamRef.current;
    router.replace({
      pathname: "/screen/surah/[nomor]",
      params: { nomor: String(n), ...(mid ? { mushafId: String(mid) } : {}) },
    });
  }, []);

  const swipe = useRef(
    PanResponder.create({
      // Ambil alih hanya kalau gerakan jelas mendatar, supaya scroll vertikal tetap normal.
      // Sentuhan yang mulai di tepi layar dilewati agar gesture "kembali" sistem tidak bentrok.
      onMoveShouldSetPanResponderCapture: (_e, g) => {
        const w = Dimensions.get("window").width;
        return (
          Math.abs(g.dx) > 16 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 2 &&
          g.x0 > 28 &&
          g.x0 < w - 28
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_e, g) => {
        const jauh = Math.abs(g.dx) > 90;
        const cepat = Math.abs(g.dx) > 50 && Math.abs(g.vx) > 0.5;
        if (!jauh && !cepat) return;
        goToSurah(nomorRef.current + (g.dx > 0 ? 1 : -1));
      },
    })
  ).current;
  const hasPerAyahAudio = ayahPlaylist.trackCount > 0;

  // true setelah "Ikuti Bacaan" / tombol play salah satu ayat pernah ditekan,
  // dipakai supaya highlight ayat aktif nggak nongol sebelum user memutar apa-apa.
  const followStarted = isMine;

  const activeAyahNumber = followStarted
    ? surahData?.ayat[ayahPlaylist.currentIndex]?.nomor ?? null
    : null;

  // Posisi Y tiap ayat di dalam ScrollView, dipakai untuk auto-scroll
  // mengikuti ayat yang lagi dibaca.
  const scrollRef = useRef<ScrollView>(null);
  const ayahListOffsetY = useRef(0);
  const ayahOffsetY = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!followStarted || activeAyahNumber == null) return;
    const relativeY = ayahOffsetY.current[activeAyahNumber];
    if (relativeY == null) return;

    const targetY = Math.max(0, ayahListOffsetY.current + relativeY - 24);
    scrollRef.current?.scrollTo({ y: targetY, animated: true });
  }, [activeAyahNumber, followStarted]);

  // ─────────────────────────────────────────────────────────
  // 📍 PROGRES BACAAN: ayat mana yang terakhir dibaca di surah ini
  // ─────────────────────────────────────────────────────────

  // Posisi scroll sekarang (buat hitung ayat mana yang lagi "di layar")
  const currentScrollY = useRef(0);
  // Sudah ada event scroll sejak surah dibuka? (dipakai supaya progres awal
  // nggak menimpa hasil scroll yang sebenarnya)
  const hasScrolledRef = useRef(false);

  // Progres terbaru disimpan di ref (bukan state) supaya bisa dibaca
  // di cleanup function tanpa masalah stale-closure, dan nggak bikin re-render tiap scroll.
  const latestProgressRef = useRef<{
    surahNomor: number;
    namaLatin: string;
    ayatNomor: number;
    totalAyat: number;
    mushafId: string;
  } | null>(null);

  // Nomor ayat terakhir dibaca yang tersimpan dari kunjungan sebelumnya ke surah ini
  // (buat kasih penanda 📍 di list + auto-scroll pas pertama buka).
  const [lastReadAyahNumber, setLastReadAyahNumber] = useState<number | null>(null);
  const hasAutoScrolledToLastRead = useRef(false);
  // true setelah user menandai ayat secara manual: scroll tidak menimpa pilihannya lagi
  const pinnedRef = useRef(false);

  // Umpan balik singkat pas tombol bookmark ditekan
  const [justSaved, setJustSaved] = useState(false);

  // Hitung ayat yang posisinya paling atas & masih di atas "garis baca" (dekat header)
  const getVisibleAyahNumber = (): number | null => {
    if (!surahData) return null;
    const anchor = currentScrollY.current + 120;
    let candidate: number | null = null;
    for (const ayat of surahData.ayat) {
      const relY = ayahOffsetY.current[ayat.nomor];
      if (relY == null) continue;
      const absY = ayahListOffsetY.current + relY;
      if (absY <= anchor) {
        candidate = ayat.nomor;
      } else {
        break;
      }
    }
    return candidate ?? surahData.ayat[0]?.nomor ?? null;
  };

  const handleScroll = (e: any) => {
    hasScrolledRef.current = true;
    currentScrollY.current = e.nativeEvent.contentOffset.y;
    if (!surahData || pinnedRef.current) return;
    const ayatNomor = getVisibleAyahNumber();
    if (ayatNomor == null) return;
    latestProgressRef.current = {
      surahNomor: surahData.info.nomor,
      namaLatin: surahData.info.namaLatin,
      ayatNomor,
      totalAyat: surahData.ayat.length,
      mushafId: activeMushafId,
    };
  };

  // Ambil posisi terakhir dibaca tiap kali surah berganti, reset status auto-scroll
  useEffect(() => {
    hasAutoScrolledToLastRead.current = false;
    hasScrolledRef.current = false;
    pinnedRef.current = false;
    if (!surahData) return;

    const info = surahData.info;
    const total = surahData.ayat.length;
    const paramAyat = routeAyat ? parseInt(String(routeAyat), 10) : NaN;
    let cancelled = false;

    // Progres awal sementara = ayat pertama
    latestProgressRef.current = {
      surahNomor: info.nomor,
      namaLatin: info.namaLatin,
      ayatNomor: 1,
      totalAyat: total,
      mushafId: activeMushafId,
    };

    getLastReadAyah(info.nomor, activeMushafId).then((saved) => {
      if (cancelled) return;
      setLastReadAyahNumber(saved);

      // Kalau user belum sempat scroll, jangan biarkan progres lama (mis. ayat 50)
      // tertimpa ayat 1 -> pakai ayat dari link History / yang tersimpan.
      if (!hasScrolledRef.current) {
        const initial = Number.isFinite(paramAyat) ? paramAyat : saved ?? 1;
        latestProgressRef.current = {
          surahNomor: info.nomor,
          namaLatin: info.namaLatin,
          ayatNomor: initial,
          totalAyat: total,
      mushafId: activeMushafId,
        };
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahData?.info.nomor]);

  // Simpan progres otomatis begitu layar ini ditinggalkan (tombol back, gesture back, dll)
  useEffect(() => {
    return () => {
      if (latestProgressRef.current) {
        saveLastRead(latestProgressRef.current).catch(() => {});
      }
    };
  }, []);

  // Auto-scroll sekali ke: ayat dari parameter ?ayat= (deep-link dari History),
  // atau kalau nggak ada, ke ayat terakhir dibaca tersimpan.
  useEffect(() => {
    const paramAyat = routeAyat ? parseInt(String(routeAyat), 10) : null;
    const targetAyah = Number.isFinite(paramAyat as number) ? paramAyat : lastReadAyahNumber;

    if (!surahData || targetAyah == null || hasAutoScrolledToLastRead.current) return;

    // Layout ayat diukur bertahap (surah panjang bisa lama), jadi coba berkali-kali
    // sampai posisinya ketemu (maks ~3 detik) baru scroll.
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const tryScroll = () => {
      const relY = ayahOffsetY.current[targetAyah as number];
      if (relY != null) {
        const targetY = Math.max(0, ayahListOffsetY.current + relY - 24);
        scrollRef.current?.scrollTo({ y: targetY, animated: true });
        hasAutoScrolledToLastRead.current = true;
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        timer = setTimeout(tryScroll, 250);
      } else {
        hasAutoScrolledToLastRead.current = true; // menyerah, jangan loop terus
      }
    };

    timer = setTimeout(tryScroll, 300);
    return () => clearTimeout(timer);
  }, [surahData, lastReadAyahNumber, routeAyat]);

  // Simpan tanda "terakhir dibaca" ke ayat tertentu; konfirmasi dulu sebelum menyimpan
  const confirmMarkAyah = async (ayatNomor: number) => {
    if (!surahData) return;
    const progress = {
      surahNomor: surahData.info.nomor,
      namaLatin: surahData.info.namaLatin,
      ayatNomor,
      totalAyat: surahData.ayat.length,
      mushafId: activeMushafId,
    };
    const commit = async () => {
      pinnedRef.current = true;
      latestProgressRef.current = progress;
      await saveLastRead(progress);
      setLastReadAyahNumber(ayatNomor);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    };
    const previous = await getLastReadAyah(progress.surahNomor, progress.mushafId);
    if (previous === ayatNomor) return; // sudah jadi tanda
    const hasOther = previous != null;
    Alert.alert(
      t(hasOther ? "replaceMarkerTitle" : "markAyahTitle"),
      hasOther
        ? t("replaceMarkerMsg", { from: previous as number, to: ayatNomor })
        : t("markAyahMsg", { n: ayatNomor }),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t(hasOther ? "replaceMarkerConfirm" : "markAyahConfirm"), onPress: commit },
      ]
    );
  };

  // Tombol bookmark di header: tandai ayat yang sedang terlihat di layar
  const handleBookmarkPress = () => {
    const n = latestProgressRef.current?.ayatNomor ?? getVisibleAyahNumber();
    if (n != null) confirmMarkAyah(n);
  };

  // ─────────────────────────────────────────────────────────
  // 📖 MUAT DATA SURAH — nunggu selectedReciterId terisi dulu,
  // supaya request pertama ke backend udah pakai reciterId yang valid
  // (bukan tebakan), dan reciterAktif nggak pernah null di kondisi normal.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!nomor || !selectedReciterId || recitersSurah !== Number(nomor)) return;

    const loadSurahData = async () => {
      try {
        setLoading(true);
        setError(null);

        let mushafIdToUse = "1";
        if (routeMushafId) {
          mushafIdToUse = String(routeMushafId);
        } else {
          const saved = await AsyncStorage.getItem("selected_mushaf_id");
          if (saved) mushafIdToUse = saved;
        }
        setActiveMushafId(mushafIdToUse);

        console.log(
          `📖 Loading surah ${nomor} | mushaf: ${mushafIdToUse} | reciterId: ${selectedReciterId}`
        );

        // qariId ("05") dikirim cuma sebagai fallback EQuran.id kalau-kalau
        // reciter Quranpedia-nya gagal di-resolve backend; reciterId yang
        // sebenarnya menentukan audio adalah argumen ke-4.
        const data = await getDetailSurahMerged(
          Number(nomor),
          mushafIdToUse,
          "05",
          Number(selectedReciterId)
        );

        console.log("✅ Data berhasil dimuat, reciter aktif:", data.info.reciterAktif);
        setSurahData(data);
      } catch (err: any) {
        console.error("❌ Error loading surah:", err.message);
        setError(t("surahLoadFailed"));
      } finally {
        setLoading(false);
      }
    };

    loadSurahData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomor, selectedReciterId, recitersSurah, routeMushafId, retryKey]);

  const handleBack = () => {
    // Balik ke layar asal (mis. History); kalau nggak ada riwayat navigasi, ke tab Mushaf
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/mushaf");
    }
  };

  const handlePlayAyat = (ayatNomor: number) => {
    if (!surahData) return;
    const index = surahData.ayat.findIndex((a) => a.nomor === ayatNomor);
    if (index === -1) return;

    ayahPlaylist.playFrom(index);
  };

  // Toggle tombol "Ikuti Bacaan": mulai dari ayat 1, atau resume/pause
  // dari posisi terakhir kalau sudah pernah jalan.
  const handleToggleFollowMode = () => {
    if (!hasPerAyahAudio) return;
    if (ayahPlaylist.isPlaying) {
      ayahPlaylist.pause();
      return;
    }

    const resumeIndex = ayahPlaylist.currentIndex >= 0 ? ayahPlaylist.currentIndex : 0;
    ayahPlaylist.playFrom(resumeIndex);
  };

  // Layar penuh cuma buat load pertama. Waktu ganti qari, data lama tetap tampil
  // (posisi scroll terjaga) dan cukup ada banner kecil di atas.
  const hasData = !!surahData && surahData.info.nomor === Number(nomor);

  if (loading && !hasData) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={["top"]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>{t("loadingSurah")}</Text>
      </SafeAreaView>
    );
  }

  if (!hasData || !surahData) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={["top"]}>
        <Text className={`text-center font-semibold mb-4 ${theme.text}`}>
          {error || t("surahNotFound")}
        </Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            setError(null);
            setRetryKey((k) => k + 1);
          }}
          className={`px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
          <Text className="text-white font-bold">{t("retry")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const audioFullUrl = surahData.audioFull || undefined;

  // Null-safe: typeof null === "object" di JS, jadi WAJIB cek truthy dulu
  // sebelum cek typeof, kalau nggak bisa crash waktu reciterAktif = null.
  const reciterAktif = surahData.info.reciterAktif;
  const reciterAktifName =
    reciterAktif && typeof reciterAktif === "object"
      ? reciterAktif.nama
      : typeof reciterAktif === "string"
      ? reciterAktif
      : "—";
  const isPerAyahActive =
    reciterAktif && typeof reciterAktif === "object" ? reciterAktif.perAyah : false;

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={handleBack} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={theme.iconColor} style={flip} />
        </Pressable>

        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>{t("studyTag")}</Text>
          <Text className={`text-base font-bold ${theme.text}`}>{t("mushafLearn")}</Text>
        </View>

        <Pressable
          onPress={handleBookmarkPress}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={24}
            color={justSaved ? "#059669" : theme.iconColor}
            fill={justSaved ? "#059669" : "transparent"}
          />
        </Pressable>
      </View>

      {loading && (
        <View className={`flex-row items-center justify-center gap-2 py-2 ${isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50"}`}>
          <ActivityIndicator size="small" color={isDarkMode ? "#34d399" : "#047857"} />
          <Text className={`text-xs ${theme.textMuted}`}>{t("loadingReading")}</Text>
        </View>
      )}
      {error && !loading && (
        <Pressable
          onPress={() => { setError(null); setRetryKey((k) => k + 1); }}
          className="py-2 px-4 bg-red-500/10"
        >
          <Text className="text-xs text-center text-red-600">{t("tapRetry", { error: String(error) })}</Text>
        </Pressable>
      )}

      {/* Bar pindah surah: sebelumnya / daftar semua surah / berikutnya */}
      <View className={`flex-row items-center px-3 py-2 border-b ${theme.border}`}>
        <Pressable
          onPress={() => goToSurah(surahData.info.nomor - 1)}
          disabled={surahData.info.nomor <= 1}
          accessibilityRole="button"
          accessibilityLabel={t("prevSurah")}
          hitSlop={8}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${surahData.info.nomor <= 1 ? "opacity-30" : ""}`}
        >
          <ChevronLeft size={22} color={theme.iconColor} style={flip} />
        </Pressable>
        <Pressable
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={t("pickSurah")}
          className={`flex-1 mx-2 flex-row items-center justify-center gap-2 py-2 rounded-full border ${theme.border} ${theme.bgCard} active:opacity-70`}
        >
          <Text className={`text-sm font-bold ${theme.text}`} numberOfLines={1}>
            {surahData.info.nomor}. {surahData.info.namaLatin}
          </Text>
          <ChevronDown size={16} color={theme.iconColor} />
        </Pressable>
        <Pressable
          onPress={() => goToSurah(surahData.info.nomor + 1)}
          disabled={surahData.info.nomor >= 114}
          accessibilityRole="button"
          accessibilityLabel={t("nextSurah")}
          hitSlop={8}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${surahData.info.nomor >= 114 ? "opacity-30" : ""}`}
        >
          <ChevronRight size={22} color={theme.iconColor} style={flip} />
        </Pressable>
      </View>

      <SurahPickerSheet
        visible={showPicker}
        currentNomor={surahData.info.nomor}
        playingNomor={player.session?.surah ?? null}
        onClose={() => setShowPicker(false)}
        onSelect={(n) => {
          setShowPicker(false);
          if (n !== surahData.info.nomor) goToSurah(n);
        }}
      />

      <View className="flex-1" {...swipe.panHandlers}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >

        {/* 1. CARD BACAAN PILIHAN */}
        <View className={`mx-6 mt-6 p-4 ${theme.bgCard} border ${theme.border} rounded-2xl`}>
          <Text className={`text-xs font-medium ${theme.textSecondary} mb-3`}>Bacaan pilihan</Text>

          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={() => setShowQiraatOptions(!showQiraatOptions)} className="flex-row items-center gap-2">
              <Text className={`font-bold ${theme.text}`}>{t("pickReciter")}</Text>
              <Text className={`text-xs ${theme.textSecondary}`}>{showQiraatOptions ? "▲" : "▼"}</Text>
            </Pressable>

            <Pressable onPress={() => setShowQiraatOptions(!showQiraatOptions)} className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"}`}>
              <Headphones size={16} color={isDarkMode ? "#34d399" : "#047857"} />
              <Text className={`text-xs font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`} numberOfLines={1}>
                {activeReciterLabel}
              </Text>
            </Pressable>
          </View>

          {showQiraatOptions && (
            <View className={`mt-2 pt-3 border-t ${theme.border}`}>
              {/* Filter jenis audio */}
              <View className="flex-row gap-2 mb-3">
                {([
                  { key: "all", label: t("all") },
                  { key: "ayah", label: t("filterPerAyah") },
                  { key: "surah", label: t("filterFullSurah") },
                ] as { key: ReciterFilter; label: string }[]).map((f) => {
                  const active = reciterFilter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      onPress={() => setReciterFilter(f.key)}
                      className={`px-3 py-1.5 rounded-full border ${
                        active ? "bg-emerald-600 border-emerald-600" : `${theme.bgCard} ${theme.border}`
                      }`}
                    >
                      <Text className={`text-xs font-medium ${active ? "text-white" : theme.text}`}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className={`text-[11px] mb-2 ${theme.textMuted}`}>
                {t("reciterCount", { n: filteredReciters.length })}
              </Text>

              <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator>
                {filteredReciters.length === 0 && (
                  <Text className={`text-xs text-center py-4 ${theme.textMuted}`}>
                    {t("noReciterFilter")}
                  </Text>
                )}
                {filteredReciters.map((reciter) => {
                  const isSelected = String(reciter.id) === selectedReciterId;
                  const detail = reciterDetail(reciter, lang);
                  return (
                    <Pressable
                      key={reciter.id}
                      onPress={() => handleSelectReciter(reciter.id)}
                      className={`flex-row items-center justify-between px-3 py-2.5 mb-1.5 rounded-xl ${
                        isSelected ? "bg-emerald-600" : isDarkMode ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          numberOfLines={1}
                          className={`text-sm font-medium ${isSelected ? "text-white" : theme.text}`}
                        >
                          {reciterName(reciter.reciter || reciter.name, lang)}
                        </Text>
                        {!!detail && (
                          <Text
                            numberOfLines={1}
                            className={`text-[11px] mt-0.5 ${isSelected ? "text-emerald-100" : theme.textMuted}`}
                          >
                            {detail}
                          </Text>
                        )}
                      </View>
                      <View
                        className={`px-2 py-0.5 rounded ${
                          isSelected
                            ? "bg-white/25"
                            : reciter.perAyah
                            ? "bg-emerald-600/20"
                            : isDarkMode ? "bg-gray-700" : "bg-gray-300"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isSelected
                              ? "text-white"
                              : reciter.perAyah
                              ? isDarkMode ? "text-emerald-300" : "text-emerald-700"
                              : theme.textMuted
                          }`}
                        >
                          {reciter.perAyah ? t("badgeAyah") : t("badgeSurah")}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 2. INFORMASI SURAT */}
        <View className="px-6 mt-6 mb-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary} mb-1`}>
                {t("surahHeader", { n: String(surahData.info.nomor).padStart(2, "0"), type: surahData.info.tempatTurun === "Mekah" ? t("makkiyahCaps") : t("madaniyahCaps") })}
              </Text>
              <Text className={`text-2xl font-bold ${theme.text} mb-1`}>{surahData.info.namaLatin}</Text>
              <Text className={`text-sm ${theme.textMuted}`}>{surahData.info.arti} • {surahData.info.jumlahAyat} {t("versesWord")}</Text>

              {/* Badge Mushaf & Qari Aktif */}
              <View className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 self-start">
                <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                  📜 {t("mushafLabel")}: {surahData.info.mushafAktif}
                </Text>
                <Text className={`text-[10px] mt-0.5 ${isDarkMode ? "text-emerald-400/70" : "text-emerald-700/70"}`}>
                  🎙️ {t("reciterLabel")}: {reciterName(reciterAktifName, lang)} {isPerAyahActive ? t("syncAyah") : t("perSurahLabel")}
                </Text>
              </View>
            </View>

            <View className={`h-12 w-12 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-700"} items-center justify-center`}>
              <Text className={`font-bold text-lg ${isDarkMode ? "text-emerald-400" : "text-emerald-800"}`}>{surahData.info.nomor}</Text>
            </View>
          </View>
        </View>

        {/* 3. AUDIO PLAYER FULL SURAH */}
        {audioFullUrl ? (
          <View className="px-6 mb-4">
            <AudioPlayer
              audioUrl={audioFullUrl}
              title={`Murottal Full: ${surahData.info.namaLatin}`}
              notifTitle={surahData.info.namaLatin}
              artist={reciterAktifName !== "—" ? reciterAktifName : undefined}
              surahNomor={surahData.info.nomor}
              reciterId={selectedReciterId ? Number(selectedReciterId) : null}
              mushafId={activeMushafId}
            />
          </View>
        ) : (
          <View className="px-6 mb-4">
            <View className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} items-center`}>
              <Text className={`text-sm ${theme.textMuted}`}>
                {t("onlyPerAyah")}
              </Text>
            </View>
          </View>
        )}

        {/* 3b. TOMBOL IKUTI BACAAN (audio per-ayat, otomatis lanjut + highlight) */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={handleToggleFollowMode}
            disabled={!hasPerAyahAudio}
            className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
              !hasPerAyahAudio
                ? isDarkMode ? "bg-gray-800" : "bg-gray-100"
                : ayahPlaylist.isPlaying
                ? "bg-emerald-600"
                : isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50"
            } border ${theme.border} active:opacity-80`}
          >
            {!hasPerAyahAudio ? null : ayahPlaylist.isPlaying ? (
              <Pause size={18} color="#fff" />
            ) : (
              <Play size={18} color={isDarkMode ? "#34d399" : "#047857"} />
            )}
            <Text
              className={`text-sm font-bold ${
                !hasPerAyahAudio
                  ? theme.textMuted
                  : ayahPlaylist.isPlaying
                  ? "text-white"
                  : isDarkMode ? "text-emerald-300" : "text-emerald-800"
              }`}
            >
              {!hasPerAyahAudio
                ? t("noPerAyah")
                : ayahPlaylist.isPlaying
                ? t("followAyahN", { n: activeAyahNumber ?? 1 })
                : followStarted
                ? t("followContinue")
                : t("followStart")}
            </Text>
          </Pressable>
        </View>

        {/* 4. AYAT-AYAT */}
        <View
          className="px-6"
          onLayout={(e) => { ayahListOffsetY.current = e.nativeEvent.layout.y; }}
        >
          {surahData.ayat.map((ayat) => {
            const isActive = activeAyahNumber === ayat.nomor;
            const isPlayingThisAyat = isActive && ayahPlaylist.isPlaying;
            const isLastRead = !isActive && lastReadAyahNumber === ayat.nomor;

            return (
              <View
                key={ayat.nomor}
                onLayout={(e) => { ayahOffsetY.current[ayat.nomor] = e.nativeEvent.layout.y; }}
                className={`mb-4 rounded-2xl border p-4 ${
                  isActive
                    ? isDarkMode ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-600 bg-emerald-50"
                    : isLastRead
                    ? isDarkMode ? "border-amber-700 bg-amber-900/10" : "border-amber-300 bg-amber-50"
                    : `${theme.border} ${theme.bgCard}`
                }`}
              >
                {isLastRead && (
                  <View className="flex-row items-center gap-1 mb-2 -mt-1">
                    <Bookmark size={12} color={isDarkMode ? "#fbbf24" : "#b45309"} fill={isDarkMode ? "#fbbf24" : "#b45309"} />
                    <Text className={`text-[11px] font-semibold ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}>
                      {t("lastReadMarker")}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-4">
                  <Pressable
                    onPress={() => confirmMarkAyah(ayat.nomor)}
                    accessibilityRole="button"
                    accessibilityLabel={t("markAyahTitle")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className={`h-8 w-8 rounded-full ${isLastRead ? "bg-amber-200" : "bg-[#f5f0e1]"} items-center justify-center active:opacity-70`}
                  >
                    <Text className={`text-xs font-bold text-emerald-800`}>{ayat.nomor}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handlePlayAyat(ayat.nomor)}
                    disabled={!ayat.audio}
                    className={`p-2 rounded-full ${isPlayingThisAyat ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"} active:opacity-70 ${!ayat.audio ? "opacity-30" : ""}`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Volume2 size={18} color={isPlayingThisAyat ? "#fff" : theme.iconColor} />
                  </Pressable>
                </View>

                <View className="items-center mb-4 px-2">
                  <Text
                    className={`text-3xl text-center ${theme.text}`}
                    style={{
                      writingDirection: "rtl",
                      textAlign: "right",
                      lineHeight: 75,
                      includeFontPadding: false,
                      textAlignVertical: "center",
                      fontFamily: QURAN_FONT,
                    }}
                  >
                    {ayat.teksArab}
                  </Text>
                </View>

                <Text className={`text-sm leading-6 ${theme.textMuted}`} style={{ textAlign: "center" }}>
                  {ayat.teksIndonesia}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Pindah surah: tombol (alternatif untuk geser layar) */}
        <View className="flex-row items-center justify-between gap-3 px-6 pt-6">
          <Pressable
            onPress={() => goToSurah(surahData.info.nomor - 1)}
            disabled={surahData.info.nomor <= 1}
            accessibilityRole="button"
            accessibilityLabel={t("prevSurah")}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-80 ${surahData.info.nomor <= 1 ? "opacity-40" : ""}`}
          >
            <ArrowLeft size={18} color={theme.iconColor} style={flip} />
            <Text className={`text-sm font-semibold ${theme.text}`}>{t("prevSurah")}</Text>
          </Pressable>
          <Pressable
            onPress={() => goToSurah(surahData.info.nomor + 1)}
            disabled={surahData.info.nomor >= 114}
            accessibilityRole="button"
            accessibilityLabel={t("nextSurah")}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-700 active:opacity-90 ${surahData.info.nomor >= 114 ? "opacity-40" : ""}`}
          >
            <Text className="text-sm font-semibold text-white">{t("nextSurah")}</Text>
            <ArrowRight size={18} color="#fff" style={flip} />
          </Pressable>
        </View>
        <Text className={`text-center text-[11px] mt-3 ${theme.textMuted}`}>{t("swipeSurahHint")}</Text>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}