import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Hourglass } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import BatikHeader from "./BatikHeader";
import BatikPattern from "./BatikPattern";

type Props = { title: string; arabic?: string; description: string };

/** Layar "Segera hadir" untuk fitur yang sedang direvisi. */
export default function ComingSoon({ title, arabic, description }: Props) {
  const { isDarkMode, theme } = useTheme();
  const { t } = useLanguage();
  const accent = isDarkMode ? "#34d399" : "#047857";
  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      <BatikHeader title={title} arabic={arabic} />
      <View className="flex-1 items-center justify-center p-8">
        <View
          className={`items-center rounded-3xl overflow-hidden border p-8 ${theme.border} ${theme.bgCard}`}
          style={{ maxWidth: 460, width: "100%" }}
        >
          <BatikPattern color={accent} cell={56} opacity={0.06} strokeWidth={1.2} />
          <View className={`rounded-full p-4 mb-4 ${isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100"}`}>
            <Hourglass size={32} color={accent} />
          </View>
          <View className="rounded-full px-3 py-1 mb-3 bg-amber-400">
            <Text className="text-xs font-extrabold text-emerald-950">{t("comingSoon")}</Text>
          </View>
          <Text className={`text-sm text-center leading-6 ${theme.textSecondary}`}>{description}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
