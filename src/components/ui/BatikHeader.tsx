import { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useIsTablet } from "../../hooks/useIsTablet";
import { ARABIC_FONT } from "../../constants/fonts";
import BatikPattern from "./BatikPattern";

type Props = {
  /** Judul utama (sudah diterjemahkan). */
  title: string;
  /** Label kecil di atas judul, mis. "PELAJARAN". */
  tag?: string;
  /** Kaligrafi Arab sederhana di sisi kanan header. */
  arabic?: string;
  /** Default: kembali ke layar sebelumnya. Isi null untuk menyembunyikan tombol kembali. */
  onBack?: (() => void) | null;
  /** Elemen tambahan di ujung kanan (mis. tombol muat ulang). */
  right?: ReactNode;
};

/**
 * Header standar: latar hijau + motif batik kawung + kaligrafi Arab.
 * Motif mengikuti lebar induk, jadi pas di HP, tablet, dan landscape.
 */
export default function BatikHeader({ title, tag, arabic, onBack, right }: Props) {
  const { isDarkMode, theme } = useTheme();
  const { t, flip } = useLanguage();
  const isTablet = useIsTablet();
  const pad = isTablet ? 40 : 24;
  const back = onBack === undefined ? () => router.back() : onBack;

  return (
    <View className={`${theme.bgHeader} overflow-hidden`} style={{ paddingHorizontal: pad, paddingVertical: 18 }}>
      <BatikPattern cell={42} opacity={isDarkMode ? 0.08 : 0.15} />
      <View className="flex-row items-center">
        {back && (
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            className="items-center justify-center rounded-full active:opacity-70"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.16)" }}
          >
            <ArrowLeft size={22} color="#fff" style={flip} />
          </Pressable>
        )}
        <View className="flex-1" style={{ marginStart: back ? 16 : 0 }}>
          {!!tag && (
            <Text numberOfLines={1} className="text-xs font-bold tracking-[2px] text-emerald-100">
              {tag}
            </Text>
          )}
          <Text numberOfLines={2} className="text-xl font-extrabold text-white">
            {title}
          </Text>
        </View>
        {!!arabic && (
          <Text
            numberOfLines={1}
            style={{ fontFamily: ARABIC_FONT, fontSize: 28, lineHeight: 48, color: "#fde68a", marginStart: 12, maxWidth: "40%" }}
          >
            {arabic}
          </Text>
        )}
        {right ? <View style={{ marginStart: 12 }}>{right}</View> : null}
      </View>
    </View>
  );
}
