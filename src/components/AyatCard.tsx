import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Bookmark, Volume2 } from "lucide-react-native";
import { QURAN_FONT } from "../constants/fonts";
import TajweedText from "./TajweedText";

export interface AyatCardProps {
  nomor: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  hasAudio: boolean;
  isActive: boolean;
  isPlaying: boolean;
  isLastRead: boolean;
  isDark: boolean;
  isTajweed: boolean;
  isArabicUi: boolean;
  compact: boolean;
  showLatin: boolean;
  showTranslation: boolean;
  // Class tema berupa string (primitif) supaya React.memo bisa membandingkan murah
  borderClass: string;
  cardClass: string;
  textClass: string;
  mutedClass: string;
  iconColor: string;
  lastReadLabel: string;
  markLabel: string;
  onLayoutY: (nomor: number, y: number) => void;
  onMark: (nomor: number) => void;
  onPlay: (nomor: number) => void;
}

// Kartu satu ayat. Dibungkus memo: saat ayat aktif berpindah / state layar berubah,
// hanya kartu yang propsnya berubah yang dirender ulang (bukan ratusan kartu sekaligus).
function AyatCardBase(p: AyatCardProps) {
  const stateClass = p.isActive
    ? p.isDark ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-500 bg-emerald-50"
    : p.isLastRead
    ? p.isDark ? "border-amber-700 bg-amber-900/10" : "border-amber-300 bg-amber-50"
    : `${p.borderClass} ${p.cardClass}`;

  const arabFont = p.compact ? 26 : 30;
  const arabLine = p.compact ? 64 : 76;
  const align = p.isArabicUi ? "right" : "left";

  return (
    <View
      onLayout={(e) => p.onLayoutY(p.nomor, e.nativeEvent.layout.y)}
      className={`rounded-3xl border ${stateClass}`}
      style={{ marginBottom: p.compact ? 14 : 18, padding: p.compact ? 16 : 20 }}
    >
      {p.isLastRead && (
        <View className="flex-row items-center gap-1 mb-3">
          <Bookmark size={12} color={p.isDark ? "#fbbf24" : "#b45309"} fill={p.isDark ? "#fbbf24" : "#b45309"} />
          <Text className={`text-[11px] font-semibold flex-shrink ${p.isDark ? "text-amber-400" : "text-amber-700"}`} numberOfLines={1}>
            {p.lastReadLabel}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-5">
        <Pressable
          onPress={() => p.onMark(p.nomor)}
          accessibilityRole="button"
          accessibilityLabel={p.markLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className={`h-9 min-w-[36px] px-2 rounded-full ${p.isLastRead ? "bg-amber-200" : p.isDark ? "bg-emerald-900/40" : "bg-[#f5f0e1]"} items-center justify-center active:opacity-70`}
        >
          <Text className={`text-xs font-bold ${p.isDark && !p.isLastRead ? "text-emerald-300" : "text-emerald-800"}`}>{p.nomor}</Text>
        </Pressable>

        <Pressable
          onPress={() => p.onPlay(p.nomor)}
          disabled={!p.hasAudio}
          className={`p-2.5 rounded-full ${p.isPlaying ? "bg-emerald-600" : p.isDark ? "bg-gray-700" : "bg-gray-200"} active:opacity-70 ${!p.hasAudio ? "opacity-30" : ""}`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Volume2 size={18} color={p.isPlaying ? "#fff" : p.iconColor} />
        </Pressable>
      </View>

      <Text
        className={p.textClass}
        style={{
          writingDirection: "rtl",
          textAlign: "right",
          fontSize: arabFont,
          lineHeight: arabLine,
          includeFontPadding: false,
          textAlignVertical: "center",
          fontFamily: QURAN_FONT,
        }}
      >
        {p.isTajweed ? <TajweedText text={p.teksArab} isDark={p.isDark} /> : p.teksArab}
      </Text>

      {p.showLatin && !!p.teksLatin && (
        <Text
          className={`text-[13px] italic leading-6 ${p.isDark ? "text-emerald-400" : "text-emerald-700"}`}
          style={{ textAlign: align, marginTop: 14 }}
        >
          {p.teksLatin}
        </Text>
      )}
      {p.showTranslation && (
        <Text className={`text-sm leading-7 ${p.mutedClass}`} style={{ textAlign: align, marginTop: p.showLatin && !!p.teksLatin ? 8 : 14 }}>
          {p.teksIndonesia}
        </Text>
      )}
    </View>
  );
}

const AyatCard = memo(AyatCardBase);
export default AyatCard;
