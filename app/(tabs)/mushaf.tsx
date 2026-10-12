import { useCallback, useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Headphones, ChevronRight, Bell, Search } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/context/ThemeContext";
import { getDaftarSurah } from "../../src/services/quranService";
import { ARABIC_FONT } from "../../src/constants/fonts";
import { getLastReadAyah } from "../../src/utils/readingHistory"; // Import utility baru

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
  
  const [currentMushaf, setCurrentMushaf] = useState({ id: "1", name: "Hafs 'an 'Asim" });
  const [surahList, setSurahList] = useState<SurahItem[]>([]);
  const [lastRead, setLastRead] = useState<{ nomor: number; nama: string; ayat: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadSurahList = useCallback(async () => {
    try {
      const data = await getDaftarSurah();
      setSurahList(data);
    } catch (e) {
      console.error("Gagal memuat daftar surah:", e);
    }
  }, []);

  // LOGIKA BARU: Load last read spesifik untuk Mushaf (Qiraat) yang aktif
  const loadLastRead = useCallback(async () => {
    try {
      // Kita cek surah yang paling umum dibaca atau bisa diiterasi. 
      // Untuk simplicity di card ini, kita cek surah 1 (Al-Fatihah) atau bisa disimpan global last active surah.
      // Disini saya asumsikan kita menyimpan 'last_active_surah_nomor' secara global per mushaf
      const lastActiveSurahStr = await AsyncStorage.getItem(`last_active_surah_mushaf_${currentMushaf.id}`);
      const surahNomor = lastActiveSurahStr ? parseInt(lastActiveSurahStr) : 1;
      
      const ayatNomor = await getLastReadAyah(surahNomor, currentMushaf.id);
      
      if (ayatNomor) {
        // Cari nama surah dari list
        const surah = surahList.find(s => s.nomor === surahNomor);
        if (surah) {
          setLastRead({ nomor: surahNomor, nama: surah.namaLatin, ayat: ayatNomor });
        }
      } else {
        setLastRead(null);
      }
    } catch (e) {
      console.error("Gagal memuat last read:", e);
    }
  }, [currentMushaf.id, surahList]);

  useFocusEffect(
    useCallback(() => {
      const loadPreferences = async () => {
        if (selectedMushafId && selectedMushafName) {
          const idStr = String(selectedMushafId);
          const nameStr = String(selectedMushafName);
          setCurrentMushaf({ id: idStr, name: nameStr });
          await AsyncStorage.setItem("selected_mushaf_id", idStr);
          await AsyncStorage.setItem("selected_mushaf_name", nameStr);
        } else {
          const savedId = await AsyncStorage.getItem("selected_mushaf_id");
          const savedName = await AsyncStorage.getItem("selected_mushaf_name");
          if (savedId) {
            setCurrentMushaf({ id: savedId, name: savedName || "Mushaf Terpilih" });
          }
        }
        loadSurahList();
        // Load last read setelah mushaf ditentukan
        setTimeout(() => loadLastRead(), 500); 
      };
      loadPreferences();
    }, [selectedMushafId, selectedMushafName, loadSurahList, loadLastRead])
  );

  // LOGIKA BARU: Jika ada lastRead, lempar ke ayat tersebut. Jika tidak, ke ayat 1.
  const handleOpenSurah = (nomor: number, nama: string) => {
    // Simpan surah aktif untuk mushaf ini
    AsyncStorage.setItem(`last_active_surah_mushaf_${currentMushaf.id}`, String(nomor));
    
    const params: any = { nomor: String(nomor), mushafId: currentMushaf.id };
    if (lastRead && lastRead.nomor === nomor) {
      params.ayat = String(lastRead.ayat);
    }

    router.push({
      pathname: '/screen/surah/[nomor]',
      params
    });
  };

  const filteredSurahList = useMemo(() => {
    if (!searchQuery.trim()) return surahList;
    const q = searchQuery.toLowerCase();
    return surahList.filter(
      (s) =>
        s.namaLatin.toLowerCase().includes(q) ||
        s.arti.toLowerCase().includes(q) ||
        String(s.nomor).includes(q)
    );
  }, [surahList, searchQuery]);

  const renderSurahItem = ({ item }: { item: SurahItem }) => (
    <Pressable
      onPress={() => handleOpenSurah(item.nomor, item.namaLatin)}
      className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard} mb-3 flex-row items-center active:opacity-90`}
    >
      <View className={`h-12 w-12 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"} items-center justify-center mr-4`}>
        <Text className={`text-lg font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
          {item.nomor}
        </Text>
      </View>
      
      <View className="flex-1">
        <Text className={`text-base font-bold ${theme.text}`}>{item.namaLatin}</Text>
        <Text className={`text-xs ${theme.textMuted}`}>
          {item.arti} • {item.jumlahAyat} Ayat • {item.tempatTurun === 'Mekah' ? 'Makkiyah' : 'Madaniyah'}
        </Text>
      </View>

      <Text className={`text-xl ${theme.text} mr-3`} style={{ fontFamily: ARABIC_FONT }}>
        {item.namaArab}
      </Text>
      
      <ChevronRight size={20} color={theme.iconColor} />
    </Pressable>
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View className={`px-6 pt-6 pb-4 border-b ${theme.border}`}>
        <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>ASSALAMU'ALAIKUM</Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className={`text-2xl font-bold ${theme.text}`}>Mushaf Belajar</Text>
          <Pressable className={`p-2 rounded-full border ${theme.border}`}>
            <Search size={20} color={theme.mutedColor} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredSurahList}
        keyExtractor={(item) => String(item.nomor)}
        renderItem={renderSurahItem}
        ListHeaderComponent={
          <View className="mb-6">
            <View className="mb-6">
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

            {/* Card Lanjutkan Belajar (LOGIKA IF) */}
            {lastRead ? (
              <View className="mb-6">
                <View className={`p-6 rounded-3xl ${isDarkMode ? "bg-emerald-900" : "bg-emerald-700"}`}>
                  <Text className={`text-xs font-bold tracking-[2px] ${isDarkMode ? "text-emerald-300" : "text-emerald-100"} mb-2`}>
                    LANJUTKAN BELAJAR
                  </Text>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-white mb-1">{lastRead.nama}</Text>
                      <Text className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-100"}`}>
                        Surah #{lastRead.nomor} • Ayat {lastRead.ayat}
                      </Text>
                    </View>
                    <View className={`h-14 w-14 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-500"} items-center justify-center`}>
                      <Text className={`text-xl font-bold ${isDarkMode ? "text-emerald-300" : "text-white"}`}>
                        {lastRead.nomor}
                      </Text>
                    </View>
                  </View>
                  <Pressable 
                    onPress={() => handleOpenSurah(lastRead.nomor, lastRead.nama)}
                    className={`py-3 rounded-xl ${isDarkMode ? "bg-emerald-700" : "bg-white"} items-center mt-2`}
                  >
                    <Text className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-emerald-700"}`}>
                      Lanjut ke Ayat {lastRead.ayat} ›
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="mb-6">
                <View className={`p-6 rounded-3xl border-2 border-dashed ${theme.border} items-center justify-center`}>
                  <Text className={`text-sm font-medium ${theme.textMuted}`}>
                    Belum ada tanda baca untuk {currentMushaf.name}
                  </Text>
                  <Text className={`text-xs ${theme.textMuted} mt-1`}>
                    Klik ayat di dalam surah untuk menandai
                  </Text>
                </View>
              </View>
            )}

            <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
              <Search size={20} color={theme.mutedColor} />
              <TextInput
                placeholder="Cari nama surah, arti, atau nomor..."
                	placeholderTextColor={theme.mutedColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className={`flex-1 ml-3 text-base ${theme.text}`}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Text className={`text-sm ${theme.textMuted}`}>✕</Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row items-center justify-between mb-4">
              <Text className={`text-lg font-bold ${theme.text}`}>Daftar Surah</Text>
              <Text className={`text-sm ${theme.textSecondary}`}>{filteredSurahList.length} / 114</Text>
            </View>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}