import { View, Text } from "react-native";

export default function History() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-2xl font-bold text-gray-800">Halaman History</Text>
      <Text className="text-gray-500 mt-2">
        Riwayat bacaan kamu akan muncul di sini.
      </Text>
    </View>
  );
}
