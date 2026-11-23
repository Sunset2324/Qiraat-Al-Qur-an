import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, type ViewToken } from "react-native";
import { ChevronDown, ChevronUp, Minus, Plus, ArrowLeftRight, Play, Pause, Repeat1, Highlighter, Undo2, Redo2, Trash2, Eraser } from "lucide-react-native";
import MarkedAyah from "./MarkedAyah";
import { applyMark, loadMarks, saveMarks, MARK_COLORS, type WordMark, type MarkType, type MarkColor } from "../../utils/teachMarks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayer } from "../../context/PlayerContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { getMushafList, getDetailSurahMerged, getDaftarSurah, getReciters, type Reciter } from "../../services/quranService";
import { quranTextStyle } from "../../constants/fonts";
import { mushafTitle, reciterName } from "../../i18n/qiraatI18n";
import { riwayahIdOfMushafRawi } from "../../data/qiraatSabah";
import { TAJWEED_MUSHAF_ID } from "../../utils/tajweedColor";
import SurahPickerSheet from "../SurahPickerSheet";

/**
 * Mode Mengajar · Bandingkan Riwayat (tablet).
 * Satu surah yang SAMA di dua panel, masing-masing SATU riwayat (anti-talfiq: tidak ada pengganti Hafsh).
 */

interface MushafItem {
  id: string;
  name: string;
  rawi?: string | null;
}
interface AyatItem {
  nomor: number;
  teksArab: string;
  audio?: string;
}
interface SurahData {
  info: {
    nomor: number;
    namaLatin: string;
    ayatTidakLengkap?: number[];
    reciterAktif?: { id: number; nama: string; perAyah: boolean } | string | null;
  };
  ayat: AyatItem[];
}

// Pengali ukuran teks Arab untuk dibaca dari jauh
const SCALES = [1, 1.25, 1.5, 1.85];

type Lang = "id" | "en" | "ar";

// Kunci yang sama dengan layar surah: qari terakhir per riwayat
const RECITER_STORAGE_KEY = "selected_reciter_id";

interface PanelProps {
  surah: number;
  surahName: string;
  mushaf: MushafItem;
  options: MushafItem[];
  blockedRiwayah: string | null;
  scale: number;
  lang: Lang;
  onPickMushaf: (id: string) => void;
  onTopAyah?: (nomor: number) => void;
  /** Diisi panel: gulir ke ayat bernomor n (atau ayat berikutnya yang ada di riwayat ini). */
  controlRef: React.MutableRefObject<((n: number) => void) | null>;
  // Tanda per kata
  marks: WordMark[];
  markMode: boolean;
  /** kata awal rentang (tekan lama) di panel ini */
  pending: { ayah: number; idx: number } | null;
  onWord: (mushafId: string, ayah: number, idx: number) => void;
  onWordLong: (mushafId: string, ayah: number, idx: number) => void;
}

const NO_MARKS: WordMark[] = [];

