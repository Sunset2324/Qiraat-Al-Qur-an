import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Bookmark, Headphones, Volume2 } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDetailSurahMerged } from "../../../src/services/quranService";
import { useAudio } from "../../../src/hooks/useAudio";
import AudioPlayer from "../../../src/components/AudioPlayer";

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
  };
  audioFull?: string;
  ayat: AyatItem[];
}

const QIRAAT_OPTIONS = [
  { id: "05", label: "Mishary Rashid Alafasy", qariId: "05" },
  { id: "01", label: "Abdurrahman As-Sudais", qariId: "01" },
  { id: "03", label: "Abdul Basit Abdul Samad", qariId: "03" },
  { id: "04", label: "Sa'ad Al-Ghamdi", qariId: "04" },
  { id: "02", label: "Maher Al-Muaiqly", qariId: "02" },
];

export default function SurahDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { nomor, mushafId: routeMushafId } = useLocalSearchParams();
  
  const [surahData, setSurahData] = useState<SuratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQariId, setSelectedQariId] = useState("05");
  const [showQiraatOptions, setShowQiraatOptions] = useState(false);
  const [playingAyat, setPlayingAyat] = useState<number | null>(null);
  const [activeMushafId, setActiveMushafId] = useState<string>("hafs");

  const activeQariName = QIRAAT_OPTIONS.find(q => q.qariId === selectedQariId)?.label || "Mishary Rashid Alafasy";
  const { playAudio } = useAudio();

  // ✅ KUNCI: Prioritaskan mushafId dari route params, fallback ke AsyncStorage
  useEffect(() => {
    const loadSurahData = async () => {
      if (!nomor) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 1. Tentukan mushafId: dari route > AsyncStorage > default "hafs"
        let mushafIdToUse = "hafs";
        
        if (routeMushafId) {
          mushafIdToUse = String(routeMushafId);
        } else {
          const saved = await AsyncStorage.getItem("selected_mushaf_id");
          if (saved) mushafIdToUse = saved;
        }
        
        setActiveMushafId(mushafIdToUse);
        
        console.log(`📖 Loading surah ${nomor} dengan mushaf: ${mushafIdToUse}`);
        
        // 2. Panggil endpoint MERGED dengan mushafId yang benar
        const data = await getDetailSurahMerged(Number(nomor), mushafIdToUse, selectedQariId);
        
        console.log('✅ Data berhasil dimuat, mushaf aktif:', data.info.mushafAktif);
        setSurahData(data);
      } catch (err: any) {
        console.error('❌ Error loading surah:', err.message);
        setError("Gagal memuat data surat. Pastikan koneksi internet aktif.");
      } finally {
        setLoading(false);
      }
    };

    loadSurahData();
  }, [nomor, selectedQariId, routeMushafId]);

  const handleBack = () => {
    router.replace('/(tabs)/mushaf');
  };

  const handlePlayAyat = async (ayatNomor: number, audioUrl: string) => {
    setPlayingAyat(ayatNomor);
    console.log("Memutar audio ayat:", audioUrl);
    await playAudio(audioUrl);
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={['top']}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat surat...</Text>
      </SafeAreaView>
    );
  }

  if (error || !surahData) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={['top']}>
        <Text className={`text-center font-semibold mb-4 ${theme.text}`}>
          {error || "Surat tidak ditemukan"}
        </Text>
        <Pressable 
          onPress={() => { setLoading(true); setError(null); }} 
          className={`px-6 py-3 rounded-full ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-700'}`}
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const audioFullUrl = surahData.audioFull || (surahData.ayat[0]?.audio 
  ? surahData.ayat[0].audio.replace(/\/\d{3}\.mp3$/, '/000.mp3')
  : undefined);

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={handleBack} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>

        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>AL-QUR'AN STUDY</Text>
          <Text className={`text-base font-bold ${theme.text}`}>Mushaf Belajar</Text>
        </View>

        <Pressable className="h-11 w-11 items-center justify-center rounded-full active:opacity-70" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Bookmark size={24} color={theme.iconColor} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. CARD BACAAN PILIHAN */}
        <View className={`mx-6 mt-6 p-4 ${theme.bgCard} border ${theme.border} rounded-2xl`}>
          <Text className={`text-xs font-medium ${theme.textSecondary} mb-3`}>Bacaan pilihan</Text>
          
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={() => setShowQiraatOptions(!showQiraatOptions)} className="flex-row items-center gap-2">
              <Text className={`font-bold ${theme.text}`}>Pilih Qari</Text>
              <Text className={`text-xs ${theme.textSecondary}`}>{showQiraatOptions ? "▲" : "▼"}</Text>
            </Pressable>

            <Pressable onPress={() => setShowQiraatOptions(!showQiraatOptions)} className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"}`}>
              <Headphones size={16} color={isDarkMode ? "#34d399" : "#047857"} />
              <Text className={`text-xs font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                {activeQariName}
              </Text>
            </Pressable>
          </View>

          {showQiraatOptions && (
            <View className={`flex-row flex-wrap gap-2 mt-2 pt-3 border-t ${theme.border}`}>
              {QIRAAT_OPTIONS.map((qiraat) => (
                <Pressable
                  key={qiraat.id}
                  onPress={() => { setSelectedQariId(qiraat.qariId); setShowQiraatOptions(false); }}
                  className={`px-4 py-2 rounded-full ${selectedQariId === qiraat.qariId ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                  <Text className={`text-xs font-medium ${selectedQariId === qiraat.qariId ? "text-white" : theme.text}`}>
                    {qiraat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 2. INFORMASI SURAT */}
        <View className="px-6 mt-6 mb-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary} mb-1`}>
                SURAH {String(surahData.info.nomor).padStart(2, '0')} • {surahData.info.tempatTurun === 'Mekah' ? 'MAKKIYAH' : 'MADANIYAH'}
              </Text>
              <Text className={`text-2xl font-bold ${theme.text} mb-1`}>{surahData.info.namaLatin}</Text>
              <Text className={`text-sm ${theme.textMuted}`}>{surahData.info.arti} • {surahData.info.jumlahAyat} ayat</Text>
              
              {/* ✅ Tampilkan mushaf aktif yang BENAR */}
              <View className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 self-start">
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                   Mushaf: {surahData.info.mushafAktif}
                </Text>
              </View>
            </View>

            <View className={`h-12 w-12 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-700"} items-center justify-center`}>
              <Text className={`font-bold text-lg ${isDarkMode ? "text-emerald-400" : "text-emerald-800"}`}>{surahData.info.nomor}</Text>
            </View>
          </View>
        </View>

        {/* 3. AUDIO PLAYER FULL SURAH */}
        {audioFullUrl ? (
          <View className="px-6 mb-4">
            <AudioPlayer 
              audioUrl={audioFullUrl} 
              title={`Murottal Full: ${surahData.info.namaLatin}`}
            />
          </View>
        ) : (
          <View className="px-6 mb-4">
            <View className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} items-center`}>
              <Text className={`text-sm ${theme.textMuted}`}>
                🎵 Audio full surah tidak tersedia untuk mushaf ini
              </Text>
            </View>
          </View>
        )}

        {/* 4. AYAT-AYAT */}
        <View className="px-6">
          {surahData.ayat.map((ayat) => {
            const isPlaying = playingAyat === ayat.nomor;

            return (
              <View key={ayat.nomor} className="mb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <View className={`h-8 w-8 rounded-full ${isDarkMode ? "bg-[#f5f0e1]" : "bg-[#f5f0e1]"} items-center justify-center`}>
                    <Text className={`text-xs font-bold text-emerald-800`}>{ayat.nomor}</Text>
                  </View>

                  <Pressable 
                    onPress={() => handlePlayAyat(ayat.nomor, ayat.audio)}
                    className={`p-2 rounded-full ${isPlaying ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"} active:opacity-70`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Volume2 size={18} color={isPlaying ? "#fff" : theme.iconColor} />
                  </Pressable>
                </View>

                <View className="items-center mb-4">
                  <Text className={`text-3xl leading-[60px] text-center ${theme.text}`} style={{ fontFamily: "System", textAlign: "right" }}>
                    {ayat.teksArab}
                  </Text>
                </View>

                <View className={`p-4 rounded-xl ${isDarkMode ? "bg-[#242424]" : "bg-[#fffcf5]"} border ${theme.border}`}>
                  <Text className={`text-sm leading-6 ${theme.textMuted}`} style={{ textAlign: "center" }}>
                    {ayat.teksIndonesia}
                  </Text>
                </View>

                {ayat.nomor < surahData.info.jumlahAyat && (
                  <View className={`h-px w-full my-6 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}