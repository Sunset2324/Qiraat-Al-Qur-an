import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert, X } from "lucide-react-native";
import { useSecurity } from "../context/SecurityContext";
import { useLanguage } from "../context/LanguageContext";

/** Kartu peringatan melayang di atas layar. VPN/proxy = merah (tidak bisa ditutup); mode terbatas = kuning. */
export default function SecurityBanner() {
  const { apiBlocked, restricted, recheck } = useSecurity();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [hidden, setHidden] = useState(false);
  const rtl = language === "ar";

  if (!apiBlocked && (!restricted || hidden)) return null;

  const danger = apiBlocked;
  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", top: insets.top + 6, left: 12, right: 12, zIndex: 999 }}
    >
      <View
        style={{
          backgroundColor: danger ? "#B91C1C" : "#B45309",
          borderRadius: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          elevation: 6,
        }}
      >
        <ShieldAlert size={20} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13, textAlign: rtl ? "right" : "left" }}>
            {t(danger ? "guardNetTitle" : "guardRestrictedTitle")}
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 2, textAlign: rtl ? "right" : "left" }}>
            {t(danger ? "guardNetMsg" : "guardRestrictedMsg")}
          </Text>
        </View>
        {danger ? (
          <Pressable onPress={recheck} hitSlop={8} accessibilityRole="button">
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12, textDecorationLine: "underline" }}>
              {t("guardRecheck")}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setHidden(true)} hitSlop={10} accessibilityRole="button">
            <X size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
