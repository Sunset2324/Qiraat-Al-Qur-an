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
import LokasiShalatPicker, { LokasiShalat } from "../../../src/components/LokasiShalatPicker";

const LOKASI_KEY = "user_shalat_location";

const WAKTU = [
  { key: "subuh", nama: "p_subuh" },
  { key: "terbit", nama: "p_terbit" },
  { key: "dzuhur", nama: "p_dzuhur" },
  { key: "ashar", nama: "p_ashar" },
  { key: "maghrib", nama: "p_maghrib" },
  { key: "isya", nama: "p_isya" },
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

  // Helper untuk menampilkan baris waktu shalat
  const renderWaktuShalat = (nama: string, waktu: string, isNext?: boolean) => (
    <View 
      key={nama} 
      className={`flex-row items-center justify-between p-4 rounded-xl mb-3 border ${
        isNext 
          ? "bg-emerald-600 border-emerald-500" 
          : `${theme.bgCard} ${theme.border}`
      }`}
    >
      <View className="flex-row items-center gap-3">
        <Clock size={20} color={isNext ? "#fff" : theme.iconColor} />
        <Text className={`text-base font-semibold ${isNext ? "text-white" : theme.text}`}>
          {nama}
        </Text>
      </View>
      <Text className={`text-lg font-bold ${isNext ? "text-white" : (isDarkMode ? "text-emerald-400" : "text-emerald-700")}`}>
        {waktu || "--:--"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* Header */}
      <View className={`flex-row items-center px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={24} color={theme.iconColor} style={flip} />
        </Pressable>
        <Text className={`text-xl font-bold flex-1 ${theme.text}`}>{t("prayerTitle")}</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. KARTU LOKASI & COUNTDOWN */}
        <View className="px-6 pt-6">
          <View className={`${isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50"} p-5 rounded-2xl border ${theme.border}`}>
            <Pressable
              onPress={() => setPickerBuka(true)}
              className="flex-row items-center justify-between mb-4 active:opacity-70"
            >
              <View className="flex-row items-center gap-2 flex-1">
                <MapPin size={18} color={isDarkMode ? "#34d399" : "#047857"} />
                <Text
                  className={`text-sm font-medium flex-shrink ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}
                  numberOfLines={1}
                >
                  {lokasi ? `${lokasi.kota}, ${lokasi.provinsi}` : t("chooseLocation")}
                </Text>
              </View>
              <Text className={`text-xs font-bold ml-3 ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                {t("change")}
              </Text>
            </Pressable>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className={`text-xs uppercase tracking-wider mb-1 ${theme.textMuted}`}>
                  {t("untilNext")}
                </Text>
                <Text className={`text-3xl font-bold ${theme.text}`} numberOfLines={1} adjustsFontSizeToFit>
                  {loading ? "--:--:--" : countdown}
                </Text>
              </View>

              {/* Kompas kiblat realtime (Aladhan) — ketuk untuk mode detail */}
              <Pressable
                onPress={() => router.push("/screen/kiblat/kiblat")}
                accessibilityRole="button"
                accessibilityLabel={t("qiblaTitle")}
                className="items-center active:opacity-80"
              >
                <QiblaCompass size={96} bearing={qibla.bearing} heading={qibla.heading} compact />
                <Text className={`text-[11px] font-semibold mt-2 ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                  {t("qiblaTitle")}{qibla.bearing !== null ? ` · ${Math.round(qibla.bearing)}°` : ""}
                </Text>
                <Text className={`text-[10px] ${theme.textMuted}`}>{t("qiblaCardHint")}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* 2. DAFTAR WAKTU SHALAT HARI INI */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${theme.text}`}>{t("todayHeading")}</Text>
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
              {WAKTU.map((w) => renderWaktuShalat(t(w.nama), jadwalHariIni[w.key], w.key === nextKey))}
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className={`text-center mb-4 ${theme.textMuted}`}>
                {lokasi ? error || t("scheduleLoadFailed") : t("pickCityHint")}
              </Text>
              <Pressable onPress={() => (lokasi ? setRetryKey((k) => k + 1) : setPickerBuka(true))} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
                <Text className="text-white font-semibold">{lokasi ? t("retry") : t("chooseLocation")}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 3. KARTU DZIKIR BA'DA SHALAT (Nilai Tambah) */}
        <View className="px-6 mt-4">
          <Pressable 
            onPress={() => router.push({ pathname: "/screen/dzikir-doa/dzikir-doa", params: { tab: "bakda" } })}
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-80`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`p-2 rounded-full ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>
                <BookOpen size={20} color={isDarkMode ? "#60a5fa" : "#2563eb"} />
              </View>
              <View>
                <Text className={`text-base font-bold ${theme.text}`}>{t("bakdaCardTitle")}</Text>
                <Text className={`text-xs ${theme.textMuted}`}>{t("bakdaCardSub")}</Text>
              </View>
            </View>
            <Text className={`text-xl ${theme.textMuted}`} style={flip}>›</Text>
          </Pressable>
        </View>

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