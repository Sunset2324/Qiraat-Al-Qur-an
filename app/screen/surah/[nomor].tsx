import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Bookmark, Headphones, Volume2 } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";
import { getDetailSurah } from "../../../src/services/quranService";

// Type untuk Ayat
interface AyatItem {
  nomor: number;
  teksArab: string;
  teksLatin: string;
  artiIndonesia: string;
  audio: string;
}

// Type untuk Surat
interface SuratDetail {
  nomor: number;
  namaArab: string;
  namaLatin: string;
  arti: string;
  jumlahAyat: number;
  tempatTurun: string;
  ayat: AyatItem[];
  audioFull: string;
}

// Pilihan Qira'at
const QIRAAT_OPTIONS = [
  { id: 1, name: "Hafs", label: "1 Hafs", qariId: "05" },
  { id: 2, name: "Warsh", label: "2 Warsh", qariId: "01" },
  { id: 3, name: "Qalun", label: "3 Qalun", qariId: "02" },
];

export default function SurahDetailScreen() {
  const { isDarkMode, theme } = useTheme();
  const { nomor } = useLocalSearchParams();

  const [surahData, setSurahData] = useState<SuratDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQiraat, setSelectedQiraat] = useState("1 Hafs");
  const [selectedQariId, setSelectedQariId] = useState("05");
  const [showQiraatOptions, setShowQiraatOptions] = useState(false);
  const [playingAyat, setPlayingAyat] = useState<number | null>(null);

  useEffect(() => {
    loadSurahData();
  }, [nomor, selectedQariId]);

  const loadSurahData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDetailSurah(Number(nomor), selectedQariId);
      setSurahData(data);
    } catch (err) {
      setError("Gagal memuat data surat. Pastikan koneksi internet aktif.");
      console.error("Error loading surah:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logika Tombol Back Profesional
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/mushaf");
    }
  };

  const handlePlayAyat = (ayatNomor: number, audioUrl: string) => {
    if (playingAyat === ayatNomor) {
      setPlayingAyat(null);
    } else {
      setPlayingAyat(ayatNomor);
      console.log("Memutar audio:", audioUrl);
      setTimeout(() => setPlayingAyat(null), 3000);
    }
  };

  // Loading State
  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${theme.bg} items-center justify-center`}
        edges={["top"]}
      >
        <ActivityIndicator
          size="large"
          color={isDarkMode ? "#34d399" : "#047857"}
        />
        <Text className={`mt-4 ${theme.textMuted}`}>Memuat surat...</Text>
      </SafeAreaView>
    );
  }

  // Error State
  if (error || !surahData) {
    return (
      <SafeAreaView
        className={`flex-1 ${theme.bg} items-center justify-center p-6`}
        edges={["top"]}
      >
        <Text className={`text-center font-semibold mb-4 ${theme.text}`}>
          {error || "Surat tidak ditemukan"}
        </Text>
        <Pressable
          onPress={loadSurahData}
          className={`px-6 py-3 rounded-full ${isDarkMode ? "bg-emerald-600" : "bg-emerald-700"}`}
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={["top"]}>
      {/* ========== HEADER ========== */}
      <View
        className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}
      >
        {/* Tombol Back */}
        <Pressable
          onPress={handleBack}
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>

        <View className="items-center flex-1">
          <Text
            className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}
          >
            AL-QUR'AN STUDY
          </Text>
          <Text className={`text-base font-bold ${theme.text}`}>
            Mushaf Belajar
          </Text>
        </View>

        {/* Tombol Bookmark */}
        <Pressable
          className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark size={24} color={theme.iconColor} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ========== CARD BACAAN PILIHAN ========== */}
        <View
          className={`mx-6 mt-6 p-4 ${theme.bgCard} border ${theme.border} rounded-2xl`}
        >
          <Text className={`text-xs font-medium ${theme.textSecondary} mb-3`}>
            Bacaan pilihan
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => setShowQiraatOptions(!showQiraatOptions)}
              className="flex-row items-center gap-2"
            >
              <Text className={`font-bold ${theme.text}`}>Select Qira'at</Text>
              <Text className={`text-xs ${theme.textSecondary}`}>
                {showQiraatOptions ? "▲" : "▼"}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isDarkMode ? "bg-emerald-900" : "bg-[#f5f0e1]"}`}
            >
              <Headphones
                size={16}
                color={isDarkMode ? "#34d399" : "#047857"}
              />
              <Text
                className={`text-xs ${isDarkMode ? "text-emerald-300" : "text-emerald-800"}`}
              >
                Ust. Yudha
              </Text>
            </Pressable>
          </View>

          {showQiraatOptions && (
            <View
              className={`flex-row flex-wrap gap-2 mt-2 pt-3 border-t ${theme.border}`}
            >
              {QIRAAT_OPTIONS.map((qiraat) => (
                <Pressable
                  key={qiraat.id}
                  onPress={() => {
                    setSelectedQiraat(qiraat.label);
                    setSelectedQariId(qiraat.qariId);
                    setShowQiraatOptions(false);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedQiraat === qiraat.label
                      ? "bg-emerald-600"
                      : isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedQiraat === qiraat.label
                        ? "text-white"
                        : theme.text
                    }`}
                  >
                    {qiraat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ========== INFORMASI SURAT ========== */}
        <View className="px-6 mt-6 mb-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text
                className={`text-xs font-bold tracking-[2px] ${theme.textSecondary} mb-1`}
              >
                SURAH {String(surahData.nomor).padStart(2, "0")} •{" "}
                {surahData.tempatTurun === "Mekah" ? "MAKKIYAH" : "MADANIYAH"}
              </Text>
              <Text className={`text-2xl font-bold ${theme.text} mb-1`}>
                {surahData.namaLatin}
              </Text>
              <Text className={`text-sm ${theme.textMuted}`}>
                {surahData.arti} • {surahData.jumlahAyat} ayat
              </Text>
            </View>

            <View
              className={`h-12 w-12 rounded-full border-2 ${isDarkMode ? "border-emerald-600" : "border-emerald-700"} items-center justify-center`}
            >
              <Text
                className={`font-bold text-lg ${isDarkMode ? "text-emerald-400" : "text-emerald-800"}`}
              >
                {surahData.nomor}
              </Text>
            </View>
          </View>
        </View>

        {/* ========== AYAT-AYAT DENGAN TRANSLITERASI ========== */}
        <View className="px-6">
          {surahData.ayat.map((ayat) => {
            const isPlaying = playingAyat === ayat.nomor;

            return (
              <View key={ayat.nomor} className="mb-8">
                {/* Header Ayat: Nomor & Play Button */}
                <View className="flex-row items-center justify-between mb-4">
                  <View
                    className={`h-8 w-8 rounded-full ${isDarkMode ? "bg-[#f5f0e1]" : "bg-[#f5f0e1]"} items-center justify-center`}
                  >
                    <Text
                      className={`text-xs font-bold ${isDarkMode ? "text-emerald-800" : "text-emerald-800"}`}
                    >
                      {ayat.nomor}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handlePlayAyat(ayat.nomor, ayat.audio)}
                    className={`p-2 rounded-full ${isPlaying ? "bg-emerald-600" : isDarkMode ? "bg-gray-700" : "bg-gray-200"} active:opacity-70`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Volume2
                      size={18}
                      color={isPlaying ? "#fff" : theme.iconColor}
                    />
                  </Pressable>
                </View>

                {/* 1. TEKS ARAB */}
                <View className="items-center mb-3">
                  <View
                    className={`w-full p-6 rounded-2xl ${isDarkMode ? "bg-[#1a1a1a]" : "bg-[#fffcf5]"} border ${theme.border}`}
                  >
                    <Text
                      className={`text-3xl leading-[60px] text-center ${theme.text}`}
                      style={{
                        fontFamily: "System",
                        textAlign: "right",
                      }}
                    >
                      {ayat.teksArab}
                    </Text>
                  </View>
                </View>

                {/* 2. TEKS LATIN / TRANSLITERASI (BARU!) */}
                <View className="mb-3">
                  <View
                    className={`p-4 rounded-xl ${isDarkMode ? "bg-emerald-900/20" : "bg-emerald-50/70"} border ${isDarkMode ? "border-emerald-800/50" : "border-emerald-200"}`}
                  >
                    <Text
                      className={`text-base leading-7 italic ${isDarkMode ? "text-emerald-200" : "text-emerald-900"}`}
                      style={{ textAlign: "left" }}
                    >
                      {ayat.teksLatin}
                    </Text>
                  </View>
                </View>

                {/* 3. ARTI / TERJEMAHAN INDONESIA */}
                <View
                  className={`p-4 rounded-xl ${isDarkMode ? "bg-[#242424]" : "bg-[#fffcf5]"} border ${theme.border}`}
                >
                  <Text
                    className={`text-sm leading-6 ${theme.textMuted}`}
                    style={{ textAlign: "left" }}
                  >
                    {ayat.artiIndonesia}
                  </Text>
                </View>

                {/* Divider antar ayat */}
                {ayat.nomor < surahData.jumlahAyat && (
                  <View
                    className={`h-px w-full my-6 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
