import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, MapPin, Clock, Calendar, BookOpen } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../../../src/context/ThemeContext";
import { getJadwalShalat } from "../../../src/services/quranService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function JadwalShalatScreen() {
  const { isDarkMode, theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [jadwalHariIni, setJadwalHariIni] = useState<any>(null);
  const [lokasi, setLokasi] = useState({ provinsi: "DKI Jakarta", kota: "Jakarta Selatan" });

  // Hitung mundur sederhana (bisa dikembangkan lebih lanjut)
  const [countdown, setCountdown] = useState("--:--:--");

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        setLoading(true);
        // Cek apakah ada lokasi tersimpan
        const savedLokasi = await AsyncStorage.getItem("user_shalat_location");
        let targetProv = lokasi.provinsi;
        let targetKota = lokasi.kota;

        if (savedLokasi) {
          const parsed = JSON.parse(savedLokasi);
          targetProv = parsed.provinsi;
          targetKota = parsed.kota;
          setLokasi(parsed);
        }

        const now = new Date();
        const data = await getJadwalShalat(targetProv, targetKota, now.getMonth() + 1, now.getFullYear());
        
        const today = now.getDate();
        const todaySchedule = data.find((item: any) => {
          const tanggalStr = item.tanggal || item.date;
          if (!tanggalStr) return false;
          const parts = tanggalStr.split('-');
          let day = parts[0].length === 2 ? parseInt(parts[0]) : parseInt(parts[2]);
          return day === today;
        });

        setJadwalHariIni(todaySchedule);
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJadwal();
  }, []);

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
              <Calendar size={16} color={theme.textMuted} />
              <Text className={`text-sm ${theme.textMuted}`}>
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color={theme.iconColor} />
            </View>
          ) : jadwalHariIni ? (
            <View>
              {renderWaktuShalat("Subuh", jadwalHariIni.subuh)}
              {renderWaktuShalat("Terbit", jadwalHariIni.terbit)} {/* Opsional: bisa di-hide jika mau */}
              {renderWaktuShalat("Dzuhur", jadwalHariIni.dzuhur)}
              {renderWaktuShalat("Ashar", jadwalHariIni.ashar)}
              {renderWaktuShalat("Maghrib", jadwalHariIni.maghrib)}
              {renderWaktuShalat("Isya", jadwalHariIni.isya)}
            </View>
          ) : (
            <Text className={`text-center py-10 ${theme.textMuted}`}>Gagal memuat data jadwal.</Text>
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