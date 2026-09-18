import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, BookOpen } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../src/context/ThemeContext";
import { getMushafList } from "../../../src/services/quranService";

interface MushafItem {
  id: string;
  name: string;
  arabic: string;
  description: string;
}

export default function QiraatScreen() {
  const { isDarkMode, theme } = useTheme();
  const { from } = useLocalSearchParams(); // Tangkap dari mana user datang
  const [mushafList, setMushafList] = useState<MushafItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMushafId, setSelectedMushafId] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMushafList();
      setMushafList(data);

      const saved = await AsyncStorage.getItem("selected_mushaf_id");
      
      if (saved && data.some((m: MushafItem) => m.id === saved)) {
        setSelectedMushafId(saved);
      } else {
        const hafsMushaf = data.find((m: MushafItem) => 
          m.name.toLowerCase().includes("hafs")
        );
        setSelectedMushafId(hafsMushaf ? hafsMushaf.id : data[0]?.id);
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

  const handleSelectMushaf = async (id: string) => {
    setSelectedMushafId(id);
    try {
      await AsyncStorage.setItem("selected_mushaf_id", id);
      const selectedName = mushafList.find(m => m.id === id)?.name || "Mushaf";
      
      Alert.alert(
        "Mushaf Terpilih", 
        `${selectedName} berhasil dipilih.`,
        [
          {
            text: "Kembali ke Mushaf Belajar",
            onPress: () => {
              // ✅ KUNCI: Navigasi balik dengan membawa data mushaf terpilih
              router.replace({
                pathname: '/(tabs)/mushaf',
                params: { 
                  selectedMushafId: id,
                  selectedMushafName: selectedName
                }
              });
            }
          }
        ]
      );
    } catch (e) {
      console.error("Gagal menyimpan preferensi Mushaf", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center`} edges={['top']}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat daftar mushaf...</Text>
      </SafeAreaView>
    );
  }

  if (!loading && mushafList.length === 0) {
    return (
      <SafeAreaView className={`flex-1 ${theme.bg} items-center justify-center p-6`} edges={['top']}>
        <BookOpen size={48} color={theme.textMuted} />
        <Text className={`mt-4 text-center font-bold ${theme.text}`}>Gagal Memuat Data</Text>
        <Pressable onPress={loadData} className={`mt-6 px-6 py-3 rounded-full ${isDarkMode ? 'bg-emerald-600' : 'bg-emerald-700'}`}>
          <Text className="text-white font-bold">Coba Muat Ulang</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>ILMU AL-QUR'AN</Text>
          <Text className={`text-base font-bold ${theme.text}`}>Pilihan Mushaf</Text>
        </View>
        <View className="w-11" /> 
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <View className="flex-row items-center gap-3 mb-2">
            <BookOpen size={20} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-sm font-bold ${theme.text}`}>Tentang Mushaf</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>
            Aplikasi ini mendukung berbagai riwayat Mushaf Al-Qur'an yang valid. Pilih mushaf yang ingin Anda gunakan sebagai tampilan default.
          </Text>
        </View>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>Daftar Mushaf Tersedia</Text>

        {mushafList.map((mushaf) => {
          const isActive = selectedMushafId === mushaf.id;
          const isStandar = mushaf.name.toLowerCase().includes("standar") || mushaf.name.toLowerCase().includes("madinah");

          return (
            <Pressable
              key={mushaf.id}
              onPress={() => handleSelectMushaf(mushaf.id)}
              className={`mb-4 p-5 rounded-2xl border-2 transition-all ${
                isActive ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : `${theme.border} ${theme.bgCard}`
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center gap-2 flex-wrap mb-1">
                    <Text className={`text-base font-bold ${isActive ? "text-emerald-700 dark:text-emerald-400" : theme.text}`}>
                      {mushaf.name}
                    </Text>
                    {isStandar && (
                      <View className="px-2 py-0.5 rounded bg-emerald-600">
                        <Text className="text-[10px] font-bold text-white">POPULER</Text>
                      </View>
                    )}
                  </View>
                  {mushaf.arabic ? (
                    <Text className={`text-sm ${theme.textMuted} text-right`} style={{ fontFamily: "System" }}>
                      {mushaf.arabic}
                    </Text>
                  ) : null}
                </View>

                <View className={`h-8 w-8 rounded-full items-center justify-center ${
                  isActive ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <Check size={16} color={isActive ? "#fff" : theme.textMuted} />
                </View>
              </View>

              <View className={`p-3 rounded-xl ${isDarkMode ? "bg-black/20" : "bg-cream-100"}`}>
                <Text className={`text-xs leading-5 ${theme.textMuted}`}>{mushaf.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}