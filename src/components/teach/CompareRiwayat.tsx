import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, type ViewToken } from "react-native";
import { ChevronDown, ChevronUp, Minus, Plus, ArrowLeftRight } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { getMushafList, getDetailSurahMerged, getDaftarSurah } from "../../services/quranService";
import { quranTextStyle } from "../../constants/fonts";
import { mushafTitle } from "../../i18n/qiraatI18n";
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
}
interface SurahData {
  info: { nomor: number; namaLatin: string; ayatTidakLengkap?: number[] };
  ayat: AyatItem[];
}

// Pengali ukuran teks Arab untuk dibaca dari jauh
const SCALES = [1, 1.25, 1.5, 1.85];

type Lang = "id" | "en" | "ar";

interface PanelProps {
  surah: number;
  mushaf: MushafItem;
  options: MushafItem[];
  blockedRiwayah: string | null;
  scale: number;
  lang: Lang;
  onPickMushaf: (id: string) => void;
  onTopAyah?: (nomor: number) => void;
  /** Diisi panel: gulir ke ayat bernomor n (atau ayat berikutnya yang ada di riwayat ini). */
  controlRef: React.MutableRefObject<((n: number) => void) | null>;
}

const RiwayatPanel = memo(function RiwayatPanel(p: PanelProps) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const [data, setData] = useState<SurahData | null>(null);
  const [error, setError] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    setData(null);
    setError(false);
    getDetailSurahMerged(p.surah, p.mushaf.id)
      .then((d: SurahData) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [p.surah, p.mushaf.id, retry]);

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

  const missing = data?.info.ayatTidakLengkap ?? [];

  return (
    <View className={`flex-1 rounded-3xl border overflow-hidden ${theme.border} ${theme.bgCard}`}>
      {/* Kepala panel: riwayat yang tampil + pilihan riwayat lain */}
      <Pressable
        onPress={() => setShowOptions((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showOptions }}
        className={`flex-row items-center px-4 py-3 border-b ${theme.border}`}
        style={{ minHeight: 56 }}
      >
        <View className="flex-1">
          <Text className={`text-[11px] font-bold ${theme.textMuted}`}>{t("cmpRiwayah")}</Text>
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
          renderItem={({ item }) => (
            <View className={`mb-3 rounded-2xl border px-4 py-3 ${theme.border}`}>
              <View
                className={`self-start rounded-full px-2.5 py-1 ${isDarkMode ? "bg-emerald-900/50" : "bg-[#f5f0e1]"}`}
              >
                <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{item.nomor}</Text>
              </View>
              <Text className={theme.text} style={arab}>
                {item.teksArab}
              </Text>
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

      {/* Dua panel */}
      <View className="flex-1 flex-row gap-4">
        <RiwayatPanel
          surah={surah}
          mushaf={left}
          options={mushafs}
          blockedRiwayah={riwayahIdOfMushafRawi(right.rawi)}
          scale={SCALES[scaleIdx]}
          lang={lang}
          onPickMushaf={setLeftId}
          onTopAyah={onLeftTop}
          controlRef={leftCtl}
        />
        <RiwayatPanel
          surah={surah}
          mushaf={right}
          options={mushafs}
          blockedRiwayah={riwayahIdOfMushafRawi(left.rawi)}
          scale={SCALES[scaleIdx]}
          lang={lang}
          onPickMushaf={setRightId}
          controlRef={rightCtl}
        />
      </View>

      <SurahPickerSheet visible={showPicker} currentNomor={surah} onClose={() => setShowPicker(false)} onSelect={pickSurah} />
    </View>
  );
}
