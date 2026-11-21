import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { angleDiff } from "../utils/qibla";

export const ALIGN_TOLERANCE = 3; // derajat

interface Props {
  size: number;
  bearing: number | null; // arah kiblat dari Utara
  heading: number | null; // arah depan ponsel dari Utara (null = tanpa sensor)
  compact?: boolean;
}

/** Kompas: piringan berputar mengikuti heading; penanda Ka'bah di sudut `bearing`. */
export default function QiblaCompass({ size, bearing, heading, compact }: Props) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const rot = heading ?? 0;
  const diff = bearing !== null && heading !== null ? angleDiff(bearing, heading) : null;
  const aligned = diff !== null && Math.abs(diff) <= ALIGN_TOLERANCE;

  // getar sekali saat baru sejajar
  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasAligned.current = aligned;
  }, [aligned]);

  const ring = aligned ? "#059669" : isDarkMode ? "#34d399" : "#164A38";
  const face = isDarkMode ? "#10261d" : "#F6F1E4";
  const tick = isDarkMode ? "#6b8f7e" : "#9a9280";
  const markerSize = Math.max(16, size * 0.17);
  const ticks = compact ? [0, 90, 180, 270] : Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel={t("qiblaTitle")}>
      {/* piringan */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: face,
          borderWidth: compact ? 2 : 4,
          borderColor: ring,
          transform: [{ rotate: `${-rot}deg` }],
        }}
      >
        {ticks.map((a) => (
          <View
            key={a}
            style={{ position: "absolute", width: size, height: size, alignItems: "center", transform: [{ rotate: `${a}deg` }] }}
          >
            <View
              style={{
                marginTop: 2,
                width: a % 90 === 0 ? 3 : 1.5,
                height: a % 90 === 0 ? size * 0.07 : size * 0.04,
                backgroundColor: a === 0 ? "#dc2626" : tick,
                borderRadius: 2,
              }}
            />
          </View>
        ))}
        {/* label Utara */}
        <View style={{ position: "absolute", width: size, height: size, alignItems: "center" }}>
          <Text style={{ marginTop: size * 0.1, fontSize: Math.max(9, size * 0.09), fontWeight: "700", color: "#dc2626" }}>
            {t("qiblaNorthShort")}
          </Text>
        </View>
        {/* penanda Ka'bah */}
        {bearing !== null && (
          <View
            style={{ position: "absolute", width: size, height: size, alignItems: "center", transform: [{ rotate: `${bearing}deg` }] }}
          >
            <View
              style={{
                marginTop: size * 0.17,
                width: markerSize,
                height: markerSize,
                borderRadius: 4,
                backgroundColor: "#1c1917",
                borderWidth: 1,
                borderColor: "#d4a017",
                alignItems: "center",
              }}
            >
              <View style={{ marginTop: markerSize * 0.25, width: "100%", height: markerSize * 0.14, backgroundColor: "#d4a017" }} />
            </View>
            <View style={{ width: 2, height: size * 0.22, backgroundColor: aligned ? "#059669" : "#d4a017", opacity: 0.8 }} />
          </View>
        )}
      </View>

      {/* penunjuk tetap (arah depan ponsel) */}
      <View style={{ position: "absolute", top: -2, width: size, alignItems: "center" }} pointerEvents="none">
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: size * 0.06,
            borderRightWidth: size * 0.06,
            borderTopWidth: size * 0.1,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: aligned ? "#059669" : "#b91c1c",
          }}
        />
      </View>
      {/* titik pusat */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: size / 2 - 3,
          top: size / 2 - 3,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: ring,
        }}
      />
    </View>
  );
}
