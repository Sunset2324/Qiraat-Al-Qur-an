import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    // bg-gray-50 memberikan warna latar abu-abu sangat muda agar footer putih terlihat kontras
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <Slot />
    </View>
  );
}
