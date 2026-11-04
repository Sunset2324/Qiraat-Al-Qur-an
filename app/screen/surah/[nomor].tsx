import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, PanResponder, Dimensions, Alert, TextInput, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, ArrowRight, Bookmark, Volume2, Play, Pause, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDetailSurahMerged, getReciters, getMushafList, type Reciter } from "../../../src/services/quranService";
import { usePlayer, type PlayerSession } from "../../../src/context/PlayerContext";
import SurahPickerSheet from "../../../src/components/SurahPickerSheet";
import AudioPlayer from "../../../src/components/AudioPlayer";
import { useLanguage } from "../../../src/context/LanguageContext";
import { reciterName, recitationLabel, rawiLabel } from "../../../src/i18n/qiraatI18n";
import { saveLastRead, getLastReadAyah } from "../../../src/utils/readingHistory";
import AyatCard from "../../../src/components/AyatCard";
import TajweedLegend from "../../../src/components/TajweedLegend";
import { TAJWEED_MUSHAF_ID } from "../../../src/utils/tajweedColor";

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
    // ayat Hafs yang tidak terwakili di data riwayat ini (kosong = lengkap)
    ayatTidakLengkap?: number[];
  };
  audioFull?: string;
  ayat: AyatItem[];
}

const RECITER_STORAGE_KEY = "selected_reciter_id";
const SHOW_LATIN_KEY = "surah_show_latin";
const SHOW_TRANSLATION_KEY = "surah_show_translation";
// Jumlah kartu ayat yang dipasang di awal, lalu ditambah bertahap (surah panjang jadi tidak berat)
const INITIAL_AYAH_BATCH = 12;
const AYAH_BATCH_STEP = 16;

type ReciterFilter = "all" | "ayah" | "surah";

