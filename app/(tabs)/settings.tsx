import { View, Text } from "react-native";

export default function Settings() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-2xl font-bold text-gray-800">Pengaturan</Text>
      <Text className="text-gray-500 mt-2">Atur font, qori, dan tema.</Text>
    </View>
  );
}
