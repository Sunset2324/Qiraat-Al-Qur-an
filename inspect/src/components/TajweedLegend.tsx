import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronUp, Palette } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { TAJWEED_STYLES, tajweedColor } from "../utils/tajweedColor";

/** Keterangan warna tajwid (header detail) — seperti legenda di Quranpedia. */
export default function TajweedLegend() {
  const { isDarkMode, theme } = useTheme();
  const { t, language: lang } = useLanguage();
  const [open, setOpen] = useState(true);
  const rtl = lang === "ar";

  return (
    <View className={`rounded-2xl border ${theme.border} ${theme.bgCard} mb-4 overflow-hidden`}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        className="flex-row items-center px-4 py-3 active:opacity-70"
      >
        <Palette size={18} color={isDarkMode ? "#34d399" : "#047857"} />
        <View className="flex-1 mx-3">
          <Text className={`font-bold text-sm ${theme.text}`} style={{ textAlign: rtl ? "right" : "left" }}>
            {t("tjLegendTitle")}
          </Text>
          <Text className={`text-xs mt-0.5 ${theme.textMuted}`} style={{ textAlign: rtl ? "right" : "left" }}>
            {t("tjLegendHint")}
          </Text>
        </View>
        {open ? <ChevronUp size={18} color={theme.iconColor} /> : <ChevronDown size={18} color={theme.iconColor} />}
      </Pressable>

      {open && (
        <View className={`px-4 pb-3 pt-1 border-t ${theme.border}`}>
          {TAJWEED_STYLES.map((s) => (
            <View
              key={s.key}
              className="py-2"
              style={{ flexDirection: "row", alignItems: "flex-start" }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: tajweedColor(s.key, isDarkMode),
                  marginTop: 3,
                }}
              />
              <View className="flex-1 mx-3">
                <Text className={`text-sm font-semibold ${theme.text}`} style={{ textAlign: rtl ? "right" : "left" }}>
                  {t(`tj_${s.key}`)}
                </Text>
                <Text className={`text-xs leading-5 ${theme.textMuted}`} style={{ textAlign: rtl ? "right" : "left" }}>
                  {t(`tj_${s.key}_d`)}
                </Text>
              </View>
            </View>
          ))}
          <Text className={`text-[11px] mt-2 italic ${theme.textMuted}`} style={{ textAlign: rtl ? "right" : "left" }}>
            {t("tjLegendNote")}
          </Text>
        </View>
      )}
    </View>
  );
}