export default function SurahDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang, flip, isRTL } = useLanguage();
  const { nomor, mushafId: routeMushafId, ayat: routeAyat } = useLocalSearchParams();
  const { width: winWidth } = useWindowDimensions();
  const compact = winWidth < 360;
  const gutter = compact ? 16 : 24;

  // Preferensi tampilan baca (disimpan di perangkat)
  const [showLatin, setShowLatin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [l, tr] = await Promise.all([
          AsyncStorage.getItem(SHOW_LATIN_KEY),
          AsyncStorage.getItem(SHOW_TRANSLATION_KEY),
        ]);
        if (l === "0") setShowLatin(false);
        if (tr === "0") setShowTranslation(false);
      } catch {}
    })();
  }, []);
  const toggleLatin = useCallback(() => {
    setShowLatin((v) => {
      AsyncStorage.setItem(SHOW_LATIN_KEY, v ? "0" : "1").catch(() => {});
      return !v;
    });
  }, []);
  const toggleTranslation = useCallback(() => {
    setShowTranslation((v) => {
      AsyncStorage.setItem(SHOW_TRANSLATION_KEY, v ? "0" : "1").catch(() => {});
      return !v;
    });
  }, []);

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
  const [reciterQuery, setReciterQuery] = useState("");

  // Naikkan angka ini buat memicu fetch ulang (dipakai tombol "Coba Lagi")
  const [retryKey, setRetryKey] = useState(0);

  const [activeMushafId, setActiveMushafId] = useState<string>("1");
  // Rawi (riwayat) dari mushaf aktif: daftar qari hanya memuat qari yang membaca riwayat ini
  const [activeRawi, setActiveRawi] = useState<string | null>(null);

  const activeReciter = reciters.find((r) => String(r.id) === selectedReciterId);
  const activeReciterLabel = activeReciter
    ? reciterName(activeReciter.reciter || activeReciter.name, lang)
    : reciters.length === 0
    ? t("loading")
    : t("pickReciterShort");

  // Ambil daftar reciter: hanya yang punya surah ini DAN membaca riwayat (qiraat) mushaf aktif,
  // lalu pilih qari: 1) pilihan sekarang kalau masih valid, 2) pilihan terakhir untuk riwayat ini,
  // 3) qari pertama yang support per-ayat.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setRecitersSurah(null); // tahan pemuat surah sampai daftar qari yang baru siap
        const surahNumber = Number(nomor);

        let mid = routeMushafId ? String(routeMushafId) : "";
        if (!mid) mid = (await AsyncStorage.getItem("selected_mushaf_id")) || "1";
        let rawi: string | null = null;
        try {
          const mushafs = await getMushafList();
          rawi = mushafs.find((m: any) => String(m.id) === mid)?.rawi ?? null;
        } catch {
          // daftar mushaf gagal dimuat: lanjut tanpa filter rawi
        }
        if (cancelled) return;
        setActiveMushafId(mid);
        setActiveRawi(rawi);

        const [list, savedId, legacyId] = await Promise.all([
          getReciters(rawi, Number.isFinite(surahNumber) ? surahNumber : null),
          AsyncStorage.getItem(`${RECITER_STORAGE_KEY}_${rawi ?? "all"}`),
          AsyncStorage.getItem(RECITER_STORAGE_KEY), // kunci lama (sebelum dipisah per riwayat)
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
          if (valid(legacyId)) return legacyId;
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
  }, [nomor, routeMushafId, retryKey]);

  const handleSelectReciter = (id: number) => {
    const idStr = String(id);
    setSelectedReciterId(idStr);
    setShowQiraatOptions(false);
    AsyncStorage.setItem(`${RECITER_STORAGE_KEY}_${activeRawi ?? "all"}`, idStr).catch(() => {});
  };

  const filteredReciters = useMemo(() => {
    const q = reciterQuery.trim().toLowerCase();
    return reciters
      .filter((r) => {
        const ayah = r.hasAyah ?? r.perAyah;
        const full = r.hasFull ?? !r.perAyah;
        return reciterFilter === "all" ? true : reciterFilter === "ayah" ? ayah : full;
      })
      .filter((r) => {
        if (!q) return true;
        const latin = reciterName(r.reciter || r.name, lang).toLowerCase();
        return latin.includes(q) || (r.reciter || r.name).includes(reciterQuery.trim());
      })
      .map((r) => ({ r, label: reciterName(r.reciter || r.name, lang) }))
      .sort((x, y) => x.label.localeCompare(y.label, lang === "ar" ? "ar" : "en"))
      .map((x) => x.r);
  }, [reciters, reciterFilter, reciterQuery, lang]);

  // ▶ Mode "Ikuti Bacaan": playlist audio per-ayat yang otomatis lanjut
  // ke ayat berikutnya, dipakai juga untuk tombol play per-ayat.
  const ayahAudioUrls = useMemo(() => surahData?.ayat.map((a) => a.audio) ?? [], [surahData]);
  // Data notifikasi media: nama surah + nama qari yang sedang aktif.
  const lockMeta = useMemo(() => {
    const ra = surahData?.info.reciterAktif;
    const nama = ra && typeof ra === "object" ? ra.nama : typeof ra === "string" ? ra : undefined;
    return { title: surahData?.info.namaLatin, artist: nama ? reciterName(nama, lang) : undefined };
  }, [surahData, lang]);

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

  // Pemasangan kartu ayat bertahap
  const [renderCount, setRenderCount] = useState(INITIAL_AYAH_BATCH);
  const totalAyat = surahData?.ayat.length ?? 0;
  const jumpTargetAyah = (() => {
    const p = routeAyat ? parseInt(String(routeAyat), 10) : NaN;
    return Number.isFinite(p) ? p : lastReadAyahNumber;
  })();

  // Reset saat pindah surah
  const prevSurahNoRef = useRef<number | null>(null);
  useEffect(() => {
    const n = surahData?.info.nomor ?? null;
    if (prevSurahNoRef.current != null && n !== prevSurahNoRef.current) {
      setRenderCount(INITIAL_AYAH_BATCH);
      ayahOffsetY.current = {};
    }
    if (n != null) prevSurahNoRef.current = n;
  }, [surahData?.info.nomor]);

  // Pastikan ayat tujuan (deep-link / terakhir dibaca / ayat aktif audio) sudah terpasang
  useEffect(() => {
    if (!surahData) return;
    const idxOf = (n: number | null) => (n == null ? -1 : surahData.ayat.findIndex((a) => a.nomor === n));
    const need = Math.max(idxOf(jumpTargetAyah), idxOf(activeAyahNumber)) + 6;
    if (need > renderCount) setRenderCount(Math.min(totalAyat, need));
  }, [surahData, jumpTargetAyah, activeAyahNumber, renderCount, totalAyat]);

  // Tambah batch berikutnya setelah frame selesai (tidak memblokir scroll/sentuhan)
  useEffect(() => {
    if (!surahData || renderCount >= totalAyat) return;
    const id = setTimeout(() => setRenderCount((c) => Math.min(totalAyat, c + AYAH_BATCH_STEP)), 80);
    return () => clearTimeout(id);
  }, [surahData, renderCount, totalAyat]);

  const handleAyahLayout = useCallback((n: number, y: number) => {
    ayahOffsetY.current[n] = y;
  }, []);


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

  // Handler stabil untuk AyatCard (memo): selalu memanggil versi terbaru lewat ref
  const cardActionsRef = useRef({ mark: (_n: number) => {}, play: (_n: number) => {} });
  cardActionsRef.current = { mark: confirmMarkAyah, play: handlePlayAyat };
  const handleCardMark = useCallback((n: number) => cardActionsRef.current.mark(n), []);
  const handleCardPlay = useCallback((n: number) => cardActionsRef.current.play(n), []);

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
      <View
        className={`items-center px-3 py-2 border-b ${theme.border}`}
        style={{ flexDirection: isRTL ? "row" : "row-reverse" }}
      >
        <Pressable
          onPress={() => goToSurah(surahData.info.nomor - 1)}
          disabled={surahData.info.nomor <= 1}
          accessibilityRole="button"
          accessibilityLabel={t("prevSurah")}
          hitSlop={8}
          className={`h-9 w-9 items-center justify-center rounded-full active:opacity-60 ${surahData.info.nomor <= 1 ? "opacity-30" : ""}`}
        >
          <ChevronRight size={22} color={theme.iconColor} />
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
          <ChevronLeft size={22} color={theme.iconColor} />
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
        contentContainerStyle={{ paddingBottom: 56 }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >

        {/* 1. CHOOSE RECITER */}
        <View style={{ marginHorizontal: gutter }} className={`mt-5 px-3 py-2.5 ${theme.bgCard} border ${theme.border} rounded-2xl`}>
          <View className="flex-row items-center justify-between gap-3">
            <Text className={`text-sm font-bold ${theme.text}`}>{t("pickReciter")}</Text>
            <Pressable
              onPress={() => setShowQiraatOptions(!showQiraatOptions)}
              accessibilityRole="button"
              className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"} active:opacity-70`}
              style={{ maxWidth: "62%" }}
            >
              <Text className={`text-xs font-medium flex-shrink ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`} numberOfLines={1}>
                {activeReciterLabel}
              </Text>
              <ChevronDown size={14} color={isDarkMode ? "#34d399" : "#047857"} />
            </Pressable>
          </View>
          {!!activeRawi && (
            <Text className={`text-[11px] mt-1.5 ${theme.textMuted}`}>
              {t("reciterQiraatNote", { name: rawiLabel(activeRawi, lang) })}
            </Text>
          )}

          {showQiraatOptions && (
            <View className={`mt-2 pt-3 border-t ${theme.border}`}>
              <TextInput
                value={reciterQuery}
                onChangeText={setReciterQuery}
                placeholder={t("searchReciter")}
                placeholderTextColor={theme.mutedColor}
                autoCorrect={false}
                className={`px-3 py-2 mb-3 rounded-xl border text-sm ${theme.border} ${theme.bgCard} ${theme.text}`}
              />

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

              <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
                {filteredReciters.length === 0 && (
                  <Text className={`text-xs text-center py-4 ${theme.textMuted}`}>
                    {t("noReciterFilter")}
                  </Text>
                )}
                {filteredReciters.map((reciter) => {
                  const isSelected = String(reciter.id) === selectedReciterId;
                  const arabicName = reciter.reciter || reciter.name;
                  const label = reciterName(arabicName, lang);
                  const sub = [
                    lang !== "ar" && label !== arabicName ? arabicName : "",
                    recitationLabel(reciter.recitationType, lang),
                  ]
                    .filter(Boolean)
                    .join(" • ");
                  const hasAyah = reciter.hasAyah ?? reciter.perAyah;
                  const hasFull = reciter.hasFull ?? !reciter.perAyah;
                  const chip = (text: string) => (
                    <View
                      className={`px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-white/25" : isDarkMode ? "bg-emerald-900/50" : "bg-emerald-600/15"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          isSelected ? "text-white" : isDarkMode ? "text-emerald-300" : "text-emerald-700"
                        }`}
                      >
                        {text}
                      </Text>
                    </View>
                  );
                  return (
                    <Pressable
                      key={reciter.id}
                      onPress={() => handleSelectReciter(reciter.id)}
                      className={`flex-row items-center justify-between px-3 py-2.5 mb-1.5 rounded-xl border ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600"
                          : `${theme.bgCard} ${theme.border}`
                      }`}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          numberOfLines={1}
                          className={`text-sm font-semibold ${isSelected ? "text-white" : theme.text}`}
                        >
                          {label}
                        </Text>
                        {!!sub && (
                          <Text
                            numberOfLines={1}
                            className={`text-[11px] mt-0.5 ${isSelected ? "text-emerald-100" : theme.textMuted}`}
                          >
                            {sub}
                          </Text>
                        )}
                      </View>
                      <View className="flex-row gap-1">
                        {hasAyah && chip(t("badgeAyah"))}
                        {hasFull && chip(t("badgeSurah"))}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 2. INFORMASI SURAT + IKUTI BACAAN */}
        <View style={{ paddingHorizontal: gutter }} className="mt-5 mb-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className={`text-[11px] font-bold tracking-[2px] ${theme.textSecondary} mb-1`}>
                {t("surahHeader", { n: String(surahData.info.nomor), type: surahData.info.tempatTurun === "Mekah" ? t("makkiyahCaps") : t("madaniyahCaps") })}
              </Text>
              <Text className={`text-2xl font-bold ${theme.text}`}>{surahData.info.namaLatin}</Text>
              <Text className={`text-sm ${theme.textMuted}`}>{surahData.info.arti} • {surahData.info.jumlahAyat} {t("versesWord")}</Text>
            </View>

            <Pressable
              onPress={handleToggleFollowMode}
              disabled={!hasPerAyahAudio}
              accessibilityRole="button"
              className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full active:opacity-80 ${
                !hasPerAyahAudio
                  ? isDarkMode ? "bg-gray-800" : "bg-gray-200"
                  : ayahPlaylist.isPlaying ? "bg-emerald-600" : "bg-emerald-700"
              }`}
            >
              {hasPerAyahAudio ? (
                ayahPlaylist.isPlaying ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />
              ) : null}
              <Text className={`text-xs font-bold ${hasPerAyahAudio ? "text-white" : theme.textMuted}`}>
                {t("followAlong")}
              </Text>
            </Pressable>
          </View>

          <Text className={`text-[11px] mt-2 ${isDarkMode ? "text-emerald-400/80" : "text-emerald-700/80"}`}>
            📜 {surahData.info.mushafAktif} • 🎙️ {reciterName(reciterAktifName, lang)} {isPerAyahActive ? t("syncAyah") : t("perSurahLabel")}
          </Text>
          {!hasPerAyahAudio && (
            <Text className={`text-[11px] mt-1 ${theme.textMuted}`}>{t("noPerAyah")}</Text>
          )}
          {!!surahData.info.ayatTidakLengkap?.length && (
            <View className="mt-2 px-3 py-2 rounded-xl bg-amber-500/15">
              <Text className={`text-[11px] ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
                {t("ayahIncomplete", { list: surahData.info.ayatTidakLengkap.join(", ") })}
              </Text>
            </View>
          )}
        </View>

        {/* Keterangan warna tajwid (khusus mushaf Tajwid Berwarna) */}
        {String(activeMushafId) === TAJWEED_MUSHAF_ID && (
          <View style={{ paddingHorizontal: gutter }}>
            <TajweedLegend />
          </View>
        )}

        {/* 3. AUDIO PLAYER FULL SURAH */}
        {audioFullUrl ? (
          <View style={{ paddingHorizontal: gutter }} className="mb-4">
            <AudioPlayer
              audioUrl={audioFullUrl}
              title={`Murottal Full: ${surahData.info.namaLatin}`}
              notifTitle={surahData.info.namaLatin}
              artist={reciterAktifName !== "—" ? reciterName(reciterAktifName, lang) : undefined}
              surahNomor={surahData.info.nomor}
              reciterId={selectedReciterId ? Number(selectedReciterId) : null}
              mushafId={activeMushafId}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: gutter }} className="mb-4">
            <View className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} items-center`}>
              <Text className={`text-sm ${theme.textMuted}`}>
                {t("onlyPerAyah")}
              </Text>
            </View>
          </View>
        )}

        {/* 4. AYAT-AYAT */}
        <View
          style={{ paddingHorizontal: gutter }}
          onLayout={(e) => { ayahListOffsetY.current = e.nativeEvent.layout.y; }}
        >
          {/* Pilihan tampilan baca: sembunyikan latin / terjemahan */}
          <View className="flex-row flex-wrap items-center gap-2 mb-4">
            {([
              { key: "latin", on: showLatin, toggle: toggleLatin, label: t("readLatin") },
              { key: "tr", on: showTranslation, toggle: toggleTranslation, label: t("readTranslation") },
            ]).map((c) => (
              <Pressable
                key={c.key}
                onPress={c.toggle}
                accessibilityRole="switch"
                accessibilityState={{ checked: c.on }}
                className={`px-3.5 py-2 rounded-full border active:opacity-80 ${
                  c.on
                    ? isDarkMode ? "bg-emerald-900/40 border-emerald-700" : "bg-emerald-50 border-emerald-300"
                    : `${theme.border} ${theme.bgCard}`
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-xs font-semibold ${c.on ? (isDarkMode ? "text-emerald-300" : "text-emerald-800") : theme.textMuted}`}
                >
                  {c.on ? "✓ " : ""}{c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {surahData.ayat.slice(0, renderCount).map((ayat) => {
            const isActive = activeAyahNumber === ayat.nomor;
            return (
              <AyatCard
                key={ayat.nomor}
                nomor={ayat.nomor}
                teksArab={ayat.teksArab}
                teksLatin={ayat.teksLatin}
                teksIndonesia={ayat.teksIndonesia}
                hasAudio={!!ayat.audio}
                isActive={isActive}
                isPlaying={isActive && ayahPlaylist.isPlaying}
                isLastRead={!isActive && lastReadAyahNumber === ayat.nomor}
                isDark={isDarkMode}
                isTajweed={String(activeMushafId) === TAJWEED_MUSHAF_ID}
                isArabicUi={lang === "ar"}
                compact={compact}
                showLatin={showLatin}
                showTranslation={showTranslation}
                borderClass={theme.border}
                cardClass={theme.bgCard}
                textClass={theme.text}
                mutedClass={theme.textMuted}
                iconColor={theme.iconColor}
                lastReadLabel={t("lastReadMarker")}
                markLabel={t("markAyahTitle")}
                onLayoutY={handleAyahLayout}
                onMark={handleCardMark}
                onPlay={handleCardPlay}
              />
            );
          })}
          {renderCount < totalAyat && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={theme.iconColor} />
            </View>
          )}
        </View>

        {/* Pindah surah: tombol (alternatif untuk geser layar) */}
        <View
          className="items-center justify-between gap-3 pt-6"
          style={{ flexDirection: isRTL ? "row" : "row-reverse", paddingHorizontal: gutter }}
        >
          <Pressable
            onPress={() => goToSurah(surahData.info.nomor - 1)}
            disabled={surahData.info.nomor <= 1}
            accessibilityRole="button"
            accessibilityLabel={t("prevSurah")}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-80 ${surahData.info.nomor <= 1 ? "opacity-40" : ""}`}
          >
            <ArrowRight size={18} color={theme.iconColor} />
            <Text numberOfLines={1} className={`text-sm font-semibold flex-shrink ${theme.text}`}>{t("prevSurah")}</Text>
          </Pressable>
          <Pressable
            onPress={() => goToSurah(surahData.info.nomor + 1)}
            disabled={surahData.info.nomor >= 114}
            accessibilityRole="button"
            accessibilityLabel={t("nextSurah")}
            className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-700 active:opacity-90 ${surahData.info.nomor >= 114 ? "opacity-40" : ""}`}
          >
            <Text numberOfLines={1} className="text-sm font-semibold text-white flex-shrink">{t("nextSurah")}</Text>
            <ArrowLeft size={18} color="#fff" />
          </Pressable>
        </View>
        <Text className={`text-center text-[11px] mt-3 ${theme.textMuted}`}>{t("swipeSurahHint")}</Text>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}