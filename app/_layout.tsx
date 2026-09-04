// GANTI baris paling atas menjadi seperti ini:
import "../src/globals.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";

function RootLayoutContent() {
  const { isDarkMode } = useTheme();

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fbf8ef]"}`}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={isDarkMode ? "#1a1a1a" : "#fbf8ef"} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}