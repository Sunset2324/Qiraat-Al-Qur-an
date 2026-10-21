// @ts-ignore NativeWind's global stylesheet is loaded at runtime.
import "../src/globals.css";

import { Slot, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Text, TextInput, Platform, PermissionsAndroid } from "react-native";
import { useEffect } from "react";
import { setAudioModeAsync } from "expo-audio";
import { useFonts, AmiriQuran_400Regular } from "@expo-google-fonts/amiri-quran";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { PlayerProvider, usePlayer } from "../src/context/PlayerContext";
import MiniPlayer from "../src/components/MiniPlayer";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Batasi pembesaran font sistem agar layout tidak pecah di HP dengan font scale besar
// (teks tetap membesar sampai 1.3x demi aksesibilitas).
(Text as any).defaultProps = { ...((Text as any).defaultProps || {}), maxFontSizeMultiplier: 1.3 };
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), maxFontSizeMultiplier: 1.3 };

// Nonaktifkan strict mode warning di development
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, 
});

// Mini player di luar tab (di dalam tab, dia ditaruh di atas tab bar oleh app/(tabs)/_layout.tsx).
// Disembunyikan hanya di splash. Layar surah juga menampilkannya.
function GlobalMiniPlayer() {
  const segments = useSegments() as string[];
  const { session } = usePlayer();
  if (!session) return null;
  if (segments.length === 0 || segments[0] === "(tabs)") return null;
  return <MiniPlayer withSafeBottom />;
}

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
      <View className="flex-1">
        <Slot />
      </View>
      <GlobalMiniPlayer />
    </View>
  );
}

export default function RootLayout() {
  // Muat font Arab sebelum menampilkan app. Kalau gagal dimuat, app tetap jalan
  // dengan font sistem (error dianggap sudah selesai).
  const [fontsLoaded, fontError] = useFonts({
    AmiriQuran_400Regular,
    UthmanicHafs: require("../assets/fonts/UthmanicHafs.otf"),
  });
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: "#fbf8ef" }} />;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <PlayerProvider>
          <RootLayoutContent />
        </PlayerProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}