const RiwayatPanel = memo(function RiwayatPanel(p: PanelProps) {
  const { isDarkMode, theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const marksByAyah = useMemo(() => {
    const map = new Map<number, WordMark[]>();
    for (const m of p.marks) map.set(m.ayah, [...(map.get(m.ayah) ?? []), m]);
    return map;
  }, [p.marks]);
  const mushafId = p.mushaf.id;
  const onWordRef = useRef(p.onWord);
  onWordRef.current = p.onWord;
  const onWordLongRef = useRef(p.onWordLong);
  onWordLongRef.current = p.onWordLong;
  const handleWord = useCallback((ayah: number, idx: number) => onWordRef.current(mushafId, ayah, idx), [mushafId]);
  const handleWordLong = useCallback((ayah: number, idx: number) => onWordLongRef.current(mushafId, ayah, idx), [mushafId]);
  const [data, setData] = useState<SurahData | null>(null);
  const [error, setError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [retry, setRetry] = useState(0);
  const player = usePlayer();
  // Qari: hanya qari riwayat panel ini yang punya audio per-ayat (anti-talfiq)
  const [reciters, setReciters] = useState<Reciter[] | null>(null);
  const [reciterId, setReciterId] = useState<number | null>(null);
  const [showReciters, setShowReciters] = useState(false);
  const [repeat, setRepeat] = useState(false);

  useEffect(() => {
    let alive = true;
    setReciters(null);
    const rawi = p.mushaf.rawi ?? null;
    Promise.all([
      getReciters(rawi, p.surah).catch(() => [] as Reciter[]),
      AsyncStorage.getItem(`${RECITER_STORAGE_KEY}_${rawi ?? "all"}`).catch(() => null),
    ]).then(([list, saved]) => {
      if (!alive) return;
      const perAyah = list.filter((r) => r.hasAyah ?? r.perAyah);
      setReciters(perAyah);
      setReciterId((prev) => {
        const ok = (id: number | null) => id != null && perAyah.some((r) => r.id === id);
        if (ok(prev)) return prev;
        const s = saved ? Number(saved) : null;
        if (ok(s)) return s;
        return perAyah[0]?.id ?? null;
      });
    });
    return () => {
      alive = false;
    };
  }, [p.surah, p.mushaf.id, p.mushaf.rawi]);

  // Teks (+ audio per ayat dari qari terpilih). Ditunggu sampai daftar qari siap.
  useEffect(() => {
    if (reciters === null) return;
    let alive = true;
    setData(null);
    setError(false);
    getDetailSurahMerged(p.surah, p.mushaf.id, "05", reciterId ?? undefined)
      .then((d: SurahData) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [p.surah, p.mushaf.id, reciterId, reciters, retry]);

  // Audio hanya dipakai bila server benar-benar memakai qari yang dipilih (bukan qari bawaan riwayat lain)
  const ra = data?.info.reciterAktif;
  const audioOk = reciterId != null && !!ra && typeof ra === "object" && ra.id === reciterId;
  const urls = useMemo(() => (audioOk && data ? data.ayat.map((a) => a.audio || "") : []), [audioOk, data]);
  const hasAudio = urls.some(Boolean);
  const activeReciter = reciters?.find((r) => r.id === reciterId);

  const isMine =
    player.session?.origin === "teach" && player.session.mushafId === p.mushaf.id && player.session.surah === p.surah;
  const activeIdx = isMine && player.session?.kind === "ayah" ? player.currentIndex : -1;
  const playingHere = isMine && player.isPlaying;

  const playFrom = (i: number) => {
    if (!data || !urls[i]) return;
    const ok = player.start(
      {
        kind: "ayah",
        surah: p.surah,
        surahName: p.surahName,
        reciterId,
        reciterName: activeReciter ? reciterName(activeReciter.reciter || activeReciter.name, p.lang) : undefined,
        mushafId: p.mushaf.id,
        urls,
        origin: "teach",
        stopAtEnd: true,
      },
      i
    );
    if (ok && repeat) player.setRepeatOne(true);
  };
  const onMainPlay = () => {
    if (isMine) return player.toggle();
    const first = urls.findIndex(Boolean);
    if (first >= 0) playFrom(first);
  };
  const onRepeat = () => {
    const v = !repeat;
    setRepeat(v);
    if (isMine) player.setRepeatOne(v);
  };
  const pickReciter = (id: number) => {
    setShowReciters(false);
    if (id === reciterId) return;
    if (isMine) player.stop(); // audio lama milik qari sebelumnya
    setReciterId(id);
    AsyncStorage.setItem(`${RECITER_STORAGE_KEY}_${p.mushaf.rawi ?? "all"}`, String(id)).catch(() => {});
  };

  const base = quranTextStyle(false);
  const arab = { ...base, fontSize: base.fontSize * p.scale, lineHeight: base.lineHeight * p.scale };
  const green = isDarkMode ? "#34d399" : "#047857";

  const listRef = useRef<FlatList<AyatItem> | null>(null);
  const onTopRef = useRef(p.onTopAyah);
  onTopRef.current = p.onTopAyah;
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable)?.item as AyatItem | undefined;
    if (first) onTopRef.current?.(first.nomor);
  }).current;

  // Nomor ayat belum tentu sama dengan indeks (ada riwayat dengan ayat yang tidak tersedia)
  p.controlRef.current = (n: number) => {
    if (!data) return;
    const idx = data.ayat.findIndex((a) => a.nomor >= n);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
  };

  // Ikuti ayat yang sedang dibaca
  useEffect(() => {
    if (activeIdx >= 0) {
      try {
        listRef.current?.scrollToIndex({ index: activeIdx, animated: true, viewPosition: 0.2 });
      } catch {}
    }
  }, [activeIdx]);

  const missing = data?.info.ayatTidakLengkap ?? [];

  return (
    <View
      className={`flex-1 rounded-3xl overflow-hidden ${theme.bgCard} ${isMine ? (isDarkMode ? "border-emerald-500" : "border-emerald-700") : theme.border}`}
      style={{ borderWidth: isMine ? 2 : 1 }}
    >
      {/* Kepala panel: riwayat yang tampil + pilihan riwayat lain */}
      <Pressable
        onPress={() => setShowOptions((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showOptions }}
        className={`flex-row items-center px-4 py-3 border-b ${theme.border}`}
        style={{ minHeight: 56 }}
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className={`text-[11px] font-bold ${theme.textMuted}`}>{t("cmpRiwayah")}</Text>
            {playingHere && (
              <View className="rounded-full px-2 py-0.5 bg-emerald-600">
                <Text className="text-[10px] font-extrabold text-white">{t("cmpPlaying")}</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} className={`text-base font-extrabold ${theme.text}`}>
            {mushafTitle(p.mushaf, p.lang)}
          </Text>
        </View>
        {showOptions ? <ChevronUp size={20} color={green} /> : <ChevronDown size={20} color={green} />}
      </Pressable>

      {showOptions && (
        <View className={`flex-row flex-wrap gap-2 p-3 border-b ${theme.border}`}>
          {p.options.map((m) => {
            const on = m.id === p.mushaf.id;
            const blocked = !on && riwayahIdOfMushafRawi(m.rawi) === p.blockedRiwayah;
            return (
              <Pressable
                key={m.id}
                disabled={blocked}
                onPress={() => {
                  setShowOptions(false);
                  if (!on) p.onPickMushaf(m.id);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: blocked }}
                accessibilityHint={blocked ? t("cmpUsedOther") : undefined}
                className={`rounded-full px-4 justify-center ${on ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-700") : isDarkMode ? "bg-gray-700" : "bg-[#f3ecd9]"} ${blocked ? "opacity-40" : ""}`}
                style={{ minHeight: 44 }}
              >
                <Text className={`text-sm font-bold ${on ? "text-white" : theme.text}`}>{mushafTitle(m, p.lang)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Baris audio: qari per-ayat riwayat ini + putar + ulangi */}
      <View className={`flex-row items-center gap-2 px-3 py-2 border-b ${theme.border}`}>
        {reciters === null ? (
          <ActivityIndicator size="small" color={green} />
        ) : reciters.length === 0 ? (
          <Text className={`flex-1 text-xs ${theme.textMuted}`}>{t("cmpNoAyahAudio")}</Text>
        ) : (
          <>
            <Pressable
              onPress={onMainPlay}
              disabled={!hasAudio}
              accessibilityRole="button"
              accessibilityLabel={playingHere ? t("cmpPause") : t("cmpPlay")}
              className={`items-center justify-center rounded-full ${playingHere ? "bg-emerald-600" : isDarkMode ? "bg-emerald-700" : "bg-emerald-700"} ${!hasAudio ? "opacity-40" : ""}`}
              style={{ width: 44, height: 44 }}
            >
              {playingHere ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
            </Pressable>
            <Pressable
              onPress={() => setShowReciters((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showReciters }}
              accessibilityLabel={t("cmpPickReciter")}
              className={`flex-1 flex-row items-center gap-1 rounded-xl px-3 ${isDarkMode ? "bg-gray-800" : "bg-[#f3ecd9]"}`}
              style={{ minHeight: 44 }}
            >
              <Text numberOfLines={1} className={`flex-1 text-sm font-semibold ${theme.text}`}>
                {activeReciter ? reciterName(activeReciter.reciter || activeReciter.name, p.lang) : t("cmpPickReciter")}
              </Text>
              {showReciters ? <ChevronUp size={16} color={green} /> : <ChevronDown size={16} color={green} />}
            </Pressable>
            <Pressable
              onPress={onRepeat}
              accessibilityRole="switch"
              accessibilityState={{ checked: repeat }}
              accessibilityLabel={t("cmpRepeat")}
              className={`items-center justify-center rounded-full ${repeat ? "bg-amber-400" : isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
              style={{ width: 44, height: 44 }}
            >
              <Repeat1 size={18} color={repeat ? "#022c22" : green} />
            </Pressable>
          </>
        )}
      </View>

      {showReciters && !!reciters?.length && (
        <View className={`flex-row flex-wrap gap-2 p-3 border-b ${theme.border}`}>
          {reciters.map((r) => {
            const on = r.id === reciterId;
            return (
              <Pressable
                key={r.id}
                onPress={() => pickReciter(r.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                className={`rounded-full px-4 justify-center ${on ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-700") : isDarkMode ? "bg-gray-700" : "bg-[#f3ecd9]"}`}
                style={{ minHeight: 44 }}
              >
                <Text className={`text-sm font-bold ${on ? "text-white" : theme.text}`}>
                  {reciterName(r.reciter || r.name, p.lang)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {missing.length > 0 && (
        <View className={`px-4 py-2 ${isDarkMode ? "bg-amber-900/30" : "bg-amber-50"}`}>
          <Text className={`text-xs ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>
            {t("cmpIncomplete", { n: missing.join(", ") })}
          </Text>
        </View>
      )}

      {error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className={`text-sm text-center ${theme.textSecondary}`}>{t("cmpLoadError")}</Text>
          <Pressable
            onPress={() => setRetry((r) => r + 1)}
            accessibilityRole="button"
            className={`mt-3 rounded-full px-5 justify-center ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
            style={{ minHeight: 44 }}
          >
            <Text className="text-sm font-bold text-white">{t("retry")}</Text>
          </Pressable>
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={green} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={data.ayat}
          keyExtractor={(a) => String(a.nomor)}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
          initialNumToRender={8}
          windowSize={7}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
          }}
          extraData={`${activeIdx}|${p.markMode}|${p.pending?.ayah}:${p.pending?.idx}|${p.marks.length}|${p.marks.at(-1)?.id ?? ""}`}
          renderItem={({ item, index }) => (
            <View
              className={`mb-3 rounded-2xl border px-4 py-3 ${
                index === activeIdx
                  ? isDarkMode ? "border-emerald-500 bg-emerald-900/30" : "border-emerald-600 bg-emerald-50"
                  : theme.border
              }`}
            >
              {/* Ketuk nomor ayat = putar mulai ayat ini */}
              <Pressable
                onPress={() => playFrom(index)}
                disabled={!urls[index]}
                accessibilityRole="button"
                accessibilityLabel={t("cmpPlayFrom", { n: item.nomor })}
                hitSlop={8}
                className={`self-start flex-row items-center gap-1 rounded-full px-2.5 py-1 ${isDarkMode ? "bg-emerald-900/50" : "bg-[#f5f0e1]"}`}
              >
                {!!urls[index] && <Play size={10} color={green} />}
                <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{item.nomor}</Text>
              </Pressable>
              <MarkedAyah
                ayah={item.nomor}
                text={item.teksArab}
                marks={marksByAyah.get(item.nomor) ?? NO_MARKS}
                arab={arab}
                color={isDarkMode ? "#f3f4f6" : "#022c22"}
                markMode={p.markMode}
                pendingIdx={p.pending?.ayah === item.nomor ? p.pending.idx : null}
                isRTL={isRTL}
                onWord={handleWord}
                onWordLong={handleWordLong}
              />
            </View>
          )}
        />
      )}
    </View>
  );
});

export default function CompareRiwayat() {
  const { isDarkMode, theme } = useTheme();
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const green = isDarkMode ? "#34d399" : "#047857";

  const [mushafs, setMushafs] = useState<MushafItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [surah, setSurah] = useState(1);
  const [surahNames, setSurahNames] = useState<Record<number, string>>({});
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const player = usePlayer();
  const playerRef = useRef(player);
  playerRef.current = player;
  const stopTeachAudio = useCallback(() => {
    if (playerRef.current.session?.origin === "teach") playerRef.current.stop();
  }, []);
  // Keluar dari tab/layar: audio Mode Mengajar ikut berhenti
  useEffect(() => stopTeachAudio, [stopTeachAudio]);

  // ── Tanda per kata (disimpan di perangkat per surah per riwayat) ──
  const [markMode, setMarkMode] = useState(false);
  const [tool, setTool] = useState<MarkType | "erase">("underline");
  const [color, setColor] = useState<MarkColor>("red");
  const [marksBy, setMarksBy] = useState<Record<string, WordMark[]>>({});
  const [pending, setPending] = useState<{ mushafId: string; ayah: number; idx: number } | null>(null);
  type Step = { mushafId: string; before: WordMark[]; after: WordMark[] };
  const [undoStack, setUndoStack] = useState<Step[]>([]);
  const [redoStack, setRedoStack] = useState<Step[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const marksRef = useRef(marksBy);
  marksRef.current = marksBy;
  const surahRef = useRef(surah);
  surahRef.current = surah;

  // Muat tanda tiap kali surah / riwayat panel berubah; riwayat urungkan direset
  useEffect(() => {
    let alive = true;
    const ids = [leftId, rightId].filter(Boolean) as string[];
    Promise.all(ids.map((id) => loadMarks(surah, id).then((m) => [id, m] as const))).then((pairs) => {
      if (!alive) return;
      setMarksBy(Object.fromEntries(pairs));
      setUndoStack([]);
      setRedoStack([]);
      setPending(null);
    });
    return () => {
      alive = false;
    };
  }, [surah, leftId, rightId]);

  const commit = useCallback((mushafId: string, after: WordMark[], record = true) => {
    const before = marksRef.current[mushafId] ?? [];
    setMarksBy((m) => ({ ...m, [mushafId]: after }));
    saveMarks(surahRef.current, mushafId, after);
    if (record) {
      setUndoStack((u) => [...u.slice(-49), { mushafId, before, after }]);
      setRedoStack([]);
    }
  }, []);

  const toolRef = useRef({ tool, color });
  toolRef.current = { tool, color };
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const onWord = useCallback(
    (mushafId: string, ayah: number, idx: number) => {
      const pd = pendingRef.current;
      const start = pd && pd.mushafId === mushafId && pd.ayah === ayah ? pd.idx : idx;
      setPending(null);
      const { tool: tl, color: cl } = toolRef.current;
      commit(mushafId, applyMark(marksRef.current[mushafId] ?? [], ayah, start, idx, tl, cl));
    },
    [commit]
  );
  const onWordLong = useCallback((mushafId: string, ayah: number, idx: number) => {
    setPending({ mushafId, ayah, idx });
  }, []);

  const undo = () => {
    const step = undoStack.at(-1);
    if (!step) return;
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, step]);
    commit(step.mushafId, step.before, false);
  };
  const redo = () => {
    const step = redoStack.at(-1);
    if (!step) return;
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, step]);
    commit(step.mushafId, step.after, false);
  };
  // Hapus semua tanda di surah ini (kedua panel): ketuk dua kali untuk konfirmasi
  useEffect(() => {
    if (!confirmClear) return;
    const tm = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(tm);
  }, [confirmClear]);
  const clearAll = () => {
    if (!confirmClear) return setConfirmClear(true);
    setConfirmClear(false);
    for (const id of Object.keys(marksRef.current)) if ((marksRef.current[id] ?? []).length) commit(id, []);
  };
  const totalMarks = Object.values(marksBy).reduce((n, m) => n + m.length, 0);

  const leftCtl = useRef<((n: number) => void) | null>(null);
  const rightCtl = useRef<((n: number) => void) | null>(null);
  const leftTopAyah = useRef(1);

  useEffect(() => {
    getMushafList()
      .then((list: MushafItem[]) => {
        // Hanya mushaf yang riwayatnya dikenali; versi tajwid tidak dipakai di perbandingan
        const usable = list.filter((m) => riwayahIdOfMushafRawi(m.rawi) && m.id !== TAJWEED_MUSHAF_ID);
        setMushafs(usable);
        const hafsh = usable.find((m) => riwayahIdOfMushafRawi(m.rawi) === "hafsh") ?? usable[0];
        const other = usable.find((m) => riwayahIdOfMushafRawi(m.rawi) !== riwayahIdOfMushafRawi(hafsh?.rawi));
        setLeftId(hafsh?.id ?? null);
        setRightId(other?.id ?? null);
      })
      .catch(() => setLoadError(true));
    getDaftarSurah()
      .then((list: Array<{ nomor: number; namaLatin: string }>) =>
        setSurahNames(Object.fromEntries(list.map((s) => [s.nomor, s.namaLatin])))
      )
      .catch(() => {});
  }, []);

  const left = useMemo(() => mushafs.find((m) => m.id === leftId) ?? null, [mushafs, leftId]);
  const right = useMemo(() => mushafs.find((m) => m.id === rightId) ?? null, [mushafs, rightId]);

  const onLeftTop = useCallback((n: number) => {
    leftTopAyah.current = n;
  }, []);

  /** Bawa panel kanan ke ayat yang sedang di atas panel kiri. */
  const sync = () => {
    try {
      rightCtl.current?.(leftTopAyah.current);
    } catch {}
  };

  const pickSurah = (n: number) => {
    setShowPicker(false);
    leftTopAyah.current = 1;
    if (n !== surah) stopTeachAudio();
    setSurah(n);
  };

  if (loadError) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className={`text-base text-center ${theme.textSecondary}`}>{t("cmpLoadError")}</Text>
      </View>
    );
  }
  if (!left || !right) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={green} />
      </View>
    );
  }

  const btn = `rounded-2xl border items-center justify-center ${theme.border} ${theme.bgCard}`;

  return (
    <View className="flex-1" style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
      {/* Toolbar bersama */}
      <View className="flex-row items-center gap-3 py-4">
        <Pressable
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={t("cmpSurah")}
          className={`flex-row items-center gap-2 px-4 ${btn}`}
          style={{ minHeight: 52 }}
        >
          <Text className={`text-base font-extrabold ${theme.text}`}>
            {surah}. {surahNames[surah] ?? ""}
          </Text>
          <ChevronDown size={18} color={green} />
        </Pressable>

        <View className="flex-1" />

        <Pressable
          onPress={() => setScaleIdx((i) => Math.max(0, i - 1))}
          disabled={scaleIdx === 0}
          accessibilityRole="button"
          accessibilityLabel={t("cmpSmaller")}
          className={`${btn} ${scaleIdx === 0 ? "opacity-40" : ""}`}
          style={{ width: 52, height: 52 }}
        >
          <Minus size={20} color={green} />
        </Pressable>
        <Pressable
          onPress={() => setScaleIdx((i) => Math.min(SCALES.length - 1, i + 1))}
          disabled={scaleIdx === SCALES.length - 1}
          accessibilityRole="button"
          accessibilityLabel={t("cmpLarger")}
          className={`${btn} ${scaleIdx === SCALES.length - 1 ? "opacity-40" : ""}`}
          style={{ width: 52, height: 52 }}
        >
          <Plus size={20} color={green} />
        </Pressable>
        <Pressable
          onPress={() => {
            setMarkMode((v) => !v);
            setPending(null);
          }}
          accessibilityRole="switch"
          accessibilityState={{ checked: markMode }}
          className={`flex-row items-center gap-2 px-4 rounded-2xl border ${markMode ? "bg-amber-400 border-amber-400" : `${theme.border} ${theme.bgCard}`}`}
          style={{ minHeight: 52 }}
        >
          <Highlighter size={18} color={markMode ? "#022c22" : green} />
          <Text className={`text-sm font-extrabold ${markMode ? "text-emerald-950" : theme.text}`}>{t("mkMode")}</Text>
        </Pressable>
        <Pressable
          onPress={sync}
          accessibilityRole="button"
          accessibilityHint={t("cmpSyncHint")}
          className={`flex-row items-center gap-2 px-4 rounded-2xl ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
          style={{ minHeight: 52 }}
        >
          <ArrowLeftRight size={18} color="#fff" />
          <Text className="text-sm font-extrabold text-white">{t("cmpSync")}</Text>
        </Pressable>
      </View>

      {/* Alat tanda per kata */}
      {markMode && (
        <View className={`mb-3 rounded-2xl border px-3 py-2 ${theme.border} ${theme.bgCard}`}>
          <View className="flex-row flex-wrap items-center gap-2">
            {(
              [
                ["underline", "mkUnderline"],
                ["highlight", "mkHighlight"],
                ["strike", "mkStrike"],
                ["box", "mkBox"],
                ["erase", "mkErase"],
              ] as const
            ).map(([k, label]) => {
              const on = tool === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setTool(k)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  className={`flex-row items-center gap-1 rounded-full px-4 justify-center ${on ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-700") : isDarkMode ? "bg-gray-700" : "bg-[#f3ecd9]"}`}
                  style={{ minHeight: 44 }}
                >
                  {k === "erase" && <Eraser size={14} color={on ? "#fff" : green} />}
                  <Text className={`text-sm font-bold ${on ? "text-white" : theme.text}`}>{t(label)}</Text>
                </Pressable>
              );
            })}

            <View className={`mx-1 h-8 w-px ${isDarkMode ? "bg-gray-600" : "bg-gray-300"}`} />

            {(Object.keys(MARK_COLORS) as MarkColor[]).map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                disabled={tool === "erase"}
                accessibilityRole="button"
                accessibilityLabel={t(c === "red" ? "mkRed" : c === "green" ? "mkGreen" : "mkBlue")}
                accessibilityState={{ selected: color === c }}
                className="items-center justify-center"
                style={{ width: 44, height: 44, opacity: tool === "erase" ? 0.35 : 1 }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: MARK_COLORS[c].solid,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: isDarkMode ? "#fff" : "#022c22",
                  }}
                />
              </Pressable>
            ))}

            <View className="flex-1" />

            <Pressable onPress={undo} disabled={!undoStack.length} accessibilityRole="button" accessibilityLabel={t("mkUndo")}
              className={`${btn} ${!undoStack.length ? "opacity-40" : ""}`} style={{ width: 44, height: 44 }}>
              <Undo2 size={18} color={green} />
            </Pressable>
            <Pressable onPress={redo} disabled={!redoStack.length} accessibilityRole="button" accessibilityLabel={t("mkRedo")}
              className={`${btn} ${!redoStack.length ? "opacity-40" : ""}`} style={{ width: 44, height: 44 }}>
              <Redo2 size={18} color={green} />
            </Pressable>
            <Pressable
              onPress={clearAll}
              disabled={!totalMarks}
              accessibilityRole="button"
              className={`flex-row items-center gap-1 rounded-2xl px-3 justify-center ${confirmClear ? "bg-red-600" : `border ${theme.border} ${theme.bgCard}`} ${!totalMarks ? "opacity-40" : ""}`}
              style={{ minHeight: 44 }}
            >
              <Trash2 size={16} color={confirmClear ? "#fff" : "#dc2626"} />
              <Text className={`text-sm font-bold ${confirmClear ? "text-white" : "text-red-600"}`}>
                {confirmClear ? t("mkClearConfirm") : t("mkClear")}
              </Text>
            </Pressable>
          </View>
          <Text className={`text-xs mt-1.5 ${theme.textMuted}`}>{pending ? t("mkRangeHint") : t("mkHint")}</Text>
        </View>
      )}

      {/* Dua panel */}
      <View className="flex-1 flex-row gap-4">
        <RiwayatPanel
          surah={surah}
          mushaf={left}
          options={mushafs}
          blockedRiwayah={riwayahIdOfMushafRawi(right.rawi)}
          scale={SCALES[scaleIdx]}
          lang={lang}
          surahName={surahNames[surah] ?? `Surah ${surah}`}
          onPickMushaf={(id) => {
            if (player.session?.origin === "teach" && player.session.mushafId === leftId) player.stop();
            setLeftId(id);
          }}
          onTopAyah={onLeftTop}
          controlRef={leftCtl}
          marks={marksBy[left.id] ?? NO_MARKS}
          markMode={markMode}
          pending={pending?.mushafId === left.id ? pending : null}
          onWord={onWord}
          onWordLong={onWordLong}
        />
        <RiwayatPanel
          surah={surah}
          mushaf={right}
          options={mushafs}
          blockedRiwayah={riwayahIdOfMushafRawi(left.rawi)}
          scale={SCALES[scaleIdx]}
          lang={lang}
          surahName={surahNames[surah] ?? `Surah ${surah}`}
          onPickMushaf={(id) => {
            if (player.session?.origin === "teach" && player.session.mushafId === rightId) player.stop();
            setRightId(id);
          }}
          controlRef={rightCtl}
          marks={marksBy[right.id] ?? NO_MARKS}
          markMode={markMode}
          pending={pending?.mushafId === right.id ? pending : null}
          onWord={onWord}
          onWordLong={onWordLong}
        />
      </View>

      <SurahPickerSheet visible={showPicker} currentNomor={surah} onClose={() => setShowPicker(false)} onSelect={pickSurah} />
    </View>
  );
}
