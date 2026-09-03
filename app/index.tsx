import { View, Text, Pressable } from "react-native";
import { Star, DoorOpen, Globe } from "lucide-react-native";
import { colors } from "../src/constants/theme";
import { BackgroundDecoration } from "../src/components/ui/BackgroundDecoration";
import { router } from "expo-router";

/**
 * Layar Bismillah - Halaman Pembuka
 */
export default function BismillahScreen() {
  return (
    <View className="flex-1 bg-[#fbf8ef] px-7 pt-12">
      <BackgroundDecoration />

      {/* Bagian Atas */}
      <View className="flex-row items-center justify-between">
        <View className="rounded-full border border-emerald-800 px-4 py-1.5">
          <Text className="text-[11px] font-medium tracking-widest text-emerald-800">
            QIRA'AT AL-QUR'AN
          </Text>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-full border border-emerald-700">
          <Globe size={18} color={colors.emerald[700]} />
        </View>
      </View>
      <View className="mt-4 h-px w-11 self-center bg-emerald-800" />

      {/* Konten Tengah */}
      <View className="flex-1 items-center justify-center gap-5 px-2">
        <View className="h-24 w-24 rotate-45 items-center justify-center rounded-[32px] border-2 border-dashed border-emerald-700 bg-[#fffcf5]">
          <Star
            size={30}
            color={colors.emerald[700]}
            style={{ transform: [{ rotate: "-45deg" }] }}
          />
        </View>
        <Text className="text-center text-xs font-medium tracking-[2px] text-[#211d16]">
          MULAI DENGAN NAMA ALLAH
        </Text>
        <Text className="text-center text-3xl leading-[52px] text-emerald-700">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <Text className="max-w-[280px] text-center text-sm leading-6 text-[#6b6558]">
          Temukan ketenangan dalam setiap ayat, pelajari tajwid dengan penuh
          perhatian.
        </Text>

        {/* Tombol Pintu (Posisinya sudah di bawah teks, ukuran besar, navigasi ke jurnal) */}
        <Pressable
          onPress={() => router.push("/journal")}
          className="mt-6 items-center justify-center rounded-full bg-emerald-700 p-4 shadow-lg active:opacity-80"
        >
          <DoorOpen size={36} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}
