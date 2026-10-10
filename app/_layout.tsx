// @ts-ignore NativeWind's global stylesheet is loaded at runtime.
import "../src/globals.css";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform, PermissionsAndroid } from "react-native";
import { useEffect } from "react";
import { setAudioModeAsync } from "expo-audio";
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
        await setAudioModeAsync({
          playsInSilentMode: true, // tetap bunyi meski HP mode silent (iOS)
          shouldPlayInBackground: true, // tetap jalan saat app di-minimize
          interruptionMode: "doNotMix", // wajib doNotMix agar kontrol lock screen/notifikasi aktif
        });
      } catch (error) {
        console.error("Gagal mengatur mode audio:", error);
      }
    };

    // Android 13+: notifikasi media butuh izin POST_NOTIFICATIONS
    const requestNotifPermission = async () => {
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
        try {
          await PermissionsAndroid.request("android.permission.POST_NOTIFICATIONS" as any);
        } catch (error) {
          console.warn("Gagal meminta izin notifikasi:", error);
        }
      }
    };

    setupAudio();
    requestNotifPermission();
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