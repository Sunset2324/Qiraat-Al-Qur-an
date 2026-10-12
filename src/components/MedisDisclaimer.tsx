import { View, Text } from "react-native";
import { Info } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";

/** Pengingat bahwa konten ini bukan pengganti nasihat medis. */
export default function MedisDisclaimer() {
  const { isDarkMode } = useTheme();
  return (
    <View
      className={`flex-row gap-3 p-4 rounded-2xl border ${
        isDarkMode ? "bg-amber-900/20 border-amber-800/40" : "bg-amber-50 border-amber-200"
      }`}
    >
      <Info size={18} color={isDarkMode ? "#fcd34d" : "#b45309"} />
      <Text className={`flex-1 text-xs leading-5 ${isDarkMode ? "text-amber-200" : "text-amber-900"}`}>
        Konten ini adalah kumpulan tema dari buku rujukan dan bukan pengganti pemeriksaan, diagnosis, atau
        pengobatan dari dokter. Jika Anda sakit atau mengalami gejala yang mengkhawatirkan, segera konsultasikan
        dengan tenaga medis.
      </Text>
    </View>
  );
}