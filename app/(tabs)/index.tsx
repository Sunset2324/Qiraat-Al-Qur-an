import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FileText, Mic, Hand, BookOpen, Heart, CloudSun, Clock } from "lucide-react-native";
import { useState, useEffect } from "react";
import { useTheme } from "../../src/context/ThemeContext";
import { getJadwalShalat } from "../../src/services/quranService";

export default function DashboardScreen() {
  const { isDarkMode, theme } = useTheme();
  
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );

  // State untuk data jadwal shalat dinamis
  const [adzanTerdekat, setAdzanTerdekat] = useState<{ nama: string; waktu: string } | null>(null);
  const [loadingJadwal, setLoadingJadwal] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────────────────────
  // 🕒 LOGIKA PINTAR: Cari Waktu Shalat Berikutnya
  // ─────────────────────────────────────────────────────────
  
  // Helper: Ubah format "HH:MM" menjadi total menit untuk perbandingan
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // Helper: Cari shalat berikutnya berdasarkan waktu saat ini
  const getAdzanTerdekat = (schedule: any) => {
    if (!schedule) return { nama: 'Subuh', waktu: '--:--' };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Urutan shalat sesuai waktu
    const prayers = [
      { nama: 'Subuh', waktu: schedule.subuh },
      { nama: 'Dzuhur', waktu: schedule.dzuhur },
      { nama: 'Ashar', waktu: schedule.ashar },
      { nama: 'Maghrib', waktu: schedule.maghrib },
      { nama: 'Isya', waktu: schedule.isya },
    ];

    // Cari shalat pertama yang waktunya LEBIH BESAR dari waktu sekarang
    for (const prayer of prayers) {
      if (timeToMinutes(prayer.waktu) > currentMinutes) {
        return prayer;
      }
    }

    // Jika semua shalat hari ini sudah lewat (misal jam 23:00), berikutnya adalah Subuh BESOK
    return { nama: 'Subuh (Besok)', waktu: schedule.subuh };
  };

  // Fetch data jadwal shalat saat komponen dimuat
  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        setLoadingJadwal(true);
        const now = new Date();
        // Default lokasi: DKI Jakarta, Jakarta Selatan
        const data = await getJadwalShalat('DKI Jakarta', 'Jakarta Selatan', now.getMonth() + 1, now.getFullYear());
        
        const today = now.getDate();
        const todaySchedule = data.find((item: any) => {
          const tanggalStr = item.tanggal || item.date;
          if (!tanggalStr) return false;
          const parts = tanggalStr.split('-');
          let day = 0;
          if (parts.length === 3) {
            day = parts[0].length === 2 ? parseInt(parts[0]) : parseInt(parts[2]);
          }
          return day === today;
        });
        
        if (todaySchedule) {
          // ✅ SEKARANG DINAMIS: Otomatis cari shalat berikutnya
          const terdekat = getAdzanTerdekat(todaySchedule);
          setAdzanTerdekat(terdekat);
        }
      } catch (err) {
        console.error("Gagal memuat jadwal shalat:", err);
        // Fallback ke hardcoded jika API gagal
        setAdzanTerdekat({ nama: 'Ashar', waktu: '15:12' });
      } finally {
        setLoadingJadwal(false);
      }
    };

    fetchJadwal();
  }, []);

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        
        {/* 1. HEADER: Jam & Adzan */}
        <View className={`h-[30vh] min-h-[220px] ${theme.bgHeader} rounded-b-[40px] px-6 pt-6 relative overflow-hidden`}>
          <View className={`absolute -right-10 -top-10 h-40 w-40 ${isDarkMode ? "bg-emerald-900" : "bg-emerald-700"} rounded-full opacity-50`} />
          
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className={`text-sm font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
                Jakarta, ID
              </Text>
              <Text className={`text-4xl font-bold mt-1 tracking-tight ${isDarkMode ? "text-white" : "text-white"}`}>
                {currentTime}
              </Text>
            </View>
            <View className={`${isDarkMode ? "bg-emerald-800" : "bg-emerald-700/50"} p-3 rounded-2xl`}>
              <CloudSun size={24} color="#fbbf24" />
            </View>
          </View>

          {/* Kartu Adzan Terdekat (SEKARANG BENAR-BENAR DINAMIS) */}
          <View className={`${isDarkMode ? "bg-emerald-900/60" : "bg-emerald-700/40"} p-4 rounded-2xl border ${isDarkMode ? "border-emerald-700" : "border-emerald-600/50"} mt-2`}>
            <Text className={`text-xs font-medium mb-1 ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
              {loadingJadwal ? "Memuat jadwal..." : "Adzan Terdekat"}
            </Text>
            
            {loadingJadwal ? (
              <ActivityIndicator size="small" color="#ffffff" className="mt-1" />
            ) : (
              <View className="flex-row items-center justify-between">
                <Text className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-white"}`}>
                  {adzanTerdekat?.nama || "Memuat..."}
                </Text>
                <Text className={`text-sm ${isDarkMode ? "text-emerald-300" : "text-emerald-200"}`}>
                  {adzanTerdekat?.waktu || "--:--"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. MAIN CONTENT */}
        <View className="flex-1 px-6 -mt-16">
          
          {/* Tombol Jurnal Kesehatan */}
          <Pressable
            onPress={() => router.push("/journal")}
            className={`${theme.bgCard} rounded-3xl border ${theme.border} py-8 flex-row items-center justify-center gap-3 mb-8 shadow-sm active:opacity-90`}
          >
            <FileText size={28} color={theme.iconColor} />
            <Text className={`font-bold text-lg ${isDarkMode ? "text-gray-100" : "text-[#7a6132]"}`}>
              Jurnal Kesehatan
            </Text>
          </Pressable>

          {/* Grid Fitur */}
          <Text className={`font-bold text-lg mb-4 ${theme.text}`}>Eksplorasi Fitur</Text>
          <View className="flex-row flex-wrap justify-between mb-8">
            
            {/* Qiraat */}
            <Pressable 
              onPress={() => router.push("/screen/qiraat/qiraat")}
              className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center mb-4 shadow-sm active:opacity-90`}
            >
              <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                <Mic size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm ${theme.text}`}>Qiraat</Text>
            </Pressable>

            {/* Dzikir & Doa */}
            <Pressable 
              onPress={() => router.push("/screen/dzikir-doa/dzikir-doa")}
              className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center mb-4 shadow-sm active:opacity-90`}
            >
              <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                <Hand size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm text-center ${theme.text}`}>Dzikir & Doa</Text>
            </Pressable>

            {/* Jadwal Shalat */}
            <Pressable 
              onPress={() => router.push("/screen/jadwal-shalat/jadwal-shalat")}
              className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center mb-4 shadow-sm active:opacity-90`}
            >
              <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                <Clock size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm text-center ${theme.text}`}>Jadwal Shalat</Text>
            </Pressable>

            {/* Tajweed */}
            <Pressable 
              onPress={() => router.push("/screen/tajweed/tajweed")}
              className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center shadow-sm active:opacity-90`}
            >
              <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                <BookOpen size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm ${theme.text}`}>Tajweed</Text>
            </Pressable>

            {/* Thibbun Nabawi */}
            <Pressable 
              onPress={() => router.push("/screen/thibbun-nabawi/thibbun-nabawi")}
              className={`w-[48%] ${theme.bgCard} p-4 rounded-2xl border ${theme.border} items-center shadow-sm active:opacity-90`}
            >
              <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                <Heart size={28} color={theme.iconColor} />
              </View>
              <Text className={`font-bold text-sm text-center ${theme.text}`}>Thibbun Nabawi</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}