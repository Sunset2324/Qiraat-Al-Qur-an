import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Copy, Share2 } from "lucide-react-native";
import { useTheme } from "../../../../src/context/ThemeContext";
import { getDetailDoa } from "../../../../src/services/quranService";

export default function DoaDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { id } = useLocalSearchParams();
  
  const [doa, setDoa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await getDetailDoa(Number(id));
      setDoa(data);
    } catch (error) {
      console.error("Gagal memuat detail doa:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !doa) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${theme.bg}`}>
        <ActivityIndicator size="large" color={isDarkMode ? "#34d399" : "#047857"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* HEADER */}
      <View className={`flex-row items-center justify-between px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="p-1">
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <Text className={`text-base font-bold ${theme.text}`}>Detail Doa</Text>
        <View className="flex-row gap-4">
          <Pressable className="p-1"><Copy size={22} color={theme.iconColor} /></Pressable>
          <Pressable className="p-1"><Share2 size={22} color={theme.iconColor} /></Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* JUDUL & KATEGORI */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View className={`px-3 py-1 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"}`}>
              <Text className={`text-xs font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}>
                {doa.grup || "Umum"}
              </Text>
            </View>
          </View>
          <Text className={`text-2xl font-bold ${theme.text} leading-tight`}>
            {doa.judul}
          </Text>
        </View>

        {/* TEKS ARAB */}
        <View className="px-6 mb-6">
          <View className={`p-6 rounded-3xl ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fffcf5]"} border ${theme.border} items-center`}>
            <Text 
              className={`text-3xl leading-[50px] text-center ${theme.text}`}
              style={{ fontFamily: "System", textAlign: "right" }}
            >
              {doa.doa}
            </Text>
          </View>
        </View>

        {/* TEKS LATIN (Opsional, jika ada di backend) */}
        {doa.latin && (
          <View className="px-6 mb-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-2 uppercase tracking-wider`}>
              Cara Baca
            </Text>
            <Text className={`text-base italic leading-6 ${theme.textMuted}`}>
              "{doa.latin}"
            </Text>
          </View>
        )}

        {/* ARTI / TERJEMAHAN */}
        <View className="px-6 mb-6">
          <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>
            Arti / Terjemahan
          </Text>
          <View className={`p-5 rounded-2xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-50"} border ${isDarkMode ? "border-emerald-800" : "border-emerald-200"}`}>
            <Text className={`text-base leading-7 ${theme.text}`} style={{ textAlign: "left" }}>
              {doa.arti}
            </Text>
          </View>
        </View>

        {/* TAGS (Opsional) */}
        {doa.tags && doa.tags.length > 0 && (
          <View className="px-6">
            <Text className={`text-sm font-semibold ${theme.textSecondary} mb-3 uppercase tracking-wider`}>
              Terkait
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {doa.tags.map((tag: string, index: number) => (
                <View key={index} className={`px-4 py-2 rounded-lg ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                  <Text className={`text-xs font-medium ${theme.text}`}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}