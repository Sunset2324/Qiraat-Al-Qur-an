import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Search, Heart, Pill, Droplet, Leaf } from "lucide-react-native";
import { useTheme } from "../../../src/context/ThemeContext";

// Data dummy Thibbun Nabawi (nanti bisa diganti dengan API)
const THIBBUN_NABAWI_DATA = [
  {
    id: 1,
    kategori: "Madu",
    judul: "Manfaat Madu untuk Kesehatan",
    deskripsi: "Madu adalah obat yang sangat baik untuk berbagai penyakit. Rasulullah SAW bersabda: 'Hendaklah kalian menggunakan dua obat, yaitu madu dan Al-Qur'an.'",
    icon: Droplet,
  },
  {
    id: 2,
    kategori: "Habbatus Sauda",
    judul: "Jintan Hitam (Black Seed)",
    deskripsi: "Habbatus Sauda dapat menyembuhkan segala penyakit kecuali kematian. Kaya akan antioksidan dan meningkatkan sistem imun.",
    icon: Pill,
  },
  {
    id: 3,
    kategori: "Kurma",
    judul: "Kurma Ajwa",
    deskripsi: "Barangsiapa makan tujuh butir kurma Ajwa di pagi hari, maka racun dan sihir tidak akan membahayakannya pada hari itu.",
    icon: Heart,
  },
  {
    id: 4,
    kategori: "Zaitun",
    judul: "Minyak Zaitun",
    deskripsi: "Makanlah minyak zaitun dan gunakanlah untuk minyak rambut, karena ia berasal dari pohon yang penuh berkah.",
    icon: Leaf,
  },
];

export default function ThibbunNabawiScreen() {
  const { isDarkMode, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = THIBBUN_NABAWI_DATA.filter((item) =>
    item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className={`flex-1 ${theme.bg}`} edges={['top']}>
      {/* HEADER */}
      <View className={`flex-row items-center justify-between px-4 py-4 border-b ${theme.border}`}>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-full active:opacity-70">
          <ArrowLeft size={24} color={theme.iconColor} />
        </Pressable>
        <View className="items-center flex-1">
          <Text className={`text-xs font-bold tracking-[2px] ${theme.textSecondary}`}>KESEHATAN</Text>
          <Text className={`text-base font-bold ${theme.text}`}>Thibbun Nabawi</Text>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        {/* Search Bar */}
        <View className={`flex-row items-center px-4 py-3 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <Search size={20} color={theme.textMuted} />
          <TextInput
            placeholder="Cari pengobatan..."
            placeholderTextColor={theme.textMuted}
            className={`flex-1 ml-3 ${theme.text}`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Info Card */}
        <View className={`p-5 rounded-2xl border ${theme.border} ${theme.bgCard} mb-6`}>
          <View className="flex-row items-center gap-3 mb-2">
            <Heart size={20} color={isDarkMode ? "#34d399" : "#047857"} />
            <Text className={`text-sm font-bold ${theme.text}`}>Tentang Thibbun Nabawi</Text>
          </View>
          <Text className={`text-xs leading-5 ${theme.textMuted}`}>
            Thibbun Nabawi adalah pengobatan yang didasarkan pada petunjuk Rasulullah SAW melalui hadis-hadis beliau. 
            Pengobatan ini menggabungkan aspek spiritual dan fisik untuk kesembuhan yang holistik.
          </Text>
        </View>

        <Text className={`text-lg font-bold ${theme.text} mb-4`}>Pengobatan Alami</Text>

        {/* List Items */}
        {filteredData.map((item) => {
          const IconComponent = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/screen/thibbun-nabawi/${item.id}`)}
              className={`mb-4 p-5 rounded-2xl border ${theme.border} ${theme.bgCard} active:opacity-90`}
            >
              <View className="flex-row items-start gap-4">
                <View className={`p-3 rounded-xl ${isDarkMode ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
                  <IconComponent size={24} color={isDarkMode ? "#34d399" : "#047857"} />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1`}>
                    {item.kategori}
                  </Text>
                  <Text className={`text-base font-bold ${theme.text} mb-2`}>
                    {item.judul}
                  </Text>
                  <Text className={`text-xs leading-5 ${theme.textMuted}`}>
                    {item.deskripsi}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {filteredData.length === 0 && (
          <View className="items-center justify-center py-12">
            <Search size={48} color={theme.textMuted} />
            <Text className={`mt-4 text-center ${theme.textMuted}`}>
              Tidak ada hasil pencarian
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}