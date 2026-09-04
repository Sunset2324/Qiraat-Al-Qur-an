import { View, Text } from "react-native";

export default function Mushaf() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-3xl font-bold text-emerald-600">
        Mushaf Al-Qur'an
      </Text>
      <Text className="text-gray-500 mt-2">Daftar surah dan ayat.</Text>
    </View>
  );
}
