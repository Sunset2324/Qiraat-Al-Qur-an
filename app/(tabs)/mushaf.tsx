import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Headphones, ChevronRight, Bell } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/context/ThemeContext";
import { getDaftarSurah } from "../../src/services/quranService";

interface SurahItem {
  nomor: number;
  namaLatin: string;
  namaArab: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: string;
}

export default function MushafScreen() {
  const { isDarkMode, theme } = useTheme();
  const { selectedMushafId, selectedMushafName } = useLocalSearchParams();
  
  const [currentMushaf, setCurrentMushaf] = useState({
    id: "1",
    name: "Hafs 'an 'Asim"
  });
  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [lastRead, setLastRead] = useState<{ nomor: number; nama: string } | null>(null);

  useEffect(() => {
    // ✅ KUNCI: Terima data mushaf dari halaman Qiraat
    if (selectedMushafId && selectedMushafName) {
      setCurrentMushaf({
        id: String(selectedMushafId),
        name: String(selectedMushafName)
      });
      AsyncStorage.setItem("selected_mushaf_id", String(selectedMushafId));
    } else {
      // Fallback: baca dari AsyncStorage
      AsyncStorage.getItem("selected_mushaf_id").then(id => {
        if (id) setCurrentMushaf(prev => ({ ...prev, id }));
      });
    }

    // Load daftar surah
    loadSurahList();
    loadLastRead();
  }, [selectedMushafId, selectedMushafName]);

  const loadSurahList = async () => {
    try {
      const data = await getDaftarSurah();
      setSurahList(data);
    } catch (e) {
      console.error("Gagal memuat daftar surah:", e);
    }
  };

  const loadLastRead = async () => {
    try {
      const saved = await AsyncStorage.getItem("last_read_surah");
      if (saved) setLastRead(JSON.parse(saved));
    } catch (e) {
      console.error("Gagal memuat last read:", e);
    }
  };

  const handleOpenSurah = (nomor: number, nama: string) => {
    // Simpan last read
    AsyncStorage.setItem("last_read_surah", JSON.stringify({ nomor, nama }));
    
    // ✅ KUNCI: Oper mushafId ke halaman detail
    router.push({
      pathname: '/screen/surah/[nomor]',
      params: { 
        nomor: String(nomor),
        mushafId: currentMushaf.id
      }
    });
  };

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>ASSALAMU'ALAIKUM</Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text className={`text-2xl font-bold ${theme.text}`}>Mushaf Belajar</Text>
            <Pressable className={`p-2 rounded-full border ${theme.border}`}>
              <Bell size={20} color={theme.iconColor} />
            </Pressable>
          </View>
        </View>

        {/* Card Qira'at Terpilih */}
        <View className="px-6 mb-6">
          <Pressable 
            onPress={() => router.push('/screen/qiraat/qiraat')}
            className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} flex-row items-center justify-between active:opacity-90`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`p-3 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
                <Headphones size={20} color={isDarkMode ? "#34d399" : "#047857"} />
              </View>
              <View>
                <Text className={`text-xs ${theme.textSecondary}`}>Qira'at terpilih</Text>
                <Text className={`text-base font-bold ${theme.text}`}>{currentMushaf.name}</Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.iconColor} />
          </Pressable>
        </View>

        {/* Card Lanjutkan Belajar */}
        {lastRead && (
          <View className="px-6 mb-6">
            <View className={`p-6 rounded-3xl ${isDarkMode ? "bg-emerald-900" : "bg-emerald-700"}`}>
              <Text className={`text-xs font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-100"} mb-2`}>
                LANJUTKAN BELAJAR
              </Text>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1">
                  <Text className={`text-2xl font-bold text-white mb-1`}>{lastRead.nama}</Text>
                  <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
                    Surah #{lastRead.nomor}
                  </Text>
                </View>
                <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-500"} items-center justify-center`}>
                  <Text className={`text-xl font-bold ${isDarkMode ? "text-emerald-300" : "text-white"}`}>
                    {lastRead.nomor}
                  </Text>
                </View>
              </View>
              
              <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"} mb-3`}>
                Progress Surah • 0 dari 7 ayat
              </Text>

              <Pressable 
                onPress={() => handleOpenSurah(lastRead.nomor, lastRead.nama)}
                className={`py-3 rounded-xl ${isDarkMode ? "bg-emerald-700" : "bg-white"} items-center`}
              >
                <Text className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-emerald-700"}`}>
                  Buka Mushaf ›
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Perjalanan Anda */}
        <View className="px-6 mb-6">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary} mb-1`}>PERJALANAN ANDA</Text>
          <Text className={`text-lg font-bold ${theme.text} mb-4`}>30 Juz Al-Qur'an</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[1, 2, 3, 4, 5].map((juz) => (
              <Pressable 
                key={juz}
                className={`w-32 p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mr-3`}
              >
                <View className={`h-8 w-8 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} items-center justify-center mb-3`}>
                  <Text className={`text-sm font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>{juz}</Text>
                </View>
                <Text className={`text-base font-bold ${theme.text} mb-2`}>Juz {juz}</Text>
                <View className={`h-1 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} mb-2`}>
                  <View className={`h-1 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-500"}`} style={{ width: '0%' }} />
                </View>
                <Text className={`text-xs ${theme.textMuted}`}>0%</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Surah untuk dipelajari */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${theme.text}`}>Surah untuk dipelajari</Text>
            <Text className={`text-sm ${theme.textSecondary}`}>114 Surah</Text>
          </View>

          {surahList.slice(0, 10).map((surah) => (
            <Pressable
              key={surah.nomor}
              onPress={() => handleOpenSurah(surah.nomor, surah.namaLatin)}
              className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-3 flex-row items-center active:opacity-90`}
            >
              <View className={`h-12 w-12 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"} items-center justify-center mr-4`}>
                <Text className={`text-lg font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                  {surah.nomor}
                </Text>
              </View>
              
              <View className="flex-1">
                <Text className={`text-base font-bold ${theme.text}`}>{surah.namaLatin}</Text>
                <Text className={`text-xs ${theme.textMuted}`}>
                  {surah.arti} • {surah.jumlahAyat} Ayat • {surah.tempatTurun === 'Mekah' ? 'Makkiyah' : 'Madaniyah'}
                </Text>
              </View>

              <Text className={`text-xl ${theme.text} mr-3`} style={{ fontFamily: "System" }}>
                {surah.namaArab}
              </Text>
              
              <ChevronRight size={20} color={theme.iconColor} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}