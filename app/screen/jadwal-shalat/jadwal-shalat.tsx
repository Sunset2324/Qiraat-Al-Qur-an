import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useIsFocused } from "expo-router";
import { ArrowLeft, MapPin, Clock, Calendar, BookOpen } from "lucide-react-native";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { getJadwalShalat } from "../../../src/services/quranService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../../../src/context/LanguageContext";
import { formatGregorian, formatHijri } from "../../../src/utils/dateFormat";
import QiblaCompass from "../../../src/components/QiblaCompass";
import { useQibla } from "../../../src/hooks/useQibla";
import BatikPattern from "../../../src/components/ui/BatikPattern";
import { useIsTablet } from "../../../src/hooks/useIsTablet";
import { ARABIC_FONT } from "../../../src/constants/fonts";
import LokasiShalatPicker, { LokasiShalat } from "../../../src/components/LokasiShalatPicker";

const LOKASI_KEY = "user_shalat_location";

const WAKTU = [
  { key: "subuh", nama: "p_subuh", ar: "الفجر" },
  { key: "terbit", nama: "p_terbit", ar: "الشروق" },
  { key: "dzuhur", nama: "p_dzuhur", ar: "الظهر" },
  { key: "ashar", nama: "p_ashar", ar: "العصر" },
  { key: "maghrib", nama: "p_maghrib", ar: "المغرب" },
  { key: "isya", nama: "p_isya", ar: "العشاء" },
] as const;

// Backend bisa mengembalikan { jadwal: [...] } (EQuran) atau array langsung (fallback Aladhan)
const ambilListJadwal = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.jadwal)) return data.jadwal;
  return [];
};

// tanggal bisa: number (5), "2026-10-05", "05-10-2026"
const ambilHari = (item: any): number => {
  if (typeof item?.tanggal === "number") return item.tanggal;
  const str = String(item?.tanggal_lengkap ?? item?.tanggal ?? item?.date ?? "");
  const parts = str.split("-");
  if (parts.length === 3) return parseInt(parts[0].length === 4 ? parts[2] : parts[0], 10);
  const n = parseInt(str, 10);
  return Number.isNaN(n) ? -1 : n;
};

