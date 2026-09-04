import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { History } from "lucide-react-native";
import { useTheme } from "../../src/context/ThemeContext";

export default function HistoryScreen() {
  const { isDarkMode, theme } = useTheme();

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      <View className={`flex-1 items-center justify-center ${theme.bg}`}>
        <View className={`p-6 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-emerald-100"} mb-4`}>
          <History size={48} color={theme.iconColor} />
        </View>
        <Text className={`text-2xl font-bold ${theme.text}`}>History</Text>
        <Text className={`mt-2 ${theme.textMuted}`}>Riwayat bacaan akan muncul di sini</Text>
      </View>
    </SafeAreaView>
  );
}