import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Clock } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

// TODO: Sambungkan ke endpoint backend jadwal shalat (komentar di dashboard
// bilang "Backend Sudah Siap") lewat src/services/quranService.ts.
// Screen ini sementara jadi placeholder supaya tombol "Jadwal Shalat"
// di dashboard tidak lagi mengarah ke route yang tidak ada (Unmatched Route).
export default function JadwalShalatScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <View className={`flex-row items-center px-6 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color={theme.iconColor} />
        </Pressable>
        <Text className={`ml-2 text-lg font-bold ${theme.text}`}>Jadwal Shalat</Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Clock size={48} color={theme.iconColor} />
        <Text className={`mt-4 text-center font-semibold ${theme.text}`}>
          Segera Hadir
        </Text>
        <Text className={`mt-2 text-center text-sm ${theme.textMuted}`}>
          Jadwal shalat akan tampil di sini setelah endpoint backend disambungkan.
        </Text>
      </View>
    </SafeAreaView>
  );
}