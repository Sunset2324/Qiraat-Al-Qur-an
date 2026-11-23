import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Info, RefreshCw } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import { quranTextStyle } from "../../../src/constants/fonts";
import BatikHeader from "../../../src/components/ui/BatikHeader";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import {
  getQiraatVariant,
  QiraatVariantError,
  type QiraatVariantJuncture,
  type QiraatVariantReading,
} from "../../../src/services/quranService";
import { QIRAAT_ASYRAH } from "../../../src/data/qiraatSabah";

/**
 * Perbedaan bacaan per kata (farsy) antar 10 imam qiraat untuk satu ayat / satu surah.
 * Sumber data: Quran Foundation (atribusi wajib tampil; cache klien < 7 hari, lihat getQiraatVariant).
 */

type Lang = "id" | "en" | "ar";

// Label imam & rawi dari data aplikasi (7 sab'ah + 3 tambahan 'asyrah)
const IMAM_BY_ID = new Map(QIRAAT_ASYRAH.map((i) => [i.id, i]));
const RAWI_BY_ID = new Map(QIRAAT_ASYRAH.flatMap((i) => i.rawi.map((r) => [r.id, { rawi: r, imam: i }] as const)));

const CAT_KEY: Record<string, string> = { A: "qvCatA", B: "qvCatB", C: "qvCatC" };