const toMenit = (hhmm?: string): number | null => {
  if (!hhmm) return null;
  const m = /(\d{1,2}):(\d{2})/.exec(hhmm);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function JadwalShalatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { t, locale, flip } = useLanguage();
  const isTablet = useIsTablet();
  const gut = isTablet ? 40 : 24;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jadwalHariIni, setJadwalHariIni] = useState<any>(null);
  // null = belum pernah memilih lokasi (nama kab/kota harus persis dari daftar EQuran.id, jadi tidak ada default tebakan)
  const [lokasi, setLokasi] = useState<LokasiShalat | null>(null);
  const [lokasiSiap, setLokasiSiap] = useState(false);
  const [pickerBuka, setPickerBuka] = useState(false);
  const [now, setNow] = useState(new Date());
  const [retryKey, setRetryKey] = useState(0);
  const fokus = useIsFocused(); // sensor kompas mati saat layar kiblat/lain di atas
  const qibla = useQibla(fokus);

  // 1) Baca lokasi tersimpan sekali saat layar dibuka
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOKASI_KEY);
        const p = saved ? JSON.parse(saved) : null;
        const provinsi = p?.provinsi;
        const kota = p?.kota || p?.kabkota;
        if (provinsi && kota) setLokasi({ provinsi, kota });
        else setPickerBuka(true); // pertama kali: langsung minta pilih lokasi
      } catch {
        setPickerBuka(true);
      }
      setLokasiSiap(true);
    })();
  }, []);

  // 2) Ambil jadwal setiap lokasi berubah (atau user menekan "Coba lagi")
  useEffect(() => {
    if (!lokasiSiap) return;
    if (!lokasi) {
      setLoading(false);
      return;
    }
    let batal = false;
    const fetchJadwal = async () => {
      try {
        setLoading(true);
        setError(null);
        const tgl = new Date();
        const data = await getJadwalShalat(lokasi.provinsi, lokasi.kota, tgl.getMonth() + 1, tgl.getFullYear());
        const list = ambilListJadwal(data);
        const hariIni = list.find((it) => ambilHari(it) === tgl.getDate());
        if (batal) return;
        if (!hariIni) throw new Error("not_today");
        setJadwalHariIni(hariIni);
      } catch (err: any) {
        if (batal) return;
        console.error("Gagal memuat jadwal:", err);
        setError(err?.message === "not_today" ? t("scheduleNotToday") : t("scheduleLoadFailed"));
        setJadwalHariIni(null);
      } finally {
        if (!batal) setLoading(false);
      }
    };
    fetchJadwal();
    return () => {
      batal = true;
    };
  }, [lokasiSiap, lokasi?.provinsi, lokasi?.kota, retryKey]);

  const pilihLokasi = async (baru: LokasiShalat) => {
    setPickerBuka(false);
    setLokasi(baru);
    try {
      await AsyncStorage.setItem(LOKASI_KEY, JSON.stringify(baru));
    } catch {}
  };

  // Ticker 1 detik untuk countdown
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cari shalat berikutnya (terbit bukan waktu shalat, dilewati)
  const { nextKey, countdown } = useMemo(() => {
    if (!jadwalHariIni) return { nextKey: null as string | null, countdown: "--:--:--" };
    const detikSekarang = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const kandidat = WAKTU.filter((w) => w.key !== "terbit");
    let target: { key: string; detik: number } | null = null;
    for (const w of kandidat) {
      const m = toMenit(jadwalHariIni[w.key]);
      if (m === null) continue;
      if (m * 60 > detikSekarang) {
        target = { key: w.key, detik: m * 60 };
        break;
      }
    }
    let selisih: number;
    if (target) {
      selisih = target.detik - detikSekarang;
    } else {
      // Sudah lewat Isya -> menuju Subuh besok (pakai jam Subuh hari ini sebagai pendekatan)
      const m = toMenit(jadwalHariIni.subuh);
      if (m === null) return { nextKey: null, countdown: "--:--:--" };
      selisih = 24 * 3600 - detikSekarang + m * 60;
      target = { key: "subuh", detik: m * 60 };
    }
    const h = Math.floor(selisih / 3600);
    const mnt = Math.floor((selisih % 3600) / 60);
    const d = selisih % 60;
    return { nextKey: target.key, countdown: `${pad(h)}:${pad(mnt)}:${pad(d)}` };
  }, [jadwalHariIni, now]);

  // Satu baris waktu shalat (nama Latin + kaligrafi Arab + jam)
  const renderWaktuShalat = (nama: string, ar: string, waktu: string, isNext?: boolean) => (
    <View
      key={nama}
      className={`flex-row items-center justify-between px-5 rounded-2xl mb-3 border overflow-hidden ${
        isNext ? "bg-emerald-700 border-emerald-600" : `${theme.bgCard} ${theme.border}`
      }`}
      style={{ minHeight: isTablet ? 76 : 68 }}
    >
      {isNext && <BatikPattern cell={36} opacity={0.14} />}
      <View className="flex-row items-center gap-3 flex-1">
        <Clock size={22} color={isNext ? "#fde68a" : theme.iconColor} />
        <Text className={`text-lg font-extrabold ${isNext ? "text-white" : theme.text}`}>{nama}</Text>
        <Text style={{ fontFamily: ARABIC_FONT, fontSize: 22, lineHeight: 38, color: isNext ? "#fde68a" : isDarkMode ? "#6ee7b7" : "#047857" }}>
          {ar}
        </Text>
      </View>
      <Text className={`text-2xl font-extrabold ${isNext ? "text-white" : (isDarkMode ? "text-emerald-400" : "text-emerald-700")}`}>
        {waktu || "--:--"}
      </Text>
    </View>
  );

  const nextInfo = WAKTU.find((w) => w.key === nextKey);

  // Kartu utama: lokasi, hitung mundur, kompas kiblat
  const heroCard = (
    <View className="rounded-3xl overflow-hidden bg-emerald-800 p-6">
      <BatikPattern cell={42} opacity={0.14} />
      <Pressable
        onPress={() => setPickerBuka(true)}
        accessibilityRole="button"
        accessibilityLabel={t("chooseLocation")}
        className="flex-row items-center justify-between mb-4 active:opacity-70"
        style={{ minHeight: 44 }}
      >
        <View className="flex-row items-center gap-2 flex-1">
          <MapPin size={20} color="#d1fae5" />
          <Text className="text-base font-semibold text-emerald-100 flex-shrink" numberOfLines={1}>
            {lokasi ? `${lokasi.kota}, ${lokasi.provinsi}` : t("chooseLocation")}
          </Text>
        </View>
        <View className="px-4 rounded-full bg-white/20 justify-center" style={{ height: 36 }}>
          <Text className="text-xs font-bold text-white">{t("change")}</Text>
        </View>
      </Pressable>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs uppercase tracking-wider mb-1 text-emerald-100">
            {t("untilNext")}{nextInfo ? ` · ${t(nextInfo.nama)}` : ""}
          </Text>
          <Text className="font-extrabold text-white" style={{ fontSize: isTablet ? 52 : 40 }} numberOfLines={1} adjustsFontSizeToFit>
            {loading ? "--:--:--" : countdown}
          </Text>
          {!!nextInfo && (
            <Text style={{ fontFamily: ARABIC_FONT, fontSize: 28, lineHeight: 46, color: "#fde68a" }}>{nextInfo.ar}</Text>
          )}
        </View>

        {/* Kompas kiblat realtime (Aladhan) — ketuk untuk mode detail */}
        <Pressable
          onPress={() => router.push("/screen/kiblat/kiblat")}
          accessibilityRole="button"
          accessibilityLabel={t("qiblaTitle")}
          className="items-center active:opacity-80"
        >
          <QiblaCompass size={isTablet ? 120 : 96} bearing={qibla.bearing} heading={qibla.heading} compact />
          <Text className="text-[11px] font-semibold mt-2 text-emerald-100">
            {t("qiblaTitle")}{qibla.bearing !== null ? ` · ${Math.round(qibla.bearing)}°` : ""}
          </Text>
          <Text className="text-[10px] text-emerald-100/80">{t("qiblaCardHint")}</Text>
        </Pressable>
      </View>
    </View>
  );

  const bakdaCard = (
    <Pressable
      onPress={() => router.push({ pathname: "/screen/dzikir-doa/dzikir-doa", params: { tab: "bakda" } })}
      accessibilityRole="button"
      className={`flex-row items-center justify-between p-4 rounded-3xl border ${theme.border} ${theme.bgCard} active:opacity-80`}
      style={{ minHeight: 76 }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className={`h-12 w-12 rounded-full items-center justify-center ${isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100"}`}>
          <BookOpen size={22} color={isDarkMode ? "#34d399" : "#047857"} />
        </View>
        <View className="flex-1">
          <Text className={`text-base font-bold ${theme.text}`}>{t("bakdaCardTitle")}</Text>
          <Text className={`text-xs ${theme.textMuted}`}>{t("bakdaCardSub")}</Text>
        </View>
      </View>
      <Text className={`text-xl ${theme.textMuted}`} style={flip}>›</Text>
    </Pressable>
  );

  const daftarWaktu = (
    <View>
      <View className="flex-row items-center justify-between mb-4 flex-wrap gap-1">
        <Text className={`text-lg font-extrabold ${theme.text}`}>{t("todayHeading")}</Text>
        <View className="flex-row items-center gap-1">
          <Calendar size={16} color={theme.iconColor} />
          <Text className={`text-sm ${theme.textMuted}`}>
            {formatGregorian(now, locale)}
            {formatHijri(now, locale) ? ` • ${formatHijri(now, locale)}` : ""}
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color={theme.iconColor} />
        </View>
      ) : jadwalHariIni ? (
        <View>
          {WAKTU.map((w) => renderWaktuShalat(t(w.nama), w.ar, jadwalHariIni[w.key], w.key === nextKey))}
        </View>
      ) : (
        <View className="items-center py-10">
          <Text className={`text-center mb-4 ${theme.textMuted}`}>
            {lokasi ? error || t("scheduleLoadFailed") : t("pickCityHint")}
          </Text>
          <Pressable
            onPress={() => (lokasi ? setRetryKey((k) => k + 1) : setPickerBuka(true))}
            className="px-6 rounded-full bg-emerald-700 active:opacity-80 justify-center"
            style={{ height: 48 }}
          >
            <Text className="text-white font-semibold">{lokasi ? t("retry") : t("chooseLocation")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header: batik + kaligrafi */}
      <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: gut, paddingVertical: 18 }}>
        <BatikPattern cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            className="items-center justify-center rounded-full"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <ArrowLeft size={22} color="#fff" style={flip} />
          </Pressable>
          <Text className="text-xl font-extrabold flex-1 ml-4 text-white">{t("prayerTitle")}</Text>
          <Text style={{ fontFamily: ARABIC_FONT, fontSize: 30, lineHeight: 50, color: "#fde68a" }}>مواقيت الصلاة</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {isTablet ? (
          <View className="flex-row items-start" style={{ paddingHorizontal: gut, paddingTop: 24, gap: 24 }}>
            <View style={{ flex: 1, gap: 16 }}>
              {heroCard}
              {bakdaCard}
            </View>
            <View style={{ flex: 1 }}>{daftarWaktu}</View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: gut, paddingTop: 24, gap: 20 }}>
            {heroCard}
            {daftarWaktu}
            {bakdaCard}
          </View>
        )}
      </ScrollView>

      <LokasiShalatPicker
        visible={pickerBuka}
        current={lokasi ?? { provinsi: "", kota: "" }}
        onClose={() => setPickerBuka(false)}
        onSelect={pilihLokasi}
      />
    </SafeAreaView>
  );
}