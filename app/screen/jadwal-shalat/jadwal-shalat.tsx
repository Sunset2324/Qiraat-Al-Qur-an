import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, MapPin, Clock, Calendar, BookOpen } from "lucide-react-native";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { getJadwalShalat } from "../../../src/services/quranService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WAKTU = [
  { key: "subuh", nama: "Subuh" },
  { key: "terbit", nama: "Terbit" },
  { key: "dzuhur", nama: "Dzuhur" },
  { key: "ashar", nama: "Ashar" },
  { key: "maghrib", nama: "Maghrib" },
  { key: "isya", nama: "Isya" },
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jadwalHariIni, setJadwalHariIni] = useState<any>(null);
  const [lokasi, setLokasi] = useState({ provinsi: "DKI Jakarta", kota: "Jakarta Selatan" });
  const [now, setNow] = useState(new Date());
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let batal = false;
    const fetchJadwal = async () => {
      try {
        setLoading(true);
        setError(null);

        let prov = "DKI Jakarta";
        let kota = "Jakarta Selatan";
        try {
          const saved = await AsyncStorage.getItem("user_shalat_location");
          if (saved) {
            const p = JSON.parse(saved);
            prov = p.provinsi || prov;
            kota = p.kota || p.kabkota || kota;
          }
        } catch {}
        if (batal) return;
        setLokasi({ provinsi: prov, kota });

        const t = new Date();
        const data = await getJadwalShalat(prov, kota, t.getMonth() + 1, t.getFullYear());
        const list = ambilListJadwal(data);
        const hariIni = list.find((it) => ambilHari(it) === t.getDate());
        if (batal) return;
        if (!hariIni) throw new Error("Jadwal untuk hari ini tidak ditemukan.");
        setJadwalHariIni(hariIni);
      } catch (err: any) {
        if (batal) return;
        console.error("Gagal memuat jadwal:", err);
        const msg = err?.response?.data?.message || err?.message || "Gagal memuat data jadwal.";
        setError(msg);
        setJadwalHariIni(null);
      } finally {
        if (!batal) setLoading(false);
      }
    };
    fetchJadwal();
    return () => {
      batal = true;
    };
  }, [retryKey]);

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
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <Text className={`text-xl font-bold flex-1 ${theme.text}`}>Jadwal Shalat</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. KARTU LOKASI & COUNTDOWN */}
        <View className="px-6 pt-6">
          <View className={`${isDarkMode ? "bg-emerald-900/40" : "bg-emerald-50"} p-5 rounded-2xl border ${theme.border}`}>
            <View className="flex-row items-center gap-2 mb-4">
              <MapPin size={18} color={isDarkMode ? "#34d399" : "#047857"} />
              <Text className={`text-sm font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                {lokasi.kota}, {lokasi.provinsi}
              </Text>
            </View>
            
            <Text className={`text-xs uppercase tracking-wider mb-1 ${theme.textMuted}`}>
              Menuju Shalat Berikutnya
            </Text>
            <Text className={`text-4xl font-bold ${theme.text}`}>
              {loading ? "--:--:--" : countdown}
            </Text>
          </View>
        </View>

        {/* 2. DAFTAR WAKTU SHALAT HARI INI */}
        <View className="px-6 mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${theme.text}`}>Hari Ini</Text>
            <View className="flex-row items-center gap-1">
              <Calendar size={16} color={theme.iconColor} />
              <Text className={`text-sm ${theme.textMuted}`}>
                {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={theme.iconColor} />
            </View>
          ) : jadwalHariIni ? (
            <View>
              {WAKTU.map((w) => renderWaktuShalat(w.nama, jadwalHariIni[w.key], w.key === nextKey))}
            </View>
          ) : (
            <View className="items-center py-10">
              <Text className={`text-center mb-4 ${theme.textMuted}`}>{error || "Gagal memuat data jadwal."}</Text>
              <Pressable onPress={() => setRetryKey((k) => k + 1)} className="px-5 py-2 rounded-full bg-emerald-600 active:opacity-80">
                <Text className="text-white font-semibold">Coba lagi</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 3. KARTU DZIKIR BA'DA SHALAT (Nilai Tambah) */}
        <View className="px-6 mt-4">
          <Pressable 
            onPress={() => router.push("/screen/dzikir-doa/dzikir-doa")} // Sesuaikan route jika perlu
            className={`flex-row items-center justify-between p-4 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-80`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`p-2 rounded-full ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"}`}>
                <BookOpen size={20} color={isDarkMode ? "#60a5fa" : "#2563eb"} />
              </View>
              <View>
                <Text className={`text-base font-bold ${theme.text}`}>Dzikir Ba'da Shalat</Text>
                <Text className={`text-xs ${theme.textMuted}`}>Tasbih, Tahmid, dan Takbir</Text>
              </View>
            </View>
            <Text className={`text-xl ${theme.textMuted}`}>›</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}