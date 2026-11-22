import { ReactNode } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useIsTablet } from "../../hooks/useIsTablet";
import { ARABIC_FONT } from "../../constants/fonts";
import BatikPattern from "./BatikPattern";

type Props = {
  title: string;
  /** Label kecil di atas judul. */
  tag?: string;
  /** Kaligrafi Arab di sisi kanan. */
  arabic?: string;
  /** Tombol/elemen di ujung kanan (mis. hapus riwayat). */
  right?: ReactNode;
};

/**
 * Header ringkas untuk layar tab (Mushaf, Riwayat, Pengaturan).
 * Tingginya tetap rendah (±64 dp) di HP maupun tablet supaya ruang dipakai untuk isi,
 * bukan untuk header. Motif batik + kaligrafi tetap ada.
 */
export default function TabHeader({ title, tag, arabic, right }: Props) {
  const { isDarkMode, theme } = useTheme();
  const isTablet = useIsTablet();
  const pad = isTablet ? 32 : 20;

  return (
    <View
      className={`${theme.bgHeader} overflow-hidden flex-row items-center`}
      style={{ paddingHorizontal: pad, paddingVertical: 10, minHeight: 64 }}
    >
      <BatikPattern cell={36} opacity={isDarkMode ? 0.08 : 0.15} />
      <View className="flex-1" style={{ paddingEnd: 12 }}>
        {!!tag && (
          <Text numberOfLines={1} className="text-[11px] font-bold tracking-[2px] text-emerald-100">
            {tag}
          </Text>
        )}
        <Text numberOfLines={1} className="font-extrabold text-white" style={{ fontSize: isTablet ? 22 : 19 }}>
          {title}
        </Text>
      </View>
      {!!arabic && (
        <Text
          numberOfLines={1}
          style={{ fontFamily: ARABIC_FONT, fontSize: isTablet ? 26 : 24, lineHeight: isTablet ? 44 : 40, color: "#fde68a" }}
        >
          {arabic}
        </Text>
      )}
      {right ? <View style={{ marginStart: 12 }}>{right}</View> : null}
    </View>
  );
}
