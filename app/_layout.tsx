// @ts-ignore NativeWind's global stylesheet is loaded at runtime.
import "../src/globals.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useEffect } from "react";
import { Audio } from "expo-av"; // <-- Tambahan untuk Background Audio
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Nonaktifkan strict mode warning di development
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, 
});

function RootLayoutContent() {
  const { isDarkMode } = useTheme();

  // ─────────────────────────────────────────────────────────
  // 🎵 KONFIGURASI AUDIO GLOBAL (Background & Notifikasi Media)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, // Tetap bunyi meski HP mode silent (iOS)
          staysActiveInBackground: true, // Tetap aktif saat aplikasi di-minimize
          shouldDuckAndroid: true, // Mengecilkan volume aplikasi lain saat audio kita diputar
          playThroughEarpieceAndroid: false, // Gunakan speaker utama, bukan earpiece telepon
        });
      } catch (error) {
        console.error("Gagal mengatur mode audio:", error);
      }
    };

    setupAudio();
  }, []);

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fbf8ef]"}`}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
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