export default function QiraatVariantScreen() {
  const params = useLocalSearchParams<{ surah: string; ayah?: string; riwayah?: string }>();
  const surah = parseInt(String(params.surah ?? ""), 10);
  const ayahParam = parseInt(String(params.ayah ?? ""), 10);
  const hasAyah = Number.isFinite(ayahParam) && ayahParam > 0;
  const myRiwayah = String(params.riwayah ?? "");

  const { isDarkMode, theme } = useTheme();
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const isTablet = useIsTablet();
  const { width: winW } = useWindowDimensions();
  const pad = isTablet ? 40 : 24;
  const accent = isDarkMode ? "#34d399" : "#047857";

  const [scope, setScope] = useState<"ayah" | "surah">(hasAyah ? "ayah" : "surah");
  // Hasil disimpan PER cakupan (ayat / surah):
  //  - pindah tab tidak memuat ulang & tidak menampilkan spinner bila datanya sudah ada;
  //  - respons yang datang terlambat (mis. "Seluruh surah" yang lebih lambat) tidak menimpa tab lain.
  type Slot = { junctures: QiraatVariantJuncture[]; error: string | null };
  const [slots, setSlots] = useState<Partial<Record<"ayah" | "surah", Slot>>>({});
  const [pending, setPending] = useState<Partial<Record<"ayah" | "surah", boolean>>>({});

  const load = useCallback(
    async (target: "ayah" | "surah") => {
      if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
        setSlots((s) => ({ ...s, [target]: { junctures: [], error: "QF_ERROR" } }));
        return;
      }
      setPending((p) => ({ ...p, [target]: true }));
      try {
        const res = await getQiraatVariant(surah, target === "ayah" ? ayahParam : null);
        setSlots((s) => ({ ...s, [target]: { junctures: res.junctures, error: null } }));
      } catch (e: any) {
        const code = e instanceof QiraatVariantError ? e.code : "network";
        setSlots((s) => ({ ...s, [target]: { junctures: [], error: code } }));
      } finally {
        setPending((p) => ({ ...p, [target]: false }));
      }
    },
    [surah, ayahParam]
  );

  // Muat hanya bila cakupan ini belum pernah dimuat
  useEffect(() => {
    if (!slots[scope] && !pending[scope]) load(scope);
  }, [scope, slots, pending, load]);

  const slot = slots[scope];
  const junctures = slot?.junctures ?? [];
  const errorCode = slot?.error ?? null;
  const loading = !slot;

  // Kelompokkan per ayat, urut naik
  const groups = useMemo(() => {
    const map = new Map<number, QiraatVariantJuncture[]>();
    for (const j of junctures) map.set(j.ayah, [...(map.get(j.ayah) ?? []), j]);
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [junctures]);

  /** Chip "dibaca oleh": imam penuh (kedua rawi) lalu rawi yang disebut khusus. */
  const readerChips = (rd: QiraatVariantReading) => {
    const chips: Array<{ key: string; label: string; mine: boolean }> = [];
    for (const id of rd.imams) {
      const im = IMAM_BY_ID.get(id);
      if (!im) continue;
      chips.push({ key: `i-${id}`, label: im.nama[lang], mine: im.rawi.some((r) => r.id === myRiwayah) });
    }
    for (const id of rd.riwayatKhusus) {
      const hit = RAWI_BY_ID.get(id);
      if (!hit) continue;
      chips.push({ key: `r-${id}`, label: hit.rawi.label[lang], mine: id === myRiwayah });
    }
    return chips;
  };

  const renderScopeToggle = () =>
    hasAyah ? (
      <View className={`flex-row rounded-full p-1 mb-5 ${isDarkMode ? "bg-gray-800" : "bg-[#efe7d2]"}`}>
        {(["ayah", "surah"] as const).map((s) => {
          const on = scope === s;
          return (
            <Pressable
              key={s}
              onPress={() => setScope(s)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={`flex-1 items-center justify-center rounded-full ${on ? (isDarkMode ? "bg-emerald-600" : "bg-emerald-700") : ""}`}
              style={{ minHeight: 40 }}
            >
              <Text className={`text-sm font-bold ${on ? "text-white" : theme.textSecondary}`}>
                {s === "ayah" ? `${t("qvThisAyah")} (${ayahParam})` : t("qvWholeSurah")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    ) : null;

  const renderReading = (rd: QiraatVariantReading, idx: number) => {
    const chips = readerChips(rd);
    const mine = !!myRiwayah && (rd.riwayat.includes(myRiwayah) || chips.some((c) => c.mine));
    return (
      <View
        key={idx}
        className={`rounded-2xl border px-4 py-3 ${idx > 0 ? "mt-3" : ""} ${
          mine
            ? isDarkMode ? "border-emerald-500 bg-emerald-900/30" : "border-emerald-600 bg-emerald-50"
            : `${theme.border} ${isDarkMode ? "bg-gray-900/40" : "bg-white"}`
        }`}
      >
        {mine && (
          <View className="self-start rounded-full px-2.5 py-0.5 mb-1 bg-emerald-600">
            <Text className="text-[11px] font-extrabold text-white">{t("qvYourRiwayah")}</Text>
          </View>
        )}
        <Text className={theme.text} style={quranTextStyle(winW < 360)}>
          {rd.text}
        </Text>
        {lang === "en" && !!rd.translation && (
          <Text className={`text-xs italic mb-2 ${theme.textMuted}`}>{rd.translation}</Text>
        )}
        <Text className={`text-[11px] font-bold mb-1.5 ${theme.textMuted}`}>{t("qvReadBy")}</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {chips.map((c) => (
            <View
              key={c.key}
              className={`rounded-full px-2.5 py-1 ${
                c.mine ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-[#f3ecd9]"
              }`}
            >
              <Text className={`text-xs font-semibold ${c.mine ? "text-white" : theme.text}`}>{c.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderJuncture = (j: QiraatVariantJuncture, key: string) => {
    const catKey = j.category ? CAT_KEY[j.category] : undefined;
    return (
      <View key={key} className={`mb-4 rounded-3xl border p-4 ${theme.border} ${theme.bgCard}`}>
        <View className="flex-row items-center justify-between gap-2">
          {catKey ? (
            <View className={`rounded-full px-2.5 py-1 ${isDarkMode ? "bg-amber-900/40" : "bg-amber-100"}`}>
              <Text className={`text-[11px] font-bold ${isDarkMode ? "text-amber-300" : "text-amber-800"}`}>{t(catKey)}</Text>
            </View>
          ) : (
            <View />
          )}
        </View>
        <Text style={{ ...quranTextStyle(winW < 360), color: accent }}>{j.text}</Text>
        {j.readings.map((rd, i) => (
          renderReading(rd, i)
        ))}
      </View>
    );
  };

  const errorText = errorCode && ["QF_NOT_CONFIGURED", "QF_SCOPE", "QF_CLIENT"].includes(errorCode) ? t("qvErrorConfig") : t("qvErrorLoad");

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <BatikHeader
        tag={scope === "ayah" && hasAyah ? `QS ${surah}:${ayahParam}` : `QS ${surah}`}
        title={t("qvButton")}
        arabic="القراءات"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: 820 }}>
          {renderScopeToggle()}

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color={accent} />
            </View>
          ) : errorCode ? (
            <View className={`rounded-3xl border p-5 items-center ${theme.border} ${theme.bgCard}`}>
              <Text className={`text-sm text-center leading-6 ${theme.textSecondary}`}>{errorText}</Text>
              {errorCode !== "QF_NOT_CONFIGURED" && (
                <Pressable
                  onPress={() => load(scope)}
                  accessibilityRole="button"
                  className={`mt-4 flex-row items-center gap-2 rounded-full px-4 ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"} active:opacity-80`}
                  style={{ minHeight: 44 }}
                >
                  <RefreshCw size={16} color="#fff" />
                  <Text className="text-sm font-bold text-white">{t("retry")}</Text>
                </Pressable>
              )}
            </View>
          ) : groups.length === 0 ? (
            <View className={`rounded-3xl border p-5 ${theme.border} ${theme.bgCard}`}>
              <Text className={`text-sm text-center leading-6 ${theme.textSecondary}`}>
                {scope === "ayah" ? t("qvEmptyAyah") : t("qvEmptySurah")}
              </Text>
            </View>
          ) : (
            groups.map(([ayah, list]) => (
              <View key={ayah}>
                {scope === "surah" && (
                  <Text className={`text-xs font-extrabold tracking-[1px] mb-2 ${theme.textMuted}`}>
                    {t("qvAyahN", { n: ayah })}
                  </Text>
                )}
                {list.map((j, i) => (
                  renderJuncture(j, `${j.verseKey}-${i}`)
                ))}
              </View>
            ))
          )}

          {/* Atribusi wajib + batas cakupan data */}
          <View className={`mt-4 rounded-3xl overflow-hidden p-4 ${isDarkMode ? "bg-emerald-950" : "bg-[#fffaf0]"}`}>
            <BatikPattern color={isDarkMode ? "#34d399" : "#047857"} cell={48} opacity={0.06} strokeWidth={1.2} />
            <View className="flex-row items-start gap-2">
              <Info size={16} color={accent} style={{ marginTop: 2 }} />
              <View className="flex-1">
                <Text className={`text-sm font-extrabold ${theme.text}`}>{t("qvCredit")}</Text>
                <Text className={`text-xs leading-5 mt-1 ${theme.textSecondary}`}>{t("qvUsulNote")}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
