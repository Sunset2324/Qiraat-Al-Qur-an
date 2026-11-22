import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BookOpen, Check, Star } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getMushafList } from "../../../src/services/quranService";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import BatikHeader from "../../../src/components/ui/BatikHeader";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import { useLanguage } from "../../../src/context/LanguageContext";
import { mushafTitle } from "../../../src/i18n/qiraatI18n";
import {
  QIRAAT_SABAH,
  POPULAR_RIWAYAH_ID,
  riwayahIdOfMushafRawi,
  type RawiSabah,
} from "../../../src/data/qiraatSabah";

interface MushafItem {
  id: string;
  name: string;
  arabic: string;
  rawi?: string | null;
  description: string;
}

export default function QiraatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang } = useLanguage();
  const isTablet = useIsTablet();
  const { width: winW } = useWindowDimensions();
  const pad = isTablet ? 40 : 24;
  const cols = winW >= 800 ? 2 : 1;
  const accent = isDarkMode ? "#34d399" : "#047857";
  const [mushafList, setMushafList] = useState<MushafItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMushafId, setSelectedMushafId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data: MushafItem[] = await getMushafList();
      setMushafList(data);

      const saved = await AsyncStorage.getItem("selected_mushaf_id");
      if (saved && data.some((m) => m.id === saved)) {
        setSelectedMushafId(saved);
      } else {
        const hafs = data.find((m) => riwayahIdOfMushafRawi(m.rawi) === POPULAR_RIWAYAH_ID);
        setSelectedMushafId(hafs ? hafs.id : data[0]?.id);
      }
    } catch (e: any) {
      console.error("Gagal memuat data Mushaf:", e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kelompokkan mushaf dari backend per riwayah; yang tidak dikenali masuk "Mushaf lainnya"
  const { byRiwayah, others } = useMemo(() => {
    const map = new Map<string, MushafItem[]>();
    const rest: MushafItem[] = [];
    for (const m of mushafList) {
      const rid = riwayahIdOfMushafRawi(m.rawi);
      if (!rid) rest.push(m);
      else map.set(rid, [...(map.get(rid) ?? []), m]);
    }
    return { byRiwayah: map, others: rest };
  }, [mushafList]);

  const handleSelectMushaf = async (id: string) => {
    setSelectedMushafId(id);
    try {
      const selectedName = mushafList.find((m) => m.id === id)?.name || "Mushaf";
      await AsyncStorage.setItem("selected_mushaf_id", id);
      await AsyncStorage.setItem("selected_mushaf_name", selectedName);

      Alert.alert(t("mushafSelected"), t("mushafSelectedBody", { name: selectedName }), [
        {
          text: t("backToMushaf"),
          onPress: () => {
            router.replace({
              pathname: "/(tabs)/mushaf",
              params: { selectedMushafId: id, selectedMushafName: selectedName, refresh: Date.now().toString() },
            });
          },
        },
      ]);
    } catch (e) {
      console.error("Gagal menyimpan preferensi Mushaf", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={["top"]}>
        <ActivityIndicator size="large" color={accent} />
        <Text className={`mt-4 ${theme.textMuted}`}>{t("loadingMushaf")}</Text>
      </SafeAreaView>
    );
  }

  if (mushafList.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={["top"]}>
        <BookOpen size={48} color={theme.mutedColor} />
        <Text className={`mt-4 text-center font-bold ${theme.text}`}>{t("loadFailed")}</Text>
        <Pressable
          onPress={loadData}
          accessibilityRole="button"
          style={{ height: 52 }}
          className="mt-6 px-8 rounded-full bg-emerald-800 items-center justify-center active:opacity-90"
        >
          <Text className="text-white font-bold">{t("retryLoad")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  /** Satu pilihan mushaf (radio). */
  const MushafOption = ({ m }: { m: MushafItem }) => {
    const active = selectedMushafId === m.id;
    return (
      <Pressable
        onPress={() => handleSelectMushaf(m.id)}
        accessibilityRole="radio"
        accessibilityLabel={mushafTitle(m, lang)}
        accessibilityState={{ selected: active, checked: active }}
        className={`flex-row items-center gap-3 rounded-2xl border px-3 active:opacity-90 ${
          active
            ? isDarkMode ? "border-emerald-500 bg-emerald-900/40" : "border-emerald-700 bg-emerald-50"
            : `${theme.border} ${theme.bgCard}`
        }`}
        style={{ minHeight: 48, marginTop: 8 }}
      >
        <View
          className={`h-6 w-6 rounded-full items-center justify-center border-2 ${
            active ? (isDarkMode ? "bg-emerald-500 border-emerald-500" : "bg-emerald-700 border-emerald-700") : theme.border
          }`}
        >
          {active ? <Check size={14} color={isDarkMode ? "#022c22" : "#fff"} /> : null}
        </View>
        <View className="flex-1 py-2">
          <Text numberOfLines={2} className={`text-sm font-semibold ${active ? (isDarkMode ? "text-emerald-300" : "text-emerald-900") : theme.text}`}>
            {mushafTitle(m, lang)}
          </Text>
          {!!m.name && m.name !== mushafTitle(m, lang) && (
            <Text numberOfLines={1} className={theme.textMuted} style={{ fontFamily: ARABIC_FONT, writingDirection: "rtl", fontSize: 14, lineHeight: 26 }}>
              {m.name}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  /** Satu rawi: label, tariq, dan pilihan mushaf-nya (atau keterangan teks belum tersedia). */
  const RawiRow = ({ r, nomor }: { r: RawiSabah; nomor: number }) => {
    const options = byRiwayah.get(r.id) ?? [];
    return (
      <View className={`pt-3 ${nomor === 2 ? `mt-3 border-t ${theme.border}` : ""}`}>
        <Text className={`text-[11px] font-bold ${theme.textMuted}`}>{t("rawiN", { n: nomor })}</Text>
        <Text numberOfLines={2} className={`text-base font-extrabold ${theme.text}`}>{r.label[lang]}</Text>
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={2} className={`flex-1 text-xs ${theme.textMuted}`}>
            {t("tariqVia", { t: lang === "ar" ? r.tariq.ar : r.tariq.latin })}
          </Text>
          {lang !== "ar" && (
            <Text numberOfLines={1} style={{ fontFamily: ARABIC_FONT, fontSize: 17, lineHeight: 30, color: accent }}>
              {r.label.ar}
            </Text>
          )}
        </View>
        {options.length > 0 ? (
          options.map((m) => <MushafOption key={m.id} m={m} />)
        ) : (
          <View className={`mt-2 rounded-2xl px-3 py-2.5 ${isDarkMode ? "bg-gray-800/60" : "bg-[#f3ecd9]"}`}>
            <Text className={`text-xs ${theme.textMuted}`}>{t("textNotYet")}</Text>
          </View>
        )}
      </View>
    );
  };

  const asim = QIRAAT_SABAH.find((i) => i.rawi.some((r) => r.id === POPULAR_RIWAYAH_ID))!;
  const hafsh = asim.rawi.find((r) => r.id === POPULAR_RIWAYAH_ID)!;
  const hafshOptions = byRiwayah.get(POPULAR_RIWAYAH_ID) ?? [];

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <BatikHeader tag={t("qiraatTag")} title={t("qiraatTitle")} arabic="القراءات" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: pad, paddingBottom: 60, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: 1000 }}>
          {/* 1. BARIS KHUSUS: riwayah yang paling banyak digunakan */}
          <View
            className={`rounded-3xl overflow-hidden border-2 p-5 mb-8 ${isDarkMode ? "border-amber-500/70 bg-emerald-950" : "border-amber-400 bg-[#fffaf0]"}`}
          >
            <BatikPattern color={isDarkMode ? "#fbbf24" : "#b45309"} cell={56} opacity={0.08} strokeWidth={1.4} />
            <View className="flex-row items-center gap-2 mb-2">
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400">
                <Star size={12} color="#022c22" fill="#022c22" />
                <Text className="text-[11px] font-extrabold text-emerald-950">{t("qiraatPopularTag")}</Text>
              </View>
            </View>
            <Text className={`text-xl font-extrabold ${theme.text}`}>{hafsh.label[lang]}</Text>
            {lang !== "ar" && (
              <Text style={{ fontFamily: ARABIC_FONT, fontSize: 24, lineHeight: 42, color: accent }}>{hafsh.label.ar}</Text>
            )}
            <Text className={`text-xs ${theme.textMuted}`}>
              {asim.nama[lang]} · {t("tariqVia", { t: lang === "ar" ? hafsh.tariq.ar : hafsh.tariq.latin })}
            </Text>
            <Text className={`text-sm leading-6 mt-2 ${theme.textSecondary}`}>{t("qiraatPopularDesc")}</Text>
            {hafshOptions.map((m) => (
              <MushafOption key={m.id} m={m} />
            ))}
          </View>

          {/* 2. QIRAAT SAB'AH: 7 imam berurutan, 2 rawi masing-masing */}
          <View className="flex-row items-end justify-between mb-1">
            <Text className={`text-lg font-extrabold ${theme.text}`}>{t("qiraatSabahTitle")}</Text>
            <Text style={{ fontFamily: ARABIC_FONT, fontSize: 20, lineHeight: 36, color: accent }}>القراءات السبع</Text>
          </View>
          <Text className={`text-sm leading-6 mb-4 ${theme.textSecondary}`}>{t("qiraatSabahDesc")}</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
            {QIRAAT_SABAH.map((imam) => (
              <View key={imam.id} style={{ width: cols === 2 ? "50%" : "100%", paddingHorizontal: 6 }}>
                <View className={`mb-4 rounded-3xl border p-5 ${theme.border} ${theme.bgCard}`}>
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`items-center justify-center rounded-full ${isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100"}`}
                      style={{ width: 40, height: 40 }}
                    >
                      <Text className={`text-base font-extrabold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>{imam.urutan}</Text>
                    </View>
                    <View className="flex-1">
                      <Text numberOfLines={2} className={`text-base font-extrabold ${theme.text}`}>{imam.nama[lang]}</Text>
                      <Text className={`text-xs ${theme.textMuted}`}>
                        {imam.kota[lang]} · {t("diedYear", { y: imam.wafat })}
                      </Text>
                    </View>
                    {lang !== "ar" && (
                      <Text numberOfLines={1} style={{ fontFamily: ARABIC_FONT, fontSize: 20, lineHeight: 36, color: accent, maxWidth: "38%" }}>
                        {imam.nama.ar}
                      </Text>
                    )}
                  </View>
                  <RawiRow r={imam.rawi[0]} nomor={1} />
                  <RawiRow r={imam.rawi[1]} nomor={2} />
                </View>
              </View>
            ))}
          </View>

          {/* 3. Mushaf dari server yang riwayahnya tidak dikenali (tetap bisa dipilih) */}
          {others.length > 0 && (
            <View className="mt-2">
              <Text className={`text-base font-extrabold ${theme.text}`}>{t("otherMushaf")}</Text>
              {others.map((m) => (
                <MushafOption key={m.id} m={m} